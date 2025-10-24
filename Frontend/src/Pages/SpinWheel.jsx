import { useState, useRef, useEffect } from "react";
import { doc, onSnapshot, runTransaction, collection } from 'firebase/firestore';
import { db } from '../firebase';
import useAuthStore from '../store/authStore';
import { toast } from 'react-toastify';
import { IndianRupee } from 'lucide-react';
import RouletteBoard from '../components/RouletteBoard';
import BettingPanel from '../components/BettingPanel';

// --- Helper Functions and Data ---

const wheelNumbers = [0, 28, 9, 26, 30, 11, 7, 20, 32, 17, 5, 22, 34, 15, 3, 24, 36, 13, 1, '00', 27, 10, 25, 29, 12, 8, 19, 31, 18, 6, 21, 33, 16, 4, 23, 35, 14, 2];
const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

const getNumberColor = (num) => {
  if (num === 0 || num === '00') return 'bg-green-600';
  if (redNumbers.includes(num)) return 'bg-red-600';
  return 'bg-black';
};

// --- RouletteWheel Component ---

const RouletteWheel = ({ spinning }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (spinning) {
      videoRef.current.play();
    } else {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }
  }, [spinning]);

  return (
    <div className="relative w-full aspect-video max-w-md md:max-w-lg lg:max-w-xl">
      <video
        ref={videoRef}
        className="w-full h-full object-cover rounded-lg"
        loop
        muted
        playsInline
        autoplay
        // Make sure you have a roulette video in your /public folder
        src="/roulet.mp4" 
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};


