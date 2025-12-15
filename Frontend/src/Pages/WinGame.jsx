import React, { useState, useEffect, useCallback } from 'react';
import { doc, collection, addDoc, runTransaction, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import useAuthStore from '../store/authStore';
import { toast } from 'react-toastify';
import { Zap, Loader2 } from 'lucide-react';

// --- IMPORTANT --- 
// The game logic is now driven by an admin from a backend or admin panel.
// The admin is responsible for closing betting, calculating results, and starting a new round.
// This client-side component just reflects the state from Firestore.

const WinGame = () => {
  const { user } = useAuthStore();
  
  // Simplified game state. 'isBettingOpen' is the primary driver.
  const [isBettingOpen, setIsBettingOpen] = useState(false);
  const [roundId, setRoundId] = useState(null);
  const [lastWinningNumber, setLastWinningNumber] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);

  const [selectedNumber, setSelectedNumber] = useState(null);
  const [betAmount, setBetAmount] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBettingClosedModalOpen, setIsBettingClosedModalOpen] = useState(false);

  const handleNumberClick = (number) => {
    setSelectedNumber(number);
  };

  // This function is for a first-time setup by any client, to ensure the game has a starting state.
  const initializeGameState = useCallback(async () => {
    const gameStateRef = doc(db, 'game_state', 'win_game_1_to_12');
    try {
        await runTransaction(db, async (transaction) => {
            const gameStateDoc = await transaction.get(gameStateRef);
            if (gameStateDoc.exists()) {
                return; // Already initialized
            }
            const now = Date.now();
            const initialData = {
                roundId: now,
                isBettingOpen: true,
                lastWinningNumber: null,
            };
            transaction.set(gameStateRef, initialData);
        });
        console.log("Game initialized successfully!");
    } catch (error) {
        if (error.code !== 'aborted') {
            console.error("Failed to initialize game state:", error);
        }
    }
  }, []);

  // --- COMPONENT LIFECYCLE & UI LOGIC ---
  useEffect(() => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) setWalletBalance(docSnap.data().balance || 0);
    });
    return unsubscribe;
  }, [user]);

  // This effect syncs game state from Firestore. It's now much simpler without a timer.
  useEffect(() => {
    const gameStateRef = doc(db, 'game_state', 'win_game_1_to_12');

    const unsubscribe = onSnapshot(gameStateRef, (docSnap) => {
      if (!docSnap.exists()) {
        console.log("Game state not found, attempting to initialize...");
        initializeGameState();
        return;
      }
      
      const data = docSnap.data();
      setIsBettingOpen(data.isBettingOpen || false);
      setRoundId(data.roundId || null);
      setLastWinningNumber(data.lastWinningNumber || null);
    });

    return () => unsubscribe();
  }, [initializeGameState]);

  const handleBetSubmit = async () => {
    if (!user) return toast.error('Please log in to bet.');
    if (selectedNumber === null) return toast.error('Please select a number.');
    if (betAmount < 10) return toast.error('Minimum bet is ₹10.');
    if (walletBalance < betAmount) return toast.error('Insufficient balance.');
    if (!isBettingOpen) {
      setIsBettingClosedModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await runTransaction(db, async (transaction) => {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await transaction.get(userDocRef);
        if (!userDoc.exists() || (userDoc.data().balance || 0) < betAmount) {
          throw new Error('Insufficient balance.');
        }
        const newBalance = userDoc.data().balance - betAmount;
        transaction.update(userDocRef, { balance: newBalance });

        const betDocRef = doc(collection(db, 'wingame_bets'));
        transaction.set(betDocRef, {
          userId: user.uid,
          roundId: roundId, // Use the roundId from state
          number: selectedNumber,
          amount: betAmount,
          createdAt: serverTimestamp(),
        });
      });
      toast.success(`Bet of ₹${betAmount} placed on ${selectedNumber}!`);
      setSelectedNumber(null);
      setBetAmount(10);
    } catch (error) {
      toast.error(error.message || 'Failed to place bet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="font-roboto bg-gray-900 text-white min-h-screen p-4 pt-20">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-yellow-400">1 to 12 Win</h1>
          <p className="text-gray-300 text-lg">Bet on a number and win 10 times the amount!</p>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-lg p-4 mb-6 flex justify-around items-center">
          <div className="text-center">
            <p className="text-sm text-gray-400">Status</p>
            {isBettingOpen ? (
              <p className="text-lg font-bold text-green-400 animate-pulse">Betting Open</p>
            ) : (
              <p className="text-lg font-bold text-red-400">Waiting For Admin Approval</p>
            )}
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">Last Winning Number</p>
            <p className="text-3xl font-bold text-yellow-400">{lastWinningNumber ?? '--'}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-6">
          {[...Array(12).keys()].map(i => (
            <button
              key={i + 1}
              onClick={() => handleNumberClick(i + 1)}
              disabled={!isBettingOpen}
              className={`py-5 rounded-lg text-2xl font-bold transition-all text-black duration-200 shadow-md ${
                selectedNumber === i + 1
                  ? 'bg-yellow-500 text-black scale-110'
                  : 'bg-gray-100'
              } ${
                !isBettingOpen
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-600'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <div className="bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Selected Number</label>
              <div className="w-full bg-gray-700 rounded-lg p-3 text-center text-xl font-bold">
                {selectedNumber || 'None'}
              </div>
            </div>
            <div>
              <label htmlFor="betAmount" className="block text-sm font-medium text-gray-400 mb-2">Bet Amount (Min: ₹10)</label>
                            <input
                              id="betAmount"
                              type="number"
                              value={betAmount}
                              onChange={(e) => setBetAmount(parseInt(e.target.value, 10) || 10)}
                              min="10"
                              className="w-full bg-gray-700 rounded-lg p-3 text-center text-xl font-bold focus:ring-2 focus:ring-yellow-500 outline-none"
                            />            </div>
            <button 
              onClick={handleBetSubmit}
              disabled={isSubmitting || !isBettingOpen}
              className="w-full bg-green-600 text-white font-bold py-3 rounded-lg text-xl flex items-center justify-center hover:bg-green-700 transition-colors disabled:bg-gray-500">
              {isSubmitting ? <Loader2 className="animate-spin" /> : <Zap />}
              <span className="ml-2">Place Bet</span>
            </button>
          </div>
        </div>

      </div>
      {isBettingClosedModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-11/12 max-w-sm text-center">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">Betting Closed</h3>
            <p className="text-gray-300 mb-6">The betting window for this round is closed. Please wait for the next round to begin.</p>
            <button
              onClick={() => setIsBettingClosedModalOpen(false)}
              className="bg-yellow-500 text-black font-bold py-2 px-6 rounded-lg hover:bg-yellow-600 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WinGame;