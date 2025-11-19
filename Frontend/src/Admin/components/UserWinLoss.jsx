import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

const UserWinLoss = ({ userId }) => {
  const [winLoss, setWinLoss] = useState({ win: 0, loss: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const betsQuery = query(collection(db, 'wingame_bets'), where('userId', '==', userId));
        const betsSnapshot = await getDocs(betsQuery);
        const userBets = betsSnapshot.docs.map(d => d.data());

        let totalWin = 0;
        let totalLoss = 0;

        userBets.forEach(bet => {
            if (bet.status === 'win') {
                totalWin += bet.winnings || 0;
            } else if (bet.status === 'loss') {
                totalLoss += bet.amount || 0;
            }
        });

        setWinLoss({ win: totalWin, loss: totalLoss });
      } catch (error) {
        console.error("Error fetching win/loss for user " + userId, error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [userId]);

  if (loading) {
    return <span className="text-xs text-gray-400">...</span>;
  }

  return (
    <span className="flex items-center gap-2">
      <span className="text-green-500 font-medium text-xs">(W: ₹{winLoss.win.toFixed(2)})</span>
      <span className="text-red-500 font-medium text-xs">(L: ₹{winLoss.loss.toFixed(2)})</span>
    </span>
  );
};

export default UserWinLoss;
