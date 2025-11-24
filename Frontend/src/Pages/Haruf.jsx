import React, { useState, useEffect, useCallback } from "react";
import { doc, onSnapshot, runTransaction, collection, serverTimestamp, query, where, getDocs, writeBatch, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import useAuthStore from "../store/authStore";
import { toast } from "react-toastify";

const HARUF_PAYOUT_MULTIPLIER = 20;

const ROUND_DURATION_MINUTES = 1; // Each round lasts for 1 minute.



// BetBox component moved outside of HarufGrid to prevent re-rendering on every state change.

const BetBox = ({ num, value, onChange }) => (

    <div className="flex flex-col items-center">

      <div className="h-8 w-8 flex items-center justify-center bg-red-600 text-white text-xs font-bold rounded-sm">

        {num.toString().padStart(2, "0")}

      </div>

      <input

        type="number"

        pattern="[0-9]*"

        inputMode="numeric"

        min="0"

        value={value || ""}

        onChange={(e) => onChange(num, e.target.value)}

        className="mt-1 w-8 h-10 text-xs border border-gray-300 rounded-sm text-center"

      />

    </div>

  );



const HarufGrid = () => {

    const [bets, setBets] = useState({});

    const [bettingLoading, setBettingLoading] = useState(false);

    const [balance, setBalance] = useState(0);

    const [lastWinningNumber, setLastWinningNumber] = useState(null);



    const { user } = useAuthStore((state) => state.user);



    const processHarufRounds = useCallback(async () => {

        const gameStateRef = doc(db, 'game_state', 'haruf_game');

    

        try {

            await runTransaction(db, async (transaction) => {

                const gameStateDoc = await transaction.get(gameStateRef);

                let currentRoundId;

    

                if (!gameStateDoc.exists()) {

                    console.log("Haruf game state not found, initializing...");

                    const now = new Date();

                    currentRoundId = now.getTime();

                    const roundEndsAt = new Date(currentRoundId + ROUND_DURATION_MINUTES * 60 * 1000);

                    transaction.set(gameStateRef, {

                        roundId: currentRoundId,

                        roundEndsAt: roundEndsAt,

                        lastRoundProcessed: null,

                    });

                    return; 

                }

    

                const gameState = gameStateDoc.data();

                const roundEndsAt = gameState.roundEndsAt.toDate();

                currentRoundId = gameState.roundId;

    

                if (new Date() < roundEndsAt) {

                    return; // Current round is still active.

                }

    

                // --- Round has ended, process winnings ---

                console.log(`Processing Haruf round: ${currentRoundId}`);

    

                const winningNumber = Math.floor(Math.random() * 100) + 1;

                console.log(`Haruf winning number for round ${currentRoundId} is: ${winningNumber}`);

    

                const betsRef = collection(db, "harufBets");

                const q = query(betsRef, where("roundId", "==", currentRoundId), where("status", "==", "pending"));

                

                // Reading documents must be done before writing in a transaction.

                const betsSnapshot = await getDocs(q);

    

                const userWinnings = {};

    

                betsSnapshot.forEach(betDoc => {

                    const bet = betDoc.data();

                    if (parseInt(bet.selectedNumber) === winningNumber) {

                        const winnings = bet.betAmount * HARUF_PAYOUT_MULTIPLIER;

                        userWinnings[bet.userId] = (userWinnings[bet.userId] || 0) + winnings;

                        transaction.update(betDoc.ref, { status: 'win', winnings });

                    } else {

                        transaction.update(betDoc.ref, { status: 'loss', winnings: 0 });

                    }

                });

    

                // Credit winnings to users

                for (const userId in userWinnings) {

                    const amountToCredit = userWinnings[userId];

                    if (amountToCredit > 0) {

                        const userDocRef = doc(db, "users", userId);

                        const userDoc = await transaction.get(userDocRef);

                        if (userDoc.exists()) {

                            const currentWinnings = userDoc.data().winningMoney || 0;

                            const newWinnings = currentWinnings + amountToCredit;

                            transaction.update(userDocRef, { winningMoney: newWinnings });



                            if (userId === user?.uid) {

                                toast.success(`You won ₹${amountToCredit.toFixed(2)}!`);

                            }

                        }

                    }

                }

    

                // Start a new round

                const newRoundId = new Date().getTime();

                const newRoundEndsAt = new Date(newRoundId + ROUND_DURATION_MINUTES * 60 * 1000);

                transaction.update(gameStateRef, {

                    roundId: newRoundId,

                    roundEndsAt: newRoundEndsAt,

                    lastWinningNumber: winningNumber,

                    lastRoundProcessed: currentRoundId,

                });

            });

        } catch (error) {

            if (error.code !== 'aborted') {

                console.error("Error in Haruf round processing:", error);

            }

        }

    }, [user]);



    useEffect(() => {

        const gameStateRef = doc(db, 'game_state', 'haruf_game');

        const unsubscribe = onSnapshot(gameStateRef, (docSnap) => {

            if (docSnap.exists()) {

                setLastWinningNumber(docSnap.data().lastWinningNumber || null);

            }

        });



        const intervalId = setInterval(() => {

            processHarufRounds();

        }, 60000); // Check every minute to see if a round has ended



        processHarufRounds(); // Run once on component load



        return () => {

            clearInterval(intervalId);

            unsubscribe();

        };

    }, [processHarufRounds]);



    useEffect(() => {

        if (user) {

            const userDocRef = doc(db, "users", user.uid);

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



    const handleInputChange = (num, value) => {

        const sanitizedValue = value.replace(/[^0-9]/g, "");

        setBets((prev) => ({ ...prev, [num]: sanitizedValue }));

    };



    const handlePlaceBet = async () => {

        if (!user) return toast.error("You must be logged in to place a bet.");

        

        const gameStateRef = doc(db, 'game_state', 'haruf_game');

        const gameStateSnap = await getDoc(gameStateRef);

        if (!gameStateSnap.exists()) {

            return toast.error("Game is not ready. Please try again in a moment.");

        }

        const { roundId, roundEndsAt } = gameStateSnap.data();



        // Optional: Prevent betting in the last few seconds of a round

        const bettingCutoff = roundEndsAt.toDate();

        bettingCutoff.setSeconds(bettingCutoff.getSeconds() - 10); // e.g., last 10 seconds

        if (new Date() > bettingCutoff) {

            return toast.warn("The betting window for this round is closing. Please wait for the next round.");

        }



        const finalBets = {};

        for (const key in bets) {

            const amount = parseInt(bets[key]) || 0;

            if (amount > 0) {

                if (key.startsWith('A')) {

                    const andarDigit = parseInt(key.substring(1));

                    for (let j = 0; j < 10; j++) {

                        const num = andarDigit * 10 + j;

                        finalBets[num.toString()] = (finalBets[num.toString()] || 0) + (amount / 10);

                    }

                } else if (key.startsWith('B')) {

                    const baharDigit = parseInt(key.substring(1));

                    for (let j = 0; j < 10; j++) {

                        const num = j * 10 + baharDigit;

                        finalBets[num.toString()] = (finalBets[num.toString()] || 0) + (amount / 10);

                    }

                } else {

                    const num = parseInt(key);

                    if (!isNaN(num)) {

                        finalBets[num.toString()] = (finalBets[num.toString()] || 0) + amount;

                    }

                }

            }

        }



        const placedBets = Object.entries(finalBets).filter(([_, amount]) => amount > 0);

        if (placedBets.length === 0) return toast.error("Please enter at least one bet.");



        const totalBetAmount = placedBets.reduce((acc, [_, amount]) => acc + amount, 0);

        if (totalBetAmount > balance) return toast.error("Insufficient balance.");



        setBettingLoading(true);

        try {

            await runTransaction(db, async (transaction) => {

                const userDocRef = doc(db, "users", user.uid);

                const userDoc = await transaction.get(userDocRef);

                if (!userDoc.exists()) throw new Error("User does not exist!");



                const currentBalance = userDoc.data().balance || 0;

                if (currentBalance < totalBetAmount) throw new Error("Insufficient balance.");



                const newBalance = Math.round((currentBalance - totalBetAmount) * 100) / 100;

                transaction.update(userDocRef, { balance: newBalance });



                const betsCollectionRef = collection(db, "harufBets");

                placedBets.forEach(([num, amount]) => {

                    const roundedAmount = Math.round(amount * 100) / 100;

                    if (roundedAmount > 0) {

                        transaction.set(doc(betsCollectionRef), {

                            userId: user.uid,

                            roundId: roundId,

                            betType: "Haruf",

                            selectedNumber: num,

                            betAmount: roundedAmount,

                            timestamp: serverTimestamp(),

                            status: "pending",

                        });

                    }

                });

            });



            toast.success("Bets placed successfully!");

            toast.info("Result in approximately 1 minute.");

            setBets({});

        } catch (e) {

            console.error("Bet placement failed: ", e);

            toast.error(`Failed to place bet: ${e.message || e}`);

        } finally {

            setBettingLoading(false);

        }

    };



    return (

        <div className="flex flex-col items-center w-full pb-20 pt-10">

            <div className="text-center mb-4 p-2 bg-gray-800 text-white rounded-lg shadow-lg">

                <p className="text-sm text-gray-400">Last Winning Number</p>

                <p className="text-3xl font-bold text-yellow-400">{lastWinningNumber !== null ? String(lastWinningNumber).padStart(2, '0') : '--'}</p>

            </div>

            

            <div className="grid grid-cols-10 gap-2 p-2">

                {Array.from({ length: 100 }, (_, i) => (

                    <BetBox key={i + 1} num={i + 1} value={bets[i + 1]} onChange={handleInputChange} />

                ))}

            </div>



            <div className="w-full mt-4 px-2">

                <p className="font-semibold text-red-600 text-center mb-2">Andar Haruf</p>

                <div className="grid grid-cols-10 gap-2">

                    {Array.from({ length: 10 }, (_, i) => (

                        <div key={`andar-${i}`} className="flex flex-col items-center">

                            <div className="h-8 w-8 flex items-center justify-center bg-red-600 text-white text-sm font-bold rounded-sm">{i}</div>

                            <input type="number" pattern="[0-9]*" inputMode="numeric" min="0" value={bets[`A${i}`] || ""} onChange={(e) => handleInputChange(`A${i}`, e.target.value)} className="mt-1 w-8 h-10 text-xs border border-gray-300 rounded-sm text-center" />

                        </div>

                    ))}

                </div>

            </div>



            <div className="w-full mt-4 px-2">

                <p className="font-semibold text-red-600 text-center mb-2">Bahar Haruf</p>

                <div className="grid grid-cols-10 gap-2">

                    {Array.from({ length: 10 }, (_, i) => (

                        <div key={`bahar-${i}`} className="flex flex-col items-center">

                            <div className="h-8 w-8 flex items-center justify-center bg-red-600 text-white text-sm font-bold rounded-sm">{i}</div>

                            <input type="number" pattern="[0-9]*" inputMode="numeric" min="0" value={bets[`B${i}`] || ""} onChange={(e) => handleInputChange(`B${i}`, e.target.value)} className="mt-1 w-8 h-10 text-xs border border-gray-300 rounded-sm text-center" />

                        </div>

                    ))}

                </div>

            </div>



            <div className="fixed bottom-0 left-0 right-0 bg-white p-3 shadow-lg">

                <button onClick={handlePlaceBet} disabled={bettingLoading} className="w-full bg-red-600 text-white font-bold py-3 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed">

                    {bettingLoading ? "Placing Bets..." : `Place Bid (₹${Object.values(bets).reduce((a, b) => a + (parseInt(b) || 0), 0)})`}

                </button>

            </div>

        </div>

    );

};



export default HarufGrid;
