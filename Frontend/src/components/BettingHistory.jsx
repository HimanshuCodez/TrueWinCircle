import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, doc, documentId } from 'firebase/firestore';
import { db } from '../firebase';
import useAuthStore from '../store/authStore';
import Loader from './Loader';

const BettingHistory = () => {
  const { user } = useAuthStore();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBetHistory = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch all of the user's bets, ordered by most recent
        const betsQuery = query(
          collection(db, 'wingame_bets'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const betsSnapshot = await getDocs(betsQuery);
        const userBets = betsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        if (userBets.length === 0) {
          setHistory([]);
          setLoading(false);
          return;
        }

        // 2. Get the unique round IDs from those bets
        const roundIds = [...new Set(userBets.map(bet => String(bet.roundId)))];

        // 3. Fetch the official results for all those rounds in a single query
        const roundsQuery = query(
          collection(db, 'wingame_rounds'),
          where(documentId(), 'in', roundIds)
        );
        const roundsSnapshot = await getDocs(roundsQuery);
        const resultsMap = {};
        roundsSnapshot.forEach(doc => {
          resultsMap[doc.id] = doc.data().winningNumber;
        });

        // 4. Combine the bet data with the round result data
        const fullHistory = userBets.map(bet => ({
          ...bet,
          resultNumber: resultsMap[bet.roundId] ?? 'N/A',
          createdAt: bet.createdAt.toDate(), // Convert timestamp to Date object
        }));

        setHistory(fullHistory);
      } catch (error) {
        console.error("Error fetching bet history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBetHistory();
  }, [user]);

  if (loading) {
    return <div className="flex justify-center items-center p-8"><Loader /></div>;
  }

  return (
    <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg mt-6">
      <h2 className="text-2xl font-bold text-yellow-400 mb-4">Betting History</h2>
      {history.length === 0 ? (
        <p className="text-gray-400 text-center py-4">You have not placed any bets yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-700 text-gray-300 text-sm">
                <th className="p-3">Round ID</th>
                <th className="p-3 text-center">Your Bet</th>
                <th className="p-3 text-center">Result</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Win/Loss</th>
              </tr>
            </thead>
            <tbody>
              {history.map(bet => (
                <tr key={bet.id} className="border-b border-gray-700/50 last:border-0 hover:bg-white/5">
                  <td className="p-3 text-xs text-gray-500">{bet.roundId}</td>
                  <td className="p-3 text-center font-bold text-lg">{bet.number}</td>
                  <td className="p-3 text-center font-bold text-lg text-yellow-400">{bet.resultNumber}</td>
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

export default BettingHistory;
