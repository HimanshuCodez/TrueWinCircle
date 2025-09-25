import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import useAuthStore from '../store/authStore';
import Loader from '../components/Loader';
import { ArrowDownCircle, ArrowUpCircle, AlertTriangle, Trophy, ShieldX } from 'lucide-react';

const History = () => {
  const user = useAuthStore((state) => state.user);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?.uid) {
        setError("Please log in to view your history.");
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch Deposits
        const depositsQuery = query(collection(db, 'top-ups'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
        
        // 2. Fetch Withdrawals
        const withdrawalsQuery = query(collection(db, 'withdrawals'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));

        // 3. Fetch Game Bets
        const betsQuery = query(collection(db, 'wingame_bets'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));

        // 4. Fetch Referral Bonuses
        const referralBonusQuery = query(collection(db, 'transactions'), where('userId', '==', user.uid), where('type', '==', 'referral_bonus'), orderBy('createdAt', 'desc'));

        const [depositsSnapshot, withdrawalsSnapshot, betsSnapshot, referralBonusSnapshot] = await Promise.all([
          getDocs(depositsQuery),
          getDocs(withdrawalsQuery),
          getDocs(betsQuery),
          getDocs(referralBonusQuery),
        ]);

        const deposits = depositsSnapshot.docs.map(doc => ({
          id: doc.id,
          type: 'deposit',
          amount: doc.data().amount,
          status: doc.data().status,
          date: doc.data().createdAt.toDate(),
        }));

        const withdrawals = withdrawalsSnapshot.docs.map(doc => ({
          id: doc.id,
          type: 'withdrawal',
          amount: doc.data().amount,
          status: doc.data().status,
          date: doc.data().createdAt.toDate(),
        }));

        const bets = betsSnapshot.docs.map(doc => {
          const data = doc.data();
          const isWin = data.status === 'win';
          return {
            id: doc.id,
            type: isWin ? 'win' : 'loss',
            amount: isWin ? data.winnings || (data.amount * 10) : data.amount,
            status: `Bet on ${data.number}`,
            date: data.createdAt.toDate(),
          };
        });

        const referralBonuses = referralBonusSnapshot.docs.map(doc => ({
          id: doc.id,
          type: 'referral_bonus',
          amount: doc.data().amount,
          status: 'Received',
          date: doc.data().createdAt.toDate(),
        }));

        const combinedHistory = [...deposits, ...withdrawals, ...bets, ...referralBonuses];
        combinedHistory.sort((a, b) => b.date.getTime() - a.date.getTime());

        setHistory(combinedHistory);
      } catch (err) {
        console.error("Error fetching transaction history:", err);
        setError("Failed to load transaction history.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user?.uid]);

  const renderHistoryItem = (item) => {
    let Icon, title, amountColor, sign, statusText, statusColor;

    switch (item.type) {
      case 'deposit':
        Icon = <ArrowDownCircle className="text-green-500" />;
        title = 'Deposit';
        amountColor = 'text-green-500';
        sign = '+';
        statusText = item.status;
        statusColor = item.status === 'approved' ? 'text-green-400' : item.status === 'pending' ? 'text-yellow-400' : 'text-red-400';
        break;
      case 'withdrawal':
        Icon = <ArrowUpCircle className="text-red-500" />;
        title = 'Withdrawal';
        amountColor = 'text-red-500';
        sign = '-';
        statusText = item.status;
        statusColor = item.status === 'approved' ? 'text-green-400' : item.status === 'pending' ? 'text-yellow-400' : 'text-red-400';
        break;
      case 'win':
        Icon = <Trophy className="text-yellow-500" />;
        title = 'Game Win';
        amountColor = 'text-yellow-500';
        sign = '+';
        statusText = item.status;
        statusColor = 'text-gray-400';
        break;
      case 'loss':
        Icon = <ShieldX className="text-gray-500" />;
        title = 'Game Loss';
        amountColor = 'text-gray-500';
        sign = '-';
        statusText = item.status;
        statusColor = 'text-gray-400';
        break;
      case 'referral_bonus':
        Icon = <Gift className="text-purple-500" />;
        title = 'Referral Bonus';
        amountColor = 'text-purple-500';
        sign = '+';
        statusText = item.status;
        statusColor = 'text-green-400';
        break;
      default: return null;
    }

    return (
      <div key={item.id} className="bg-gray-800 p-4 rounded-lg flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-4">
          <div className="p-2 rounded-full bg-gray-900">{Icon}</div>
          <div>
            <p className="font-semibold capitalize">{title}</p>
            <p className="text-xs text-gray-400">{item.date.toLocaleString()}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`font-bold text-lg ${amountColor}`}>
            {sign}₹{item.amount.toFixed(2)}
          </p>
          <p className={`text-xs capitalize font-semibold ${statusColor}`}>
            {statusText}
          </p>
        </div>
      </div>
    );
  };

  if (loading) return <Loader />;

  if (error) {
    return (
      <div className="text-center text-red-400 mt-20 p-4 flex flex-col items-center">
        <AlertTriangle className="w-12 h-12 mb-4" />
        <h2 className="text-xl font-semibold">An Error Occurred</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="font-roboto bg-gray-900 text-white min-h-screen p-4 pt-20">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-yellow-400 mb-6 text-center">Transaction History</h1>
        {history.length === 0 ? (
          <p className="text-center text-gray-400">You have no transactions yet.</p>
        ) : (
          <div className="space-y-4">
            {history.map(renderHistoryItem)}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;