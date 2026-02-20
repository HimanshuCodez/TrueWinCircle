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
        const wingameQuery = query(collection(db, 'wingame_bets'), where('userId', '==', userId));
        const harufQuery = query(collection(db, 'harufBets'), where('userId', '==', userId));
        const rouletteQuery = query(collection(db, 'rouletteBets'), where('userId', '==', userId));

        const [wingameSnap, harufSnap, rouletteSnap] = await Promise.all([
          getDocs(wingameQuery),
          getDocs(harufQuery),
          getDocs(rouletteQuery)
        ]);

        let totalWin = 0;
        let totalLoss = 0;

        const processBets = (docs, amountKey = 'amount', winningsKey = 'winnings') => {
          docs.forEach(d => {
            const bet = d.data();
            if (bet.status === 'win') {
              totalWin += bet[winningsKey] || 0;
            } else if (bet.status === 'loss') {
              totalLoss += bet[amountKey] || 0;
            }
          });
        };

        processBets(wingameSnap.docs);
        processBets(harufSnap.docs, 'betAmount', 'winnings');
        processBets(rouletteSnap.docs, 'betAmount', 'winnings');

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
