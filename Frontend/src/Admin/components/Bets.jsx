import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Loader2 } from 'lucide-react';

const GAME_DURATION_SECONDS = 120;
const BETTING_PERIOD_SECONDS = 60;

const Bets = () => {
  const [betsSummary, setBetsSummary] = useState({});
  const [totalBets, setTotalBets] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentRoundId, setCurrentRoundId] = useState(null);
  const [roundEndTime, setRoundEndTime] = useState(null);
  const [remainingTime, setRemainingTime] = useState(null);
  const [stage, setStage] = useState('loading'); // 'loading', 'betting', 'waiting'

  useEffect(() => {
    const gameStateRef = doc(db, 'game_state', 'win_game_1_to_12');
    
    const unsubscribeGameState = onSnapshot(gameStateRef, (docSnap) => {
      if (docSnap.exists()) {
        const gameStateData = docSnap.data();
        if (gameStateData.roundId !== currentRoundId) {
          setCurrentRoundId(gameStateData.roundId);
        }
        if (gameStateData.roundEndsAt) { // Changed from nextResultTime
          setRoundEndTime(gameStateData.roundEndsAt.toDate());
        } else {
          setRoundEndTime(null);
        }
      } else {
        setCurrentRoundId(null); // No game state found
        setRoundEndTime(null);
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
    if (!roundEndTime) {
      setRemainingTime(null);
      setStage('loading');
      return;
    }

    const timer = setInterval(() => {
      const now = new Date();
      const diffSeconds = Math.floor((roundEndTime - now) / 1000);

      if (diffSeconds <= 0) {
        setRemainingTime(0);
        setStage('waiting');
        clearInterval(timer);
      } else if (diffSeconds <= (GAME_DURATION_SECONDS - BETTING_PERIOD_SECONDS)) {
        setStage('waiting');
        setRemainingTime(diffSeconds);
      } else {
        setStage('betting');
        setRemainingTime(diffSeconds - (GAME_DURATION_SECONDS - BETTING_PERIOD_SECONDS));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [roundEndTime]);

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

  if (loading && currentRoundId === null) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-blue-500" size={32} />
        <p className="ml-2 text-gray-600">Loading bets...</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">
          Current Bets (Round ID: {currentRoundId || 'N/A'})
        </h2>
        <div className="text-right">
          {stage === 'loading' ? (
              <p className="text-lg font-bold text-gray-500">Loading...</p>
          ) : (
            <>
              <p className="text-sm text-gray-500">
                {stage === 'betting' ? 'Betting Ends In' : 'Result In'}
              </p>
              <p className={`text-2xl font-bold ${stage === 'betting' ? 'text-green-500' : 'text-red-500'}`}>
                {remainingTime !== null ? `${remainingTime}s` : '...'}
              </p>
            </>
          )}
        </div>
      </div>
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