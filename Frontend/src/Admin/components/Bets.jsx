import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where, doc } from 'firebase/firestore';
import { db } from '../../../firebase'; // Adjust path as needed
import { Loader2 } from 'lucide-react';

const Bets = () => {
  const [betsSummary, setBetsSummary] = useState({});
  const [totalBets, setTotalBets] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentRoundId, setCurrentRoundId] = useState(null);

  useEffect(() => {
    const gameStateRef = doc(db, 'game_state', 'win_game_1_to_12');
    
    const unsubscribeGameState = onSnapshot(gameStateRef, (docSnap) => {
      if (docSnap.exists()) {
        const gameStateData = docSnap.data();
        if (gameStateData.roundId !== currentRoundId) {
          setCurrentRoundId(gameStateData.roundId);
        }
      } else {
        setCurrentRoundId(null); // No game state found
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching game state:", error);
      setLoading(false);
    });

    return () => {
      unsubscribeGameState();
    };
  }, [currentRoundId]);

  useEffect(() => {
    if (currentRoundId === null) {
        setBetsSummary({});
        setTotalBets(0);
        setLoading(false);
        return;
    }

    setLoading(true);
    const betsRef = collection(db, 'wingame_bets');
    const q = query(betsRef, where('roundId', '==', currentRoundId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const summary = {};
      let total = 0;
      for (let i = 1; i <= 12; i++) {
        summary[i] = { count: 0, amount: 0 };
      }

      snapshot.forEach((doc) => {
        const bet = doc.data();
        if (bet.number >= 1 && bet.number <= 12) {
          summary[bet.number].count += 1;
          summary[bet.number].amount += bet.amount;
          total += bet.amount;
        }
      });
      setBetsSummary(summary);
      setTotalBets(total);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching bets:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentRoundId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-blue-500" size={32} />
        <p className="ml-2 text-gray-600">Loading bets...</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Current Bets (Round ID: {currentRoundId || 'N/A'})</h2>
      <p className="text-lg mb-4">Total Bet Amount: ₹{totalBets}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Object.entries(betsSummary).map(([number, data]) => (
          <div key={number} className={`p-3 rounded-md text-center transition-all ${data.count > 0 ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <p className="text-xl font-bold text-blue-600">{number}</p>
            <p className="text-sm text-gray-700">Bets: {data.count}</p>
            <p className="text-sm text-gray-700">Amount: ₹{data.amount}</p>
          </div>
        ))}
      </div>
      {currentRoundId === null && !loading && (
        <p className="text-red-500 mt-4">No active game round found. Please ensure the game is running.</p>
      )}
    </div>
  );
};

export default Bets;
