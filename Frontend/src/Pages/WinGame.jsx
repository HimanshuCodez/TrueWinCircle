import React, { useState, useEffect, useCallback } from 'react';
import { 
    doc, collection, runTransaction, onSnapshot, serverTimestamp, setDoc, Timestamp,
    query, where, getDocs, writeBatch, increment, updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import useAuthStore from '../store/authStore';
import { toast } from 'react-toastify';
import { Zap, Loader2 } from 'lucide-react';

const BETTING_DURATION_SECONDS = 5 * 60; // 5 minutes
const RESULTS_DURATION_SECONDS = 1 * 60; // 1 minute

const WinGame = () => {
    const { user } = useAuthStore();
    
    // Game state
    const [phase, setPhase] = useState('loading'); // loading, betting, results, error
    const [timer, setTimer] = useState(0);
    const [roundId, setRoundId] = useState(null);
    const [lastWinningNumber, setLastWinningNumber] = useState(null);
    const [walletBalance, setWalletBalance] = useState(0);
    
    // Bet state
    const [selectedNumber, setSelectedNumber] = useState(null);
    const [betAmount, setBetAmount] = useState(10);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // UI state
    const [isBettingOverModalVisible, setIsBettingOverModalVisible] = useState(false);

    const gameStateRef = useCallback(() => doc(db, 'game_state', 'win_game_1_to_12'), []);

    // --- Client-side Result Calculation (INSECURE) ---
    // This function should be moved to a secure backend (e.g., Cloud Function) for a production environment.
    const calculateAndDistributeWinnings = useCallback(async (roundIdToProcess) => {
        toast.info("Calculating round results...");
        try {
            // 1. Get all bets for the completed round
            const betsQuery = query(collection(db, 'wingame_bets'), where('roundId', '==', roundIdToProcess));
            const betsSnapshot = await getDocs(betsQuery);

            if (betsSnapshot.empty) {
                console.log(`No bets in round ${roundIdToProcess}.`);
                await updateDoc(gameStateRef(), { lastWinningNumber: "N/A" });
                toast.success("Round finished. No bets were placed.");
                return;
            }

            // 2. Aggregate bets by number
            const betAggregation = {};
            betsSnapshot.forEach(doc => {
                const bet = doc.data();
                betAggregation[bet.number] = (betAggregation[bet.number] || 0) + bet.amount;
            });

            // 3. Find the number with the lowest total bet amount
            let winningNumber = -1;
            let lowestBet = Infinity;
            for (let i = 1; i <= 12; i++) {
                const betSum = betAggregation[i] || 0;
                if (betSum < lowestBet) {
                    lowestBet = betSum;
                    winningNumber = i;
                }
            }

            // 4. Update game state with the winning number
            await updateDoc(gameStateRef(), { lastWinningNumber: winningNumber });
            console.log(`Round ${roundIdToProcess} winning number: ${winningNumber}`);

            // 5. Use a batch write to process all wins and losses atomically
            const batch = writeBatch(db);
            betsSnapshot.forEach(doc => {
                const bet = doc.data();
                const betRef = doc.ref;

                if (bet.number === winningNumber) {
                    const winnings = bet.amount * 10;
                    batch.update(betRef, { status: 'win', winnings: winnings });
                    
                    const userRef = doc(db, 'users', bet.userId);
                    batch.update(userRef, { balance: increment(winnings) });
                } else {
                    batch.update(betRef, { status: 'loss' });
                }
            });
            
            await batch.commit();
            console.log("Winnings distributed and bets updated.");
            toast.success(`Round over! The winning number was ${winningNumber}.`);

        } catch (error) {
            console.error("Error calculating winnings:", error);
            toast.error("An error occurred while calculating results.");
        }
    }, [gameStateRef]);


    // Effect to get user's wallet balance
    useEffect(() => {
        if (!user) return;
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) setWalletBalance(docSnap.data().balance || 0);
        });
        return unsubscribe;
    }, [user]);

    // This effect syncs game state from Firestore and calculates remaining time
    useEffect(() => {
        const unsubscribe = onSnapshot(gameStateRef(), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const now = Timestamp.now();
                
                let phaseEndTime = data.phaseEndTime;
                if (!phaseEndTime) return;
                if (!(phaseEndTime instanceof Timestamp)) {
                    phaseEndTime = new Timestamp(phaseEndTime.seconds, phaseEndTime.nanoseconds);
                }

                const remainingSeconds = Math.max(0, phaseEndTime.seconds - now.seconds);
                const currentPhase = data.phase;
                
                if (phase !== currentPhase) setPhase(currentPhase);
                if (roundId !== data.roundId) setRoundId(data.roundId);

                setLastWinningNumber(data.lastWinningNumber || null);
                setTimer(remainingSeconds);

                if (currentPhase === 'results' && phase === 'betting') {
                    setIsBettingOverModalVisible(true);
                }
            } else {
                console.log("Game state not found, initializing...");
                const newRoundId = Date.now();
                const initialEndTime = new Date(Date.now() + BETTING_DURATION_SECONDS * 1000);
                
                setDoc(gameStateRef(), {
                    roundId: newRoundId,
                    phase: 'betting',
                    phaseEndTime: initialEndTime,
                    lastWinningNumber: null,
                }).catch(err => console.error("Failed to initialize game state:", err));
            }
        }, (error) => {
            console.error("Error listening to game state:", error);
            toast.error("Could not connect to the game. Please check your connection and login status.");
            setPhase('error');
        });
        return () => unsubscribe();
    }, [gameStateRef, phase, roundId]);

    // Effect for the visual timer countdown
    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer(prev => prev > 0 ? prev - 1 : 0);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    // Effect to handle automatic phase transitions
    useEffect(() => {
        if (timer > 0 || phase === 'loading' || !user) return;

        const roundIdToEnd = roundId;

        // --- End of Betting Phase ---
        if (phase === 'betting') {
            runTransaction(db, async (transaction) => {
                const gameStateDoc = await transaction.get(gameStateRef());
                if (!gameStateDoc.exists() || gameStateDoc.data().phase !== 'betting' || gameStateDoc.data().roundId !== roundIdToEnd) {
                    throw new Error("Phase already changed or round mismatch.");
                }
                const newEndTime = new Date(Date.now() + RESULTS_DURATION_SECONDS * 1000);
                transaction.update(gameStateRef(), { phase: 'results', phaseEndTime: newEndTime });
            }).then(() => {
                console.log("Won race to end betting round. Calculating results for round:", roundIdToEnd);
                calculateAndDistributeWinnings(roundIdToEnd);
            }).catch(error => {
                if (error.code !== 'aborted' && !error.message.includes("Phase already changed")) {
                    console.error("Failed to start result calculation:", error);
                }
            });
        }
        // --- End of Results Phase ---
        else if (phase === 'results') {
             runTransaction(db, async (transaction) => {
                const gameStateDoc = await transaction.get(gameStateRef());
                if (!gameStateDoc.exists() || gameStateDoc.data().phase !== 'results') {
                    throw new Error("Phase already changed.");
                }
                const newEndTime = new Date(Date.now() + BETTING_DURATION_SECONDS * 1000);
                transaction.update(gameStateRef(), {
                    phase: 'betting',
                    roundId: Date.now(),
                    phaseEndTime: newEndTime,
                });
                setIsBettingOverModalVisible(false);
            }).catch(error => {
                if (error.code !== 'aborted') {
                    console.error("Failed to start new betting round:", error);
                }
            });
        }
    }, [timer, phase, user, roundId, calculateAndDistributeWinnings, gameStateRef]);


    const handleBetSubmit = async () => {
        if (!user) return toast.error('Please log in to bet.');
        if (selectedNumber === null) return toast.error('Please select a number.');
        if (betAmount < 10) return toast.error('Minimum bet is ₹10.');
        if (walletBalance < betAmount) return toast.error('Insufficient balance.');
        if (phase !== 'betting') return toast.error('Betting is currently closed.');

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
                    roundId: roundId,
                    number: selectedNumber,
                    amount: betAmount,
                    createdAt: serverTimestamp(),
                    status: 'open',
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
    
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="font-roboto bg-gray-900 text-white min-h-screen p-4 pt-20">
            {isBettingOverModalVisible && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
                    <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-11/12 max-w-sm text-center">
                        <h2 className="text-2xl font-bold text-yellow-400 mb-4">Betting Time Over!</h2>
                        <p className="text-gray-300 mb-6">The results for this round will be announced shortly. Good luck!</p>
                        <button
                            onClick={() => setIsBettingOverModalVisible(false)}
                            className="bg-yellow-500 text-black font-bold py-2 px-6 rounded-lg hover:bg-yellow-600 transition-colors"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-6">
                    <h1 className="text-4xl font-bold text-yellow-400">1 to 12 Win</h1>
                    <p className="text-gray-300 text-lg">Bet on a number and win 10 times the amount!</p>
                </div>

                <div className="bg-gray-800 rounded-xl shadow-lg p-4 mb-6 flex justify-around items-center">
                    <div className="text-center">
                        <p className="text-sm text-gray-400">Status</p>
                        {phase === 'betting' && <p className="text-lg font-bold text-green-400 animate-pulse">Betting Open</p>}
                        {phase === 'results' && <p className="text-lg font-bold text-red-400">Calculating Results...</p>}
                        {phase === 'loading' && <p className="text-lg font-bold text-gray-400">Loading...</p>}
                        {phase === 'error' && <p className="text-lg font-bold text-red-600">Connection Error</p>}
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-gray-400">{phase === 'betting' ? 'Time Remaining' : 'Next Round In'}</p>
                        <p className="text-3xl font-bold text-yellow-400">{formatTime(timer)}</p>
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
                            onClick={() => setSelectedNumber(i + 1)}
                            disabled={phase !== 'betting'}
                            className={`py-5 rounded-lg text-2xl font-bold transition-all duration-200 shadow-md ${
                                selectedNumber === i + 1
                                    ? 'bg-yellow-500 text-black scale-110'
                                    : 'bg-gray-100 text-black'
                            } ${phase === 'betting' ? 'hover:bg-yellow-400' : 'cursor-not-allowed opacity-50'}`}
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
                                disabled={phase !== 'betting'}
                                className="w-full bg-gray-700 rounded-lg p-3 text-center text-xl font-bold focus:ring-2 focus:ring-yellow-500 outline-none disabled:opacity-50"
                            />
                        </div>
                        <button 
                            onClick={handleBetSubmit}
                            disabled={isSubmitting || phase !== 'betting'}
                            className="w-full bg-green-600 text-white font-bold py-3 rounded-lg text-xl flex items-center justify-center hover:bg-green-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
                            {isSubmitting ? <Loader2 className="animate-spin" /> : <Zap />}
                            <span className="ml-2">Place Bet</span>
                        </button>
                    </div>
                </div>

                <div className="text-center mt-8 text-xs text-gray-500">
                    <p className='font-bold text-yellow-500'>Disclaimer: The result calculation logic is currently running on the client-side for demonstration purposes and is not secure.</p>
                    <p className='mt-2'>
                        Winning numbers are calculated automatically after each round. The number with the lowest total bet amount wins. 
                        Winnings are 10x the bet amount and are credited to your wallet automatically.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default WinGame;