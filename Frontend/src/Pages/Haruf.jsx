import React, { useState, useEffect } from "react";
import { doc, onSnapshot, runTransaction, collection } from 'firebase/firestore';
import { db } from '../firebase';
import useAuthStore from '../store/authStore';
import { toast } from 'react-toastify';

const HarufGrid = () => {
  const [selected, setSelected] = useState(null);
  const [betAmount, setBetAmount] = useState("");
  const [bettingLoading, setBettingLoading] = useState(false);
  const [balance, setBalance] = useState(0);

  const user = useAuthStore((state) => state.user);

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

  const handlePlaceBet = async () => {
    if (!user) {
      toast.error("You must be logged in to place a bet.");
      return;
    }

    if (!selected) {
      toast.error("Please select a number to bet on.");
      return;
    }

    const parsedBetAmount = parseFloat(betAmount);

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
        const betsCollectionRef = collection(db, 'harufBets'); // New collection for Haruf bets
        transaction.set(doc(betsCollectionRef), {
          userId: user.uid,
          betType: 'Haruf',
          selectedNumber: selected,
          betAmount: parsedBetAmount,
          timestamp: new Date(),
          status: 'pending',
        });
      });

      toast.success("Bet placed successfully!");
      setBetAmount(""); // Clear bet amount after successful bet
      setSelected(null); // Clear selected number
    } catch (e) {
      console.error("Bet placement failed: ", e);
      toast.error(`Failed to place bet: ${e.message || e}`);
    } finally {
      setBettingLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-4">
      {/* Numbers Grid */}
      <p>Andar Haruf Bahar Haruf</p>

      <div className="grid grid-cols-10 gap-2">
        {Array.from({ length: 100 }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            onClick={() => setSelected(num)}
            className={`w-10 h-10 flex items-center justify-center rounded-md text-white font-medium
              ${selected === num ? "bg-yellow-500" : "bg-red-600 hover:bg-[#1a3d65]"}
            `}
          >
            {num}
          </button>
        ))}
      </div>

      {/* Bet Amount Input */}
      <div className="mt-6 w-full max-w-xs">
        <label htmlFor="betAmount" className="block text-sm font-medium text-gray-300 mb-2">Bet Amount:</label>
        <input
          type="number"
          id="betAmount"
          min="1"
          value={betAmount}
          onChange={(e) => setBetAmount(e.target.value)}
          className="w-full bg-[#042346] border border-gray-600 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
        />
      </div>

      {/* Place Bet Button */}
      <button
        onClick={handlePlaceBet}
        disabled={bettingLoading || !selected || !betAmount}
        className="mt-4 w-full max-w-xs bg-yellow-500 text-black font-bold py-3 rounded-full hover:bg-yellow-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {bettingLoading ? "Placing Bet..." : "Place Bet"}
      </button>

      {/* Andar / Haruf Buttons */}
      <div className="flex gap-4 mt-6">
        <button className="px-6 py-2 bg-blue-500 text-white rounded-xl shadow hover:bg-blue-600">
          Andar
        </button>
        <button className="px-6 py-2 bg-purple-500 text-white rounded-xl shadow hover:bg-purple-600">
          Haruf
        </button>
      </div>

      {/* Show Selected */}
      {selected && (
        <p className="mt-4 text-lg font-semibold text-black">
          Selected Number: <span className="text-yellow-500">{selected}</span>
        </p>
      )}
    </div>
  );
};

export default HarufGrid;
