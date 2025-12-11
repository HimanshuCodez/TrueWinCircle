import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where, doc, setDoc, getDoc } from 'firebase/firestore';
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

  const [market, setMarket] = useState('haruf_game');
  const [openTime, setOpenTime] = useState('');
  const [closeTime, setCloseTime] = useState('');
  const [timingLoading, setTimingLoading] = useState(false);

  useEffect(() => {
    if (!market) return;
    const fetchTimings = async () => {
      const timingDocRef = doc(db, 'market_timings', market);
      try {
        const docSnap = await getDoc(timingDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setOpenTime(data.openTime || '');
          setCloseTime(data.closeTime || '');
        } else {
          setOpenTime('');
          setCloseTime('');
        }
      } catch (error) {
        console.error("Error fetching market timings:", error);
      }
    };
    fetchTimings();
  }, [market]);

  const handleTimingUpdate = async () => {
    setTimingLoading(true);
    try {
      const timingDocRef = doc(db, 'market_timings', market);
      await setDoc(timingDocRef, { openTime, closeTime }, { merge: true });
      alert('Timings updated successfully!');
    } catch (error) {
      console.error("Error updating timings:", error);
      alert('Failed to update timings.');
    } finally {
      setTimingLoading(false);
    }
  };


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

      <div className="mt-8 p-4 border-t border-gray-200">
        <h3 className="text-xl font-semibold mb-4">Market Timing Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label htmlFor="market-select" className="block text-sm font-medium text-gray-700">Market</label>
            <select
              id="market-select"
              value={market}
              onChange={(e) => setMarket(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="haruf_game">Haruf Game</option>
              {/* Add other games here if needed */}
            </select>
          </div>
          <div>
            <label htmlFor="open-time" className="block text-sm font-medium text-gray-700">Open Time</label>
            <input
              type="time"
              id="open-time"
              value={openTime}
              onChange={(e) => setOpenTime(e.target.value)}
              className="mt-1 block w-full pl-3 pr-2 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            />
          </div>
          <div>
            <label htmlFor="close-time" className="block text-sm font-medium text-gray-700">Close Time</label>
            <input
              type="time"
              id="close-time"
              value={closeTime}
              onChange={(e) => setCloseTime(e.target.value)}
              className="mt-1 block w-full pl-3 pr-2 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            />
          </div>
          <div>
            <button
              onClick={handleTimingUpdate}
              disabled={timingLoading || !market}
              className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
            >
              {timingLoading ? 'Saving...' : 'Save Timings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bets;