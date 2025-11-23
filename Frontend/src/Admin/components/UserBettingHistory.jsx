import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, doc, documentId } from 'firebase/firestore';
import { db } from '../../firebase';
import Loader from '../../components/Loader';

const UserBettingHistory = ({ userId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBetHistory = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const betsQuery = query(
          collection(db, 'wingame_bets'),
          where('userId', '==', userId)
        );
        const betsSnapshot = await getDocs(betsQuery);
        const userBets = betsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        // Sort on the client-side to avoid needing a composite index
        userBets.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));

        if (userBets.length === 0) {
          setHistory([]);
          setLoading(false);
          return;
        }

        const roundIds = [...new Set(userBets.map(bet => String(bet.roundId)))];
        if (roundIds.length > 0) {
            const roundsQuery = query(
              collection(db, 'wingame_rounds'),
              where(documentId(), 'in', roundIds)
            );
            const roundsSnapshot = await getDocs(roundsQuery);
            const resultsMap = {};
            roundsSnapshot.forEach(doc => {
              resultsMap[doc.id] = doc.data().winningNumber;
            });

            const fullHistory = userBets.map(bet => {
              if (!bet.createdAt?.toDate) return null;
              return {
                ...bet,
                resultNumber: resultsMap[bet.roundId] ?? 'N/A',
                createdAt: bet.createdAt.toDate(),
              };
            }).filter(Boolean);
            setHistory(fullHistory);
        } else {
            setHistory([]);
        }

      } catch (error) {
        console.error("Error fetching bet history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBetHistory();
  }, [userId]);

  if (loading) {
    return <div className="flex justify-center items-center p-8"><Loader /></div>;
  }

  // Calculate totals
  const totalWins = history.filter(bet => bet.status === 'win').length;
  const totalLosses = history.filter(bet => bet.status === 'loss').length;
  const totalWinnings = history.reduce((acc, bet) => (bet.status === 'win' ? acc + bet.winnings : acc), 0);
  const totalLossAmount = history.reduce((acc, bet) => (bet.status === 'loss' ? acc + bet.amount : acc), 0);

  return (
    <div className="bg-gray-50 p-4 md:p-6 rounded-lg shadow-lg mt-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Betting History</h2>

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
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-200 text-gray-600 text-sm">
                <th className="p-3">Round ID</th>
                <th className="p-3 text-center">Bet Number</th>
                <th className="p-3 text-center">Result</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Win/Loss</th>
              </tr>
            </thead>
            <tbody>
              {history.map(bet => (
                <tr key={bet.id} className="border-b border-gray-200 last:border-0">
                  <td className="p-3 text-xs text-gray-500">{bet.roundId}</td>
                  <td className="p-3 text-center font-bold text-lg">{bet.number}</td>
                  <td className="p-3 text-center font-bold text-lg text-blue-600">{bet.resultNumber}</td>
                  <td className="p-3 text-right">₹{bet.amount.toFixed(2)}</td>
                  <td className={`p-3 text-center font-semibold ${
                    bet.status === 'win' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {bet.status === 'win' ? 'Win' : 'Loss'}
                  </td>
                  <td className={`p-3 text-right font-bold ${
                    bet.status === 'win' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {bet.status === 'win' ? `+₹${bet.winnings.toFixed(2)}` : `-₹${bet.amount.toFixed(2)}`}
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
