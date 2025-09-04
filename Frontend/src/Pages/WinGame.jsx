import { useState, useEffect, useRef } from "react";
import { getFirestore, collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import useAuthStore from "../store/authStore"; // Assuming this path
import { toast } from "react-toastify";
import { formatDistanceToNowStrict } from 'date-fns'; // For time formatting

export default function WinGame() {
  const [selected, setSelected] = useState(null);
  const [betAmount, setBetAmount] = useState(10); // Default bet amount
  const [nextResultTime, setNextResultTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [gamePhase, setGamePhase] = useState('betting'); // 'betting', 'calculating', 'showingResult'
  const [winningNumber, setWinningNumber] = useState(null);
  const [winningUserName, setWinningUserName] = useState(null); // Placeholder for user name
  const [currentRoundId, setCurrentRoundId] = useState(null); // ID for the current game round
  const { user } = useAuthStore(); // Get current user from Zustand store
  const db = getFirestore();
  const timerIntervalRef = useRef(null); // Ref for the timer interval

  const numbers = [
    { num: 1, amount: 3586 }, // These amounts are static, will be replaced by fetched data
    { num: 2, amount: 4269 },
    { num: 3, amount: 2988 },
    { num: 4, amount: 1643 },
    { num: 5, amount: 5329 },
    { num: 6, amount: 2551 },
    { num: 7, amount: 3292 },
    { num: 8, amount: 3075 },
    { num: 9, amount: 2644 },
    { num: 10, amount: 3866 },
    { num: 11, amount: 4122 },
    { num: 12, amount: 3556 },
  ];

  // Calculate next result time based on fixed schedule
  const calculateNextResultTime = () => {
    const now = new Date();
    const resultHours = [0, 3, 6, 9, 12, 15, 18, 21]; // 12AM, 3AM, 6AM, 9AM, 12PM, 3PM, 6PM, 9PM

    let nextTime = null;

    for (const hour of resultHours) {
      const candidateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0, 0);
      if (candidateTime > now) {
        nextTime = candidateTime;
        break;
      }
    }

    // If no future time today, set for tomorrow's first time (00:00)
    if (!nextTime) {
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      nextTime = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), resultHours[0], 0, 0);
    }
    setNextResultTime(nextTime);
    setCurrentRoundId(nextTime.getTime()); // Use timestamp as round ID
  };

  // Timer effect
 // Run once on mount to set the first round
useEffect(() => {
  calculateNextResultTime();
}, []);