export default function CasinoRoulette() {
  const [recent, setRecent] = useState([7, 24, 12, 0, 19]);
  const [spinning, setSpinning] = useState(false);
  const [winningNumber, setWinningNumber] = useState(null);

  const [balance, setBalance] = useState(0);
  const [betAmount, setBetAmount] = useState(0);
  const [selectedBetType, setSelectedBetType] = useState(null);
  const [bettingLoading, setBettingLoading] = useState(false);

  const { user } = useAuthStore();

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

    const parsedBetAmount = parseFloat(betAmount);

    if (!user) return toast.error("Please log in to place a bet.");
    if (selectedBetType === null) return toast.error("Please select a bet type.");
    if (isNaN(parsedBetAmount) || parsedBetAmount <= 0) return toast.error("Please enter a valid bet amount.");
    if (parsedBetAmount > balance) return toast.error("Insufficient balance, cannot spin the wheel.");

    setBettingLoading(true);

    runTransaction(db, async (transaction) => {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists()) throw "User document does not exist!";
      
      const currentBalance = userDoc.data().balance || 0;
      if (currentBalance < parsedBetAmount) throw "Insufficient balance in transaction.";

      transaction.update(userDocRef, { balance: currentBalance - parsedBetAmount });
      const betsCollectionRef = collection(db, 'rouletteBets');
      transaction.set(doc(betsCollectionRef), {
        userId: user.uid,
        betType: selectedBetType,
        betAmount: parsedBetAmount,
        timestamp: new Date(),
        status: 'pending',
      });
    }).then(() => {
      toast.success("Bet placed! Spinning the wheel...");
      setBettingLoading(false);
      setSpinning(true);
      setWinningNumber(null);

      const winningIndex = Math.floor(Math.random() * 38);
      const newWinningNumber = wheelNumbers[winningIndex];

      setTimeout(() => {
        setSpinning(false);
        setWinningNumber(newWinningNumber);
        setRecent((prev) => [newWinningNumber, ...prev].slice(0, 10));
        handlePayout(newWinningNumber, selectedBetType, parsedBetAmount);
        setBetAmount(0);
        setSelectedBetType(null);
      }, 5500); // Spin duration + 0.5s buffer

    }).catch((e) => {
      console.error("Bet placement failed: ", e);
      toast.error(`Failed to place bet: ${e.message || e}`);
      setBettingLoading(false);
    });
  };

  const handlePayout = async (resultNumber, betType, betAmount) => {
    let payoutMultiplier = 0;
    let isWinner = false;

    const isRed = (num) => redNumbers.includes(num);
    const isBlack = (num) => typeof num === 'number' && num !== 0 && !redNumbers.includes(num);
    const isEven = (num) => typeof num === 'number' && num !== 0 && num % 2 === 0;
    const isOdd = (num) => typeof num === 'number' && num % 2 !== 0;

    // Helper for column bets
    const isCol1 = (num) => [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36].includes(num);
    const isCol2 = (num) => [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35].includes(num);
    const isCol3 = (num) => [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].includes(num);


    if (betType === resultNumber) { isWinner = true; payoutMultiplier = 36; }
    else if (betType === 'red' && isRed(resultNumber)) { isWinner = true; payoutMultiplier = 2; }
    else if (betType === 'black' && isBlack(resultNumber)) { isWinner = true; payoutMultiplier = 2; }
    else if (betType === 'even' && isEven(resultNumber)) { isWinner = true; payoutMultiplier = 2; }
    else if (betType === 'odd' && isOdd(resultNumber)) { isWinner = true; payoutMultiplier = 2; }
    else if (betType === '1-18' && resultNumber >= 1 && resultNumber <= 18) { isWinner = true; payoutMultiplier = 2; }
    else if (betType === '19-36' && resultNumber >= 19 && resultNumber <= 36) { isWinner = true; payoutMultiplier = 2; }
    // New bet types
    else if (betType === '1st12' && resultNumber >= 1 && resultNumber <= 12) { isWinner = true; payoutMultiplier = 3; } // Payout for dozens is 3x
    else if (betType === '2nd12' && resultNumber >= 13 && resultNumber <= 24) { isWinner = true; payoutMultiplier = 3; }
    else if (betType === '3rd12' && resultNumber >= 25 && resultNumber <= 36) { isWinner = true; payoutMultiplier = 3; }
    else if (betType === 'col1' && isCol1(resultNumber)) { isWinner = true; payoutMultiplier = 3; } // Payout for columns is 3x
    else if (betType === 'col2' && isCol2(resultNumber)) { isWinner = true; payoutMultiplier = 3; }
    else if (betType === 'col3' && isCol3(resultNumber)) { isWinner = true; payoutMultiplier = 3; }


    if (isWinner) {
      const winnings = betAmount * payoutMultiplier;
      try {
        await runTransaction(db, async (transaction) => {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await transaction.get(userDocRef);
          if (!userDoc.exists()) throw "User document does not exist for payout!";
          
          const currentWinningMoney = userDoc.data().winningMoney || 0;
          transaction.update(userDocRef, { winningMoney: currentWinningMoney + winnings });

          // Add new winner doc inside the same transaction
          const winnerDocRef = doc(collection(db, 'winners'));
          transaction.set(winnerDocRef, {
            userId: user.uid,
            gameName: 'Roulette',
            prize: winnings,
            timestamp: serverTimestamp(),
            status: 'pending_approval'
          });
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
    <div className="p-4 md:p-6 bg-[#042346] min-h-screen text-white font-roboto flex flex-col items-center space-y-6">
      <h2 className="text-3xl font-bold text-center text-yellow-400">
        Roulette Game
      </h2>

      <div className="w-full max-w-5xl p-4 bg-[#0a2d55] rounded-lg shadow-md flex justify-between items-center">
        <span className="text-lg font-semibold">Balance:</span>
        <span className="text-2xl font-bold flex items-center">
          <IndianRupee className="w-6 h-6 mr-1" />{balance.toFixed(2)}
        </span>
      </div>

      <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center justify-center gap-6">
        <div className="flex flex-col items-center justify-center space-y-4">
          <RouletteWheel spinning={spinning} />
          {winningNumber !== null && !spinning && (
            <div className="p-4 bg-gray-900 rounded-lg text-center animate-pulse">
                <span className="text-lg text-yellow-400">Winning Number</span>
                <div className={`mt-2 w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl font-bold ${getNumberColor(winningNumber)} text-white`}>
                    {winningNumber}
                </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Recent Numbers */}
      <div className="w-full max-w-5xl">
        <h4 className="font-semibold text-xl text-yellow-400 mb-2">Recent Numbers</h4>
        <div className="flex flex-wrap gap-2 bg-[#0a2d55] p-2 rounded-lg">
          {recent.map((num, i) => (
            <span key={i} className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${getNumberColor(num)} text-white`}>
              {num}
            </span>
          ))}
        </div>
      </div>

      <RouletteBoard setSelectedBetType={setSelectedBetType} selectedBetType={selectedBetType} />

      <BettingPanel
        betAmount={betAmount}
        setBetAmount={setBetAmount}
        spinWheel={spinWheel}
        spinning={spinning}
        bettingLoading={bettingLoading}
        balance={balance}
        selectedBetType={selectedBetType}
      />
    </div>
  );
}