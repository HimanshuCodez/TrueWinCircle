import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import Loader from '../../components/Loader';

// Helper to format date and time
const formatTimestamp = (timestamp) => {
  if (!timestamp || !timestamp.toDate) {
    return { date: 'N/A', time: 'N/A' };
  }
  const d = timestamp.toDate();
  return {
    date: d.toLocaleDateString(),
    time: d.toLocaleTimeString(),
  };
};

// Fetch functions for each game type
const fetchWinGameBets = async (userId) => {
  const betsQuery = query(collection(db, 'wingame_bets'), where('userId', '==', userId));
  const snapshot = await getDocs(betsQuery);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    const { date, time } = formatTimestamp(data.createdAt);
    return {
      id: doc.id,
      gameName: '1 to 12 Win',
      date,
      time,
      number: data.number,
      amount: data.amount,
      status: data.status || 'pending',
      payout: data.status === 'win' ? data.winnings : (data.status === 'loss' ? -data.amount : 0),
      rawDate: data.createdAt?.toDate() || null
    };
  });
};

const fetchHarufBets = async (userId) => {
  const betsQuery = query(collection(db, 'harufBets'), where('userId', '==', userId));
  const snapshot = await getDocs(betsQuery);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    const { date, time } = formatTimestamp(data.timestamp);
    return {
      id: doc.id,
      gameName: 'Haruf Game',
      date,
      time,
      number: data.selectedNumber,
      amount: data.betAmount,
      status: data.status || 'pending',
      payout: data.status === 'win' ? data.winnings : (data.status === 'loss' ? -data.betAmount : 0),
      rawDate: data.timestamp?.toDate() || null
    };
  });
};

const fetchRouletteBets = async (userId) => {
  const betsQuery = query(collection(db, 'rouletteBets'), where('userId', '==', userId));
  const snapshot = await getDocs(betsQuery);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    const { date, time } = formatTimestamp(data.timestamp);
    return {
      id: doc.id,
      gameName: 'Roulette',
      date,
      time,
      number: data.betType,
      amount: data.betAmount,
      status: data.status || 'pending',
      payout: data.status === 'win' ? data.winnings : (data.status === 'loss' ? -data.betAmount : 0),
      rawDate: data.timestamp?.toDate() || null
    };
  });
};


const UserBettingHistory = ({ userId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllBetHistory = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch from all collections in parallel
        const [winGameBets, harufBets, rouletteBets] = await Promise.all([
          fetchWinGameBets(userId),
          fetchHarufBets(userId),
          fetchRouletteBets(userId),
        ]);

        const allBets = [...winGameBets, ...harufBets, ...rouletteBets];

        // Sort all bets by date, descending
        allBets.sort((a, b) => (b.rawDate || 0) - (a.rawDate || 0));

        setHistory(allBets);

      } catch (error) {
        console.error("Error fetching combined bet history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllBetHistory();
  }, [userId]);

  if (loading) {
    return <div className="flex justify-center items-center p-8"><Loader /></div>;
  }

  // Calculate totals
  const totalWins = history.filter(bet => bet.status === 'win').length;
  const totalLosses = history.filter(bet => bet.status === 'loss').length;
  const totalWinnings = history.reduce((acc, bet) => (bet.status === 'win' && typeof bet.payout === 'number' ? acc + bet.payout : acc), 0);
  const totalLossAmount = history.reduce((acc, bet) => (bet.status === 'loss' && typeof bet.payout === 'number' ? acc - bet.payout : acc), 0);

  return (
    <div className="bg-gray-50 p-4 md:p-6 rounded-lg shadow-lg mt-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Combined Betting History</h2>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-green-100 p-4 rounded-lg">
            <p className="text-sm text-green-800">Total Wins</p>
            <p className="text-2xl font-bold text-green-600">{totalWins}</p>
            <p className="text-sm font-semibold text-green-700">+₹{totalWinnings.toFixed(2)}</p>
        </div>
        <div className="bg-red-100 p-4 rounded-lg">
            <p className="text-sm text-red-800">Total Losses</p>
            <p className="text-2xl font-bold text-red-600">{totalLosses}</p>
            <p className="text-sm font-semibold text-red-700">-₹{totalLossAmount.toFixed(2)}</p>
        </div>
      </div>

      {history.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No betting history found for this user.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-200 text-gray-600 text-sm">
                <th className="p-3">Game</th>
                <th className="p-3">Date/Time</th>
                <th className="p-3 text-center">Bet</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Win/Loss</th>
              </tr>
            </thead>
            <tbody>
              {history.map(bet => (
                <tr key={bet.id} className="border-b border-gray-200 last:border-0 hover:bg-gray-100">
                  <td className="p-3 font-semibold">{bet.gameName}</td>
                  <td className="p-3 text-xs text-gray-600">
                    <div>{bet.date}</div>
                    <div>{bet.time}</div>
                  </td>
                  <td className="p-3 text-center font-bold text-lg">{String(bet.number)}</td>
                  <td className="p-3 text-right">₹{bet.amount.toFixed(2)}</td>
                  <td className={`p-3 text-center font-semibold capitalize ${
                    bet.status === 'win' ? 'text-green-500' : 
                    bet.status === 'loss' ? 'text-red-500' :
                    'text-gray-500'
                  }`}>
                    {bet.status}
                  </td>
                  <td className={`p-3 text-right font-bold ${
                    bet.status === 'win' ? 'text-green-500' : 
                    bet.status === 'loss' ? 'text-red-500' :
                    'text-gray-500'
                  }`}>
                    {bet.status === 'win' ? `+₹${bet.payout.toFixed(2)}` : 
                     bet.status === 'loss' ? `-₹${Math.abs(bet.payout).toFixed(2)}` :
                     'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserBettingHistory;