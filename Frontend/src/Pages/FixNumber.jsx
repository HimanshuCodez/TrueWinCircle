import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, runTransaction, collection } from 'firebase/firestore';
import { db } from '../firebase';
import useAuthStore from '../store/authStore';
import { toast } from 'react-toastify';

export default function FixNumber() {
  const [balance, setBalance] = useState(0);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setBalance(docSnap.data().balance || 0);
        } else {
          // If user document doesn't exist, create it with default balance
          // This is a good place to initialize user data if not done elsewhere
          // For now, just set balance to 0 if doc doesn't exist
          setBalance(0);
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  const games = [
    {
      name: "Gali",
      time: "12:30 PM",
      lastResult: 78,
      mostBets: { number: 89, amount: "₹12,450" },
      leastBets: { number: 23, amount: "₹850" },
    },
    {
      name: "Disawar",
      time: "1:00 PM",
      lastResult: 35,
      mostBets: { number: 67, amount: "₹9,800" },
      leastBets: { number: 12, amount: "₹1,200" },
    },
    {
      name: "Dhan Kuber",
      time: "3:00 PM",
      lastResult: 14,
      currentLowest: { number: 14, amount: "₹3,100" },
      yourBets: 0,
    },
  ];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [betNumber, setBetNumber] = useState("");
  const [betAmount, setBetAmount] = useState("");
  const [bettingLoading, setBettingLoading] = useState(false);
  const [gameTimers, setGameTimers] = useState({}); // { gameName: endTime (timestamp) }

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const updatedTimers = {};
      let hasActiveTimer = false;

      Object.entries(gameTimers).forEach(([gameName, endTime]) => {
        const timeLeft = endTime - now;
        if (timeLeft > 0) {
          updatedTimers[gameName] = endTime;
          hasActiveTimer = true;
        }
      });

      setGameTimers(updatedTimers);
      if (!hasActiveTimer) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameTimers]);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const openBetModal = (game) => {
    setSelectedGame(game);
    setIsModalOpen(true);
    setBetNumber("");
    setBetAmount("");
  };

  const closeBetModal = () => {
    setIsModalOpen(false);
    setSelectedGame(null);
  };

  const handlePlaceBet = async (game) => {
    if (!user) {
      toast.error("You must be logged in to place a bet.");
      return;
    }

    const parsedBetNumber = parseInt(betNumber);
    const parsedBetAmount = parseFloat(betAmount);

    if (isNaN(parsedBetNumber) || parsedBetNumber < 0 || parsedBetNumber > 99) {
      toast.error("Please enter a valid number between 0 and 99.");
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
      await runTransaction(db, async (transaction) => {
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

        // Add bet record
        const betsCollectionRef = collection(db, 'bets');
        transaction.set(doc(betsCollectionRef), {
          userId: user.uid,
          gameName: game.name,
          betNumber: parsedBetNumber,
          betAmount: parsedBetAmount,
          timestamp: new Date(),
          status: 'pending',
        });
      });

      toast.success("Bet placed successfully!");
      closeBetModal();

      // Set the timer for this game (3 hours from now)
      const threeHoursLater = new Date().getTime() + (3 * 60 * 60 * 1000);
      setGameTimers(prev => ({ ...prev, [game.name]: threeHoursLater }));

    } catch (e) {
      console.error("Bet placement failed: ", e);
      toast.error(`Failed to place bet: ${e.message || e}`);
    } finally {
      setBettingLoading(false);
    }
  };

  return (
    <div className="px-8 bg-red-800 py-6">
     

      {/* Section Title */}
      <h2 className="text-xl font-bold mb-2">Fixed Number Result Games</h2>
      <hr className="mb-6" />

      {/* Game Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {games.map((game, idx) => (
          <div
            key={idx}
            className="border rounded-lg shadow-sm overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#042346] text-white px-4 py-2 font-bold rounded-t-lg flex justify-between items-center">
              <span>{game.name}</span>
              <span className="text-xs font-normal">
                Next result: {game.time}
              </span>
            </div>

            {/* Body */}
            <div className="p-4 space-y-2 text-sm">
              <p>
                Last Result:{" "}
                <span className="font-bold text-lg">{game.lastResult}</span>
              </p>
              {game.mostBets && (
                <p>
                  Most Bets:{" "}
                  <span className="font-bold text-[#042346]">
                    {game.mostBets.number} ({game.mostBets.amount})
                  </span>
                </p>
              )}
              {game.leastBets && (
                <p>
                  Least Bets:{" "}
                  <span className="font-bold text-[#042346]">
                    {game.leastBets.number} ({game.leastBets.amount})
                  </span>
                </p>
              )}
              {game.currentLowest && (
                <p>
                  Current Lowest:{" "}
                  <span className="font-bold text-[#042346]">
                    {game.currentLowest.number} ({game.currentLowest.amount})
                  </span>
                </p>
              )}
              {game.yourBets !== undefined && (
                <p>
                  Your Bets:{" "}
                  <span className="font-bold text-[#042346]">
                    {game.yourBets}
                  </span>
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 pb-4">
              {gameTimers[game.name] ? (
                <button
                  disabled
                  className="w-full bg-gray-400 text-black font-semibold py-2 rounded cursor-not-allowed"
                >
                  Result in: {formatTime(gameTimers[game.name] - new Date().getTime())}
                </button>
              ) : (
                <button
                  onClick={() => openBetModal(game)}
                  className="w-full bg-[#d4af37] text-black font-semibold py-2 rounded hover:bg-[#c19d2c]"
                >
                  Place Bet
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Betting Modal */}
      {isModalOpen && selectedGame && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Place Bet for {selectedGame.name}</h3>
            <div className="mb-4">
              <label htmlFor="betNumber" className="block text-gray-700 text-sm font-bold mb-2">Enter Number to Bet (0-99):</label>
              <input
                type="number"
                id="betNumber"
                min="0"
                max="99"
                value={betNumber}
                onChange={(e) => setBetNumber(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div className="mb-6">
              <label htmlFor="betAmount" className="block text-gray-700 text-sm font-bold mb-2">Bet Amount:</label>
              <input
                type="number"
                id="betAmount"
                min="1"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={closeBetModal}
                className="bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePlaceBet(selectedGame)}
                disabled={bettingLoading}
                className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-300"
              >
                {bettingLoading ? "Placing Bet..." : "Place Bet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
