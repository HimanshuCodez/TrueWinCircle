import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import useAuthStore from '../store/authStore';
import Loader from '../components/Loader';
import { ArrowDownCircle, ArrowUpCircle, AlertTriangle } from 'lucide-react';

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
        const depositsQuery = query(
          collection(db, 'top-ups'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

        const withdrawalsQuery = query(
          collection(db, 'withdrawals'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

        const [depositsSnapshot, withdrawalsSnapshot] = await Promise.all([
          getDocs(depositsQuery),
          getDocs(withdrawalsQuery),
        ]);

        const deposits = depositsSnapshot.docs.map(doc => ({
          id: doc.id,
          type: 'credit',
          amount: doc.data().amount,
          status: doc.data().status,
          date: doc.data().createdAt.toDate(),
        }));

        const withdrawals = withdrawalsSnapshot.docs.map(doc => ({
          id: doc.id,
          type: 'debit',
          amount: doc.data().amount,
          status: doc.data().status,
          date: doc.data().createdAt.toDate(),
        }));

        const combinedHistory = [...deposits, ...withdrawals];
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'rejected':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  if (loading) {
    return <Loader />;
  }

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
            {history.map((item) => {
              const isCredit = item.type === 'credit';
              return (
                <div key={item.id} className="bg-gray-800 p-4 rounded-lg flex items-center justify-between shadow-md">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${isCredit ? 'bg-green-900' : 'bg-red-900'}`}>
                      {isCredit ? (
                        <ArrowDownCircle className="text-green-500" />
                      ) : (
                        <ArrowUpCircle className="text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold capitalize">{isCredit ? 'Deposit' : 'Withdrawal'}</p>
                      <p className="text-xs text-gray-400">{item.date.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${isCredit ? 'text-green-500' : 'text-red-500'}`}>
                      {isCredit ? '+' : '-'}₹{item.amount.toFixed(2)}
                    </p>
                    <p className={`text-xs capitalize font-semibold ${getStatusColor(item.status)}`}>
                      {item.status}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
