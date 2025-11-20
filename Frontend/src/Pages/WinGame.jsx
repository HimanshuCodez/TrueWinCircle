import React, { useState, useEffect, useCallback } from 'react';
import { doc, collection, addDoc, runTransaction, onSnapshot, serverTimestamp, query, where, getDocs, writeBatch, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import useAuthStore from '../store/authStore';
import { toast } from 'react-toastify';
import { Zap, Clock, Gift, Loader2 } from 'lucide-react';

// --- IMPORTANT --- 
// This file contains game logic that should be on a backend server (like a Firebase Cloud Function).
// Running this on the client is insecure and unreliable. This is a temporary solution to make the game functional.

const GAME_DURATION_SECONDS = 120;
const BETTING_PERIOD_SECONDS = 60;

const WinGame = () => {
  const { user } = useAuthStore();
  
  const [gameState, setGameState] = useState({ stage: 'loading', timeLeft: 0, roundId: null });
  const [lastWinningNumber, setLastWinningNumber] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);

  const [selectedNumber, setSelectedNumber] = useState(null);
  const [betAmount, setBetAmount] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBettingClosedModalOpen, setIsBettingClosedModalOpen] = useState(false);

  const handleNumberClick = (number) => {
    setSelectedNumber(number);
  };

  // --- BACKEND LOGIC (RUNNING ON CLIENT AS A TEMPORARY SOLUTION) ---
  const calculateAndDistributeWinnings = async (roundId) => {
    console.log(`Calculating results for round: ${roundId}`);
    const betsRef = collection(db, "wingame_bets");
    const q = query(betsRef, where("roundId", "==", roundId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log("No bets in this round.");
      return Math.floor(Math.random() * 12) + 1;
    }

    const numberTotals = {};
    querySnapshot.forEach(doc => {
      const bet = doc.data();
      numberTotals[bet.number] = (numberTotals[bet.number] || 0) + bet.amount;
    });

    let minBetAmount = Infinity;
    let potentialWinners = [];
    for (let i = 1; i <= 12; i++) {
      const total = numberTotals[i] || 0;
      if (total < minBetAmount) {
        minBetAmount = total;
        potentialWinners = [i];
      } else if (total === minBetAmount) {
        potentialWinners.push(i);
      }
    }

    const winningNumber = potentialWinners[Math.floor(Math.random() * potentialWinners.length)];
    console.log(`Winning number is: ${winningNumber}`);

    const batch = writeBatch(db);
    const roundResultRef = doc(db, 'wingame_rounds', String(roundId));
    batch.set(roundResultRef, { winningNumber: winningNumber, createdAt: serverTimestamp() });

    const userWinnings = {};
    querySnapshot.forEach(doc => {
      const bet = doc.data();
      const betRef = doc.ref;
      if (bet.number === winningNumber) {
        const winnings = bet.amount * 10;
        batch.update(betRef, { status: 'win', winnings });
        userWinnings[bet.userId] = (userWinnings[bet.userId] || 0) + winnings;
      } else {
        batch.update(betRef, { status: 'loss', winnings: 0 });
      }
    });

    await batch.commit();
    console.log("All bets updated with win/loss status.");

    for (const userId in userWinnings) {
      const amountToCredit = userWinnings[userId];
      try {
        // Create a 'winner' document for admin approval instead of directly crediting the user.
        await addDoc(collection(db, 'winners'), {
          userId: userId,
          gameName: '1 to 12 Win',
          prize: amountToCredit,
          timestamp: serverTimestamp(),
          status: 'pending_approval'
        });
      } catch (e) {
        console.error(`Failed to create winner document for user ${userId}:`, e);
      }
    }
    
    return winningNumber;
  };

  const initiateRoundEndProcess = useCallback(async (roundId) => {
    if (!roundId) return;
    const gameStateRef = doc(db, 'game_state', 'win_game_1_to_12');
    
    try {
      await runTransaction(db, async (transaction) => {
        const gameStateDoc = await transaction.get(gameStateRef);
        if (!gameStateDoc.exists()) throw new Error("Game state document not found!");
        if (gameStateDoc.data().lastRoundProcessed === roundId) {
          return; // Round already processed
        }
        transaction.update(gameStateRef, { lastRoundProcessed: roundId });
      });

      const winningNumber = await calculateAndDistributeWinnings(roundId);

      const newRoundId = Date.now();
      const newRoundEndTime = new Date(newRoundId + GAME_DURATION_SECONDS * 1000);
      
      await setDoc(gameStateRef, {
        lastWinningNumber: winningNumber,
        roundId: newRoundId,
        roundEndsAt: newRoundEndTime,
      }, { merge: true });

    } catch (error) {
      if (error.code !== 'aborted') {
        console.error("Error in round-end process:", error);
      }
    }
  }, []);

  const initializeGameState = useCallback(async () => {
    const gameStateRef = doc(db, 'game_state', 'win_game_1_to_12');
    try {
        await runTransaction(db, async (transaction) => {
            const gameStateDoc = await transaction.get(gameStateRef);
            if (gameStateDoc.exists()) {
                return; // Already initialized by another client
            }
            const now = Date.now();
            const initialData = {
                roundId: now,
                roundEndsAt: new Date(now + GAME_DURATION_SECONDS * 1000),
                lastRoundProcessed: 0,
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
      if (docSnap.exists()) setWalletBalance(docSnap.data().balance || 0); // CORRECTED
    });
    return unsubscribe;
  }, [user]);

  // This effect syncs game state from Firestore and handles the countdown timer.
  useEffect(() => {
    const gameStateRef = doc(db, 'game_state', 'win_game_1_to_12');
    let timerId = null;

    const unsubscribe = onSnapshot(gameStateRef, (docSnap) => {
      if (timerId) clearInterval(timerId);

      if (!docSnap.exists()) {
        console.log("Game state not found, attempting to initialize...");
        setGameState(prev => ({ ...prev, stage: 'loading' }));
        initializeGameState();
        return;
      }
      
      const data = docSnap.data();
      const roundEndTime = data.roundEndsAt.toDate();
      const currentRoundId = data.roundId;

      setLastWinningNumber(data.lastWinningNumber || null);

      const updateTimer = () => {
        const now = new Date();
        const diffSeconds = Math.floor((roundEndTime - now) / 1000);

        if (diffSeconds <= 0) {
          if (timerId) clearInterval(timerId);
          setGameState({ stage: 'waiting', timeLeft: 0, roundId: currentRoundId });
          initiateRoundEndProcess(currentRoundId);
        } else if (diffSeconds <= (GAME_DURATION_SECONDS - BETTING_PERIOD_SECONDS)) {
          setGameState({ stage: 'waiting', timeLeft: diffSeconds, roundId: currentRoundId });
        } else {
          setGameState({ stage: 'betting', timeLeft: diffSeconds - (GAME_DURATION_SECONDS - BETTING_PERIOD_SECONDS), roundId: currentRoundId });
        }
      };

      updateTimer();
      timerId = setInterval(updateTimer, 1000);
    });

    return () => {
      unsubscribe();
      if (timerId) clearInterval(timerId);
    };
  }, [initiateRoundEndProcess, initializeGameState]);

  const handleBetSubmit = async () => {
    if (!user) return toast.error('Please log in to bet.');
    if (selectedNumber === null) return toast.error('Please select a number.');
    if (betAmount < 10) return toast.error('Minimum bet is ₹10.');
    if (walletBalance < betAmount) return toast.error('Insufficient balance.');
    if (gameState.stage !== 'betting') {
      setIsBettingClosedModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await runTransaction(db, async (transaction) => {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await transaction.get(userDocRef);
        if (!userDoc.exists() || (userDoc.data().balance || 0) < betAmount) { // CORRECTED
          throw new Error('Insufficient balance.');
        }
        const newBalance = userDoc.data().balance - betAmount; // CORRECTED
        transaction.update(userDocRef, { balance: newBalance }); // CORRECTED

        const betDocRef = doc(collection(db, 'wingame_bets'));
        transaction.set(betDocRef, {
          userId: user.uid,
          roundId: gameState.roundId,
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
            {gameState.stage === 'betting' && <p className="text-lg font-bold text-green-400 animate-pulse">Betting Open</p>}
            {gameState.stage === 'waiting' && <p className="text-lg font-bold text-red-400">Waiting for Result</p>}
            {gameState.stage === 'loading' && <p className="text-lg font-bold text-gray-400">Loading...</p>}
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">{gameState.stage === 'betting' ? 'Time to Bet' : 'Result In'}</p>
            <p className="text-3xl font-bold text-white">{String(gameState.timeLeft).padStart(2, '0')}s</p>
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
              className={`py-5 rounded-lg text-2xl font-bold transition-all text-black duration-200 shadow-md ${
                selectedNumber === i + 1
                  ? 'bg-yellow-500 text-black scale-110'
                  : 'bg-gray-100'
              } ${
                gameState.stage !== 'betting'
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
              disabled={isSubmitting}
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
