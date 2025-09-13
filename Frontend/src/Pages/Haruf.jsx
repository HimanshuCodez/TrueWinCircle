import React, { useState, useEffect } from "react";
import { doc, onSnapshot, runTransaction, collection } from "firebase/firestore";
import { db } from "../firebase";
import useAuthStore from "../store/authStore";
import { toast } from "react-toastify";

const HarufGrid = () => {
  const [bets, setBets] = useState({}); // store { number: amount }
  const [bettingLoading, setBettingLoading] = useState(false);
  const [balance, setBalance] = useState(0);

  const user = useAuthStore((state) => state.user);

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
    setBets((prev) => ({
      ...prev,
      [num]: value ? parseInt(value) : "",
    }));
  };

  const handlePlaceBet = async () => {
    if (!user) {
      toast.error("You must be logged in to place a bet.");
      return;
    }

    // Filter out only numbers with >0 bet
    const placedBets = Object.entries(bets).filter(([_, amount]) => amount > 0);

    if (placedBets.length === 0) {
      toast.error("Please enter at least one bet.");
      return;
    }

    const totalBetAmount = placedBets.reduce((acc, [_, amount]) => acc + amount, 0);

    if (totalBetAmount > balance) {
      toast.error("Insufficient balance.");
      return;
    }

    setBettingLoading(true);

    try {
      await runTransaction(db, async (transaction) => {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await transaction.get(userDocRef);

        if (!userDoc.exists()) throw "User does not exist!";

        const currentBalance = userDoc.data().balance || 0;

        if (currentBalance < totalBetAmount) throw "Insufficient balance.";

        // Deduct total
        transaction.update(userDocRef, { balance: currentBalance - totalBetAmount });

        const betsCollectionRef = collection(db, "harufBets");

        placedBets.forEach(([num, amount]) => {
          transaction.set(doc(betsCollectionRef), {
            userId: user.uid,
            betType: "Haruf",
            selectedNumber: num,
            betAmount: amount,
            timestamp: new Date(),
            status: "pending",
          });
        });
      });

      toast.success("Bets placed successfully!");
      setBets({});
    } catch (e) {
      console.error("Bet placement failed: ", e);
      toast.error(`Failed to place bet: ${e.message || e}`);
    } finally {
      setBettingLoading(false);
    }
  };

  // ✅ Small reusable bet box
  const BetBox = ({ num }) => (
    <div className="flex flex-col items-center">
      <div className="h-8 w-8 flex items-center justify-center bg-red-600 text-white text-xs font-bold rounded-sm">
        {num.toString().padStart(2, "0")}
      </div>
      <input
        type="number"
        min="0"
        value={bets[num] || ""}
        onChange={(e) => handleInputChange(num, e.target.value)}
        className="mt-1 w-8 h-10 text-xs border border-gray-300 rounded-sm text-center"
      />
    </div>
  );

  return (
    <div className="flex flex-col items-center w-full pb-20">
      {/* Numbers 00–99 */}
      <div className="grid grid-cols-10 gap-2 p-2">
        {Array.from({ length: 100 }, (_, i) => (
          <BetBox key={i} num={i} />
        ))}
      </div>

      {/* Andar Haruf */}
    <div className="w-full mt-4 px-2">
  <p className="font-semibold text-red-600 text-center mb-2">Andar Haruf</p>
  <div className="grid grid-cols-10 gap-2">
    {Array.from({ length: 10 }, (_, i) => (
      <div key={`bahar-${i}`} className="flex flex-col items-center">
        {/* Number Box */}
        <div className="h-8 w-8 flex items-center justify-center bg-red-600 text-white text-sm font-bold rounded-sm">
          {i}
        </div>
        {/* Input Box */}
        <input
          type="number"
          min="0"
          value={bets[`B${i}`] || ""}
          onChange={(e) => handleInputChange(`B${i}`, e.target.value)}
          className="mt-1 w-8 h-10 text-xs border border-gray-300 rounded-sm text-center"
        />
      </div>
    ))}
  </div>
</div>


      {/* Bahar Haruf */}
<div className="w-full mt-4 px-2">
  <p className="font-semibold text-red-600 text-center mb-2">Bahar Haruf</p>
  <div className="grid grid-cols-10 gap-2">
    {Array.from({ length: 10 }, (_, i) => (
      <div key={`bahar-${i}`} className="flex flex-col items-center">
        {/* Number Box */}
        <div className="h-8 w-8 flex items-center justify-center bg-red-600 text-white text-sm font-bold rounded-sm">
          {i}
        </div>
        {/* Input Box */}
        <input
          type="number"
          min="0"
          value={bets[`B${i}`] || ""}
          onChange={(e) => handleInputChange(`B${i}`, e.target.value)}
          className="mt-1 w-8 h-10 text-xs border border-gray-300 rounded-sm text-center"
        />
      </div>
    ))}
  </div>
</div>


      {/* Sticky Place Bet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white p-3 shadow-lg">
        <button
          onClick={handlePlaceBet}
          disabled={bettingLoading}
          className="w-full bg-red-600 text-white font-bold py-3 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {bettingLoading ? "Placing Bets..." : `Place bid for ₹${Object.values(bets).reduce((a, b) => a + (parseInt(b) || 0), 0)}`}
        </button>
      </div>
    </div>
  );
};

export default HarufGrid;