// Timer effect (only depends on nextResultTime)
useEffect(() => {
  if (!nextResultTime) return;

  timerIntervalRef.current = setInterval(() => {
    const now = new Date();
    const diff = nextResultTime.getTime() - now.getTime();

    if (diff <= 0) {
      clearInterval(timerIntervalRef.current);
      setGamePhase('calculating');
      handleResultCalculation();
    } else {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    }
  }, 1000);

  return () => clearInterval(timerIntervalRef.current);
}, [nextResultTime]);
 // Recalculate timer when nextResultTime changes

  const handleBet = async () => {
    if (!user) {
      toast.error("Please log in to place a bet.");
      return;
    }
    if (selected === null) {
      toast.error("Please select a number.");
      return;
    }
    if (betAmount < 10) {
      toast.error("Minimum bet amount is ₹10.");
      return;
    }
    if (gamePhase !== 'betting') {
      toast.info("Betting is closed for this round.");
      return;
    }

    try {
      await addDoc(collection(db, "bets"), {
        userId: user.uid,
        userName: user.displayName || user.email || "Anonymous", // Use display name or email
        number: selected,
        amount: betAmount,
        roundId: currentRoundId,
        timestamp: serverTimestamp(),
      });
      toast.success(`Bet placed: ₹${betAmount} on number ${selected}`);
      setSelected(null); // Clear selection after bet
      setBetAmount(10); // Reset bet amount
    } catch (error) {
      console.error("Error placing bet:", error);
      toast.error("Failed to place bet. Please try again.");
    }
  };

  const handleResultCalculation = async () => {
    setGamePhase('calculating');
    try {
      // Fetch all bets for the just-ended round
      const betsRef = collection(db, "bets");
      const q = query(betsRef, where("roundId", "==", currentRoundId));
      const querySnapshot = await getDocs(q);

      const numberBets = {}; // { number: totalAmount }
      const numberUsers = {}; // { number: [{ userId, userName }] }

      querySnapshot.forEach((doc) => {
        const bet = doc.data();
        numberBets[bet.number] = (numberBets[bet.number] || 0) + bet.amount;
        if (!numberUsers[bet.number]) {
          numberUsers[bet.number] = [];
        }
        numberUsers[bet.number].push({ userId: bet.userId, userName: bet.userName });
      });

      let minBetAmount = Infinity;
      let potentialWinningNumbers = [];

      // Find the number(s) with the minimum total bet amount
      for (let i = 1; i <= 12; i++) { // Iterate through all possible numbers 1-12
        const totalBet = numberBets[i] || 0; // If no bets, total is 0
        if (totalBet < minBetAmount) {
          minBetAmount = totalBet;
          potentialWinningNumbers = [i]; // Start new list of potential winners
        } else if (totalBet === minBetAmount) {
          potentialWinningNumbers.push(i); // Add to list if tied
        }
      }

      let finalWinningNumber;
      let finalWinningUserName = "No winner this round";

      if (potentialWinningNumbers.length > 0) {
        // If multiple numbers tie for the lowest bet, pick one randomly
        finalWinningNumber = potentialWinningNumbers[Math.floor(Math.random() * potentialWinningNumbers.length)];

        // Find a user who bet on the winning number
        if (numberUsers[finalWinningNumber] && numberUsers[finalWinningNumber].length > 0) {
          // Pick a random user who bet on the winning number
          const winnerUser = numberUsers[finalWinningNumber][Math.floor(Math.random() * numberUsers[finalWinningNumber].length)];
          finalWinningUserName = winnerUser.userName;
        } else {
          finalWinningUserName = "No one bet on this number";
        }
      } else {
        // This case happens if no bets were placed at all.
        // In a real game, you might have a default winning number or roll again.
        // For now, let's pick a random number if no bets were placed.
        finalWinningNumber = Math.floor(Math.random() * 12) + 1; // Random number 1-12
        finalWinningUserName = "No bets placed on winning number";
      }

      setWinningNumber(finalWinningNumber);
      setWinningUserName(finalWinningUserName);
      setGamePhase('showingResult');

      // After showing result for a few seconds, go back to betting phase
      setTimeout(() => {
        setGamePhase('betting');
        setWinningNumber(null);
        setWinningUserName(null);
        calculateNextResultTime(); // Calculate next round's time after showing result
      }, 10000); // Show result for 10 seconds
    } catch (error) {
      console.error("Error calculating result:", error);
      toast.error("Failed to calculate result.");
      setGamePhase('betting'); // Go back to betting if error
    }
  };

  return (
    <div className="p-6  min-h-screen text-white font-roboto">
      {/* Title */}
      <h2 className="text-3xl font-bold mb-6 text-center text-yellow-400">1 to 12 Win Game</h2>
      <hr className="border-gray-700 mb-6" />

      {/* Game grid & rules */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Number boxes */}
        <div className="md:col-span-3 grid grid-cols-3 sm:grid-cols-4 gap-4">
          {numbers.map((item) => (
            <div
              key={item.num}
              onClick={() => setSelected(item.num)}
              className={`rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer shadow-lg transition-all duration-200
                ${
                  selected === item.num
                    ? "bg-yellow-500 text-gray-900 scale-105"
                    : "bg-gray-800 text-white hover:bg-gray-700"
                }`}
            >
              <span className="text-2xl font-bold">{item.num}</span>
              <span className="text-sm mt-1 text-gray-300">₹{item.amount}</span>
            </div>
          ))}
        </div>

        {/* Rules box */}
        <div className="bg-gray-800 text-white rounded-lg p-4 flex flex-col justify-between shadow-lg">
          <div>
            <h3 className="font-semibold text-xl mb-3 text-yellow-400">Game Rules</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>🟡 Select any number between 1 to 12</li>
              <li>🟡 Minimum bet amount ₹10</li>
              <li>🟡 Number with lowest total bet wins</li>
              <li>🟡 Results at 12AM, 3AM, 6AM, 9AM, 12PM, 3PM, 6PM, 9PM</li>
              <li>🟡 Winnings credited automatically</li>
            </ul>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h4 className="font-semibold text-xl text-yellow-400">Next Result</h4>
            <p className="text-sm mt-1">
              Time Left: <span className="font-bold text-green-400">{timeLeft}</span>
            </p>
            {gamePhase === 'calculating' && (
              <p className="text-sm mt-2 text-blue-400 animate-pulse">Calculating result...</p>
            )}
            {gamePhase === 'showingResult' && (
              <div className="mt-2 p-2 bg-green-700 rounded-md text-center">
                <p className="text-lg font-bold">Winning Number: {winningNumber}</p>
                <p className="text-sm">Winner: {winningUserName}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bet form */}
      <div className="bg-gray-800 rounded-lg p-4 mt-6 shadow-lg">
        <h3 className="font-medium text-xl mb-3 text-yellow-400">Place Your Bet</h3>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <select
            className="border border-gray-600 rounded-md px-3 py-2 w-full sm:w-40 bg-gray-700 text-white focus:ring-yellow-500 focus:border-yellow-500"
            value={selected || ""}
            onChange={(e) => setSelected(Number(e.target.value))}
            disabled={gamePhase !== 'betting'}
          >
            <option value="">Choose number</option>
            {numbers.map((item) => (
              <option key={item.num} value={item.num}>
                {item.num}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            className="border border-gray-600 rounded-md px-3 py-2 w-full sm:w-40 bg-gray-700 text-white focus:ring-yellow-500 focus:border-yellow-500"
            min="10"
            disabled={gamePhase !== 'betting'}
          />
          <button
            onClick={handleBet}
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold px-6 py-2 rounded-md shadow-lg transition-colors w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={gamePhase !== 'betting' || !selected || betAmount < 10}
          >
            Bet Now
          </button>
        </div>
      </div>
    </div>
  );
}