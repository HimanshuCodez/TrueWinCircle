import { useState, useRef, useEffect } from "react";
import { doc, onSnapshot, runTransaction, collection } from 'firebase/firestore';
import { db } from '../firebase';
import useAuthStore from '../store/authStore';
import { toast } from 'react-toastify';
import { IndianRupee } from 'lucide-react';

export default function CasinoRoulette() {
  const [recent, setRecent] = useState([7, 24, 12, 0, 19]);
  const [spinning, setSpinning] = useState(false);
  const [winningNumber, setWinningNumber] = useState(null);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef(null);

  const [balance, setBalance] = useState(0);
  const [betAmount, setBetAmount] = useState("");
  const [selectedBetType, setSelectedBetType] = useState(null); // e.g., 'red', 'black', 'even', 'odd', '1-18', '19-36', or a specific number
  const [bettingLoading, setBettingLoading] = useState(false);

  const { user } = useAuthStore();

  // Fetch user balance
  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setBalance(docSnap.data().balance || 0);
        } else {
          setBalance(0);
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  const spinWheel = () => {
    if (spinning) return;

    // --- Bet Validation and Deduction (New Logic) ---
    const parsedBetAmount = parseFloat(betAmount);

    if (!user) {
      toast.error("Please log in to place a bet.");
      return;
    }
    if (!selectedBetType) {
      toast.error("Please select a bet type.");
      return;
    }
    if (isNaN(parsedBetAmount) || parsedBetAmount <= 0) {
      toast.error("Please enter a valid bet amount.");
      return;
    }
    if (parsedBetAmount > balance) {
      toast.error("Insufficient balance.");
      return;
    }

    setBettingLoading(true);

    try {
      runTransaction(db, async (transaction) => {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await transaction.get(userDocRef);

        if (!userDoc.exists()) {
          throw "User document does not exist!";
        }

        const currentBalance = userDoc.data().balance || 0;

        if (currentBalance < parsedBetAmount) {
          throw "Insufficient balance in transaction.";
        }

        // Deduct balance
        transaction.update(userDocRef, { balance: currentBalance - parsedBetAmount });

        // Record bet
        const betsCollectionRef = collection(db, 'rouletteBets');
        transaction.set(doc(betsCollectionRef), {
          userId: user.uid,
          betType: selectedBetType,
          betAmount: parsedBetAmount,
          timestamp: new Date(),
          status: 'pending',
          winningNumber: null, // Will be updated after spin
          payout: 0,
        });
      });

      toast.success("Bet placed! Spinning the wheel...");
      setBettingLoading(false);
      setSpinning(true);
      setWinningNumber(null);

      const newWinningNumber = Math.floor(Math.random() * 37); // 0-36
      const randomFullRotations = Math.floor(Math.random() * 6) + 5; // 5-10 rotations
      const randomStopAngle = Math.floor(Math.random() * 360); // Random angle within 360 degrees

      // Calculate the exact angle for the winning number
      // Assuming 37 numbers (0-36) evenly spaced on the wheel
      const anglePerNumber = 360 / 37;
      const targetAngle = newWinningNumber * anglePerNumber;

      // Adjust final rotation to land on the target angle
      const finalRotation = rotation + randomFullRotations * 360 + (360 - targetAngle);

      setRotation(finalRotation);

      setTimeout(() => {
        setSpinning(false);
        setWinningNumber(newWinningNumber);
        setRecent((prevRecent) => [newWinningNumber, ...prevRecent].slice(0, 5));

        // --- Payout Logic (New Logic) ---
        handlePayout(newWinningNumber, selectedBetType, parsedBetAmount);

        // Reset bet inputs
        setBetAmount("");
        setSelectedBetType(null);
      }, 5000); // Spin duration

    } catch (e) {
      console.error("Bet placement failed: ", e);
      toast.error(`Failed to place bet: ${e.message || e}`);
      setBettingLoading(false);
    }
  };

  const handlePayout = async (resultNumber, betType, betAmount) => {
    let payoutMultiplier = 0;
    let isWinner = false;

    // Determine if the bet wins and calculate multiplier
    const isRed = (num) => [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(num);
    const isBlack = (num) => [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35].includes(num);
    const isEven = (num) => num !== 0 && num % 2 === 0;
    const isOdd = (num) => num !== 0 && num % 2 !== 0;

    if (betType === 'red' && isRed(resultNumber)) { isWinner = true; payoutMultiplier = 2; }
    else if (betType === 'black' && isBlack(resultNumber)) { isWinner = true; payoutMultiplier = 2; }
    else if (betType === 'even' && isEven(resultNumber)) { isWinner = true; payoutMultiplier = 2; }
    else if (betType === 'odd' && isOdd(resultNumber)) { isWinner = true; payoutMultiplier = 2; }
    else if (betType === '1-18' && resultNumber >= 1 && resultNumber <= 18) { isWinner = true; payoutMultiplier = 2; }
    else if (betType === '19-36' && resultNumber >= 19 && resultNumber <= 36) { isWinner = true; payoutMultiplier = 2; }
    else if (parseInt(betType) === resultNumber) { isWinner = true; payoutMultiplier = 35; } // Direct number bet

    if (isWinner) {
      const winnings = betAmount * payoutMultiplier;
      try {
        await runTransaction(db, async (transaction) => {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await transaction.get(userDocRef);

          if (!userDoc.exists()) {
            throw "User document does not exist for payout!";
          }

          const currentWinningMoney = userDoc.data().winningMoney || 0;
          transaction.update(userDocRef, { winningMoney: currentWinningMoney + winnings });
        });
        toast.success(`Congratulations! You won ₹${winnings.toFixed(2)}!`);
      } catch (e) {
        console.error("Payout transaction failed: ", e);
        toast.error("Failed to credit winnings.");
      }
    } else {
      toast.info("Better luck next time!");
    }
  };

  return (
    <div className="p-6 bg-[#042346] min-h-screen text-white font-roboto flex flex-col items-center">
      <h2 className="text-3xl font-bold mb-6 text-center text-yellow-400">
        Spin Wheel Game
      </h2>

      {/* User Balance Display */}
      <div className="mb-6 p-4 bg-[#0a2d55] text-white rounded-lg shadow-md flex justify-between items-center w-full max-w-5xl">
        <span className="text-lg font-semibold">Your Balance:</span>
        <span className="text-2xl font-bold flex items-center">
          <IndianRupee className="w-6 h-6 mr-1" />{balance.toFixed(2)}
        </span>
      </div>

      {/* Centered container */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left - Roulette Table */}
        <div className="bg-gray-800 rounded-lg p-6 flex flex-col items-center justify-center shadow-lg space-y-8">
          {/* Wheel */}
          <div
            ref={wheelRef}
            className="w-40 h-40 rounded-full bg-black flex items-center justify-center relative"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? "transform 5s ease-out" : "none",
            }}
          >
            {/* Red/Black Sections */}
            <div className="absolute w-full h-1/2 bg-red-600 top-0 left-0 rounded-t-full"></div>
            <div className="absolute w-full h-1/2 bg-black bottom-0 left-0 rounded-b-full"></div>
            {/* Winning Number Display */}
            <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center font-bold text-black relative z-10 text-xl">
              {winningNumber !== null ? winningNumber : "0"}
            </div>
          </div>

          {/* Bet Options */}
          <div className="grid grid-cols-3 gap-3 w-full">
            <button
              onClick={() => setSelectedBetType('1-18')}
              className={`bg-[#0a2d55] text-white font-bold py-2 px-4 rounded hover:bg-[#1a3d65] transition-colors ${selectedBetType === '1-18' ? 'ring-2 ring-yellow-500' : ''}`}
            >
              1-18
            </button>
            <button
              onClick={() => setSelectedBetType('even')}
              className={`bg-[#0a2d55] text-white font-bold py-2 px-4 rounded hover:bg-[#1a3d65] transition-colors ${selectedBetType === 'even' ? 'ring-2 ring-yellow-500' : ''}`}
            >
              EVEN
            </button>
            <button
              onClick={() => setSelectedBetType('red')}
              className={`bg-red-600 text-white font-bold py-2 px-4 rounded hover:bg-red-700 transition-colors ${selectedBetType === 'red' ? 'ring-2 ring-yellow-500' : ''}`}
            >
              RED
            </button>
            <button
              onClick={() => setSelectedBetType('odd')}
              className={`bg-[#0a2d55] text-white font-bold py-2 px-4 rounded hover:bg-[#1a3d65] transition-colors ${selectedBetType === 'odd' ? 'ring-2 ring-yellow-500' : ''}`}
            >
              ODD
            </button>
            <button
              onClick={() => setSelectedBetType('19-36')}
              className={`bg-[#0a2d55] text-white font-bold py-2 px-4 rounded hover:bg-[#1a3d65] transition-colors ${selectedBetType === '19-36' ? 'ring-2 ring-yellow-500' : ''}`}
            >
              19-36
            </button>
            <button
              onClick={() => setSelectedBetType('black')}
              className={`bg-black text-white font-bold py-2 px-4 rounded hover:bg-gray-900 transition-colors ${selectedBetType === 'black' ? 'ring-2 ring-yellow-500' : ''}`}
            >
              BLACK
            </button>
          </div>

          {/* Bet Amount Input */}
          <div className="w-full">
            <input
              type="number"
              placeholder="Bet Amount"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className="w-full bg-[#042346] border border-gray-600 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
              min="1"
            />
          </div>

          {/* Spin Button */}
          <button
            onClick={spinWheel}
            disabled={spinning || bettingLoading || !selectedBetType || !betAmount}
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold px-8 py-3 rounded-full shadow-lg shadow-yellow-500/30 transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {bettingLoading ? "Placing Bet..." : spinning ? "Spinning..." : "Place Bet & Spin"}
          </button>
        </div>

        {/* Right - Rules & Recent Numbers */}
        <div className="bg-gray-800 text-white rounded-lg p-6 flex flex-col justify-between shadow-lg">
          <div>
            <h3 className="font-semibold text-xl mb-4 text-yellow-400">
              Roulette Rules
            </h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>🟡 Bet on number, colors or ranges</li>
              <li>🟡 Minimum bet amount ₹50</li>
              <li>🟡 Number with lowest total bet wins</li>
              <li>🟡 Results every 15 minutes</li>
              <li>🟡 Payouts up to 35x</li>
            </ul>
          </div>

          {/* Recent Numbers */}
          <div className="mt-6 pt-4 border-t border-white/20">
            <h4 className="font-semibold text-xl text-yellow-400">
              Recent Numbers
            </h4>
            <div className="flex flex-wrap gap-2">
              {recent.map((num, i) => (
                <span
                  key={i}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                    num === 0
                      ? "bg-yellow-400 text-black"
                      : num % 2 === 0
                      ? "bg-black text-white"
                      : "bg-red-600 text-white"
                  }`}
                >
                  {num}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
