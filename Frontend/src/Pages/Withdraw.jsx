// src/components/Withdraw.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, runTransaction, collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";
import { ArrowLeft, IndianRupee } from "lucide-react";
import SocialButtons from '../components/Soical';

const Withdraw = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  
  const [user, setUser] = useState(null);
  const [authStatusLoaded, setAuthStatusLoaded] = useState(false);

  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [method, setMethod] = useState('upi'); // 'upi' or 'bank'

  const [loading, setLoading] = useState(true); // Combined loading state
  const [submitLoading, setSubmitLoading] = useState(false); // For withdrawal submission
  const [error, setError] = useState('');
  const [winningMoney, setWinningMoney] = useState(0);

  const [withdrawals, setWithdrawals] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthStatusLoaded(true);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    const fetchWinningMoney = async () => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setWinningMoney(parseFloat(userSnap.data().winningMoney) || 0);
          } else {
            toast.error("User data not found.");
            setError("User data not found.");
          }
        } catch (err) {
          console.error("Error fetching winning money:", err);
          toast.error("Failed to load winning money.");
          setError("Failed to load winning money.");
        } finally {
          setLoading(false);
        }
      }
    };

    if (authStatusLoaded) {
      if (user) {
        fetchWinningMoney();
      } else {
        setLoading(false);
        setError("Please log in to withdraw.");
      }
    }
  }, [user, authStatusLoaded]);

  useEffect(() => {
    if (!user) {
        setWithdrawals([]);
        return;
    }

    const q = query(
        collection(db, "withdrawals"),
        where("userId", "==", user.uid),
        limit(20) // Fetch a larger batch to ensure we get recent ones
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const now = new Date();
        const fetchedWithdrawals = querySnapshot.docs
            .map(doc => ({
                ...doc.data(),
                id: doc.id
            }))
            // Sort client-side to avoid requiring a Firestore composite index
            .sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                return dateB - dateA;
            })
            .filter(w => {
                // Safely handle both Timestamp and Date objects
                let createdAtDate = null;
                if (w.createdAt?.toDate) {
                    createdAtDate = w.createdAt.toDate();
                } else if (w.createdAt instanceof Date) {
                    createdAtDate = w.createdAt;
                } else if (typeof w.createdAt === 'string') {
                    createdAtDate = new Date(w.createdAt);
                }

                if (!createdAtDate) return w.status === 'pending';

                const diffInHours = (now - createdAtDate) / (1000 * 60 * 60);
                return w.status === 'pending' || diffInHours < 24;
            })
            .slice(0, 5); // Only show the latest 5 after sorting and filtering
        setWithdrawals(fetchedWithdrawals);
    }, (err) => {
        console.error("Error fetching withdrawals:", err);
        if (err.code === 'failed-precondition') {
            toast.error("Query index missing. Check console for link to create it.");
        } else {
            toast.error("Could not load recent withdrawals.");
        }
    });

    return () => unsubscribe();
  }, [user]);

  const validateUPI = (upi) => {
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    return upiRegex.test(upi);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const withdrawalAmount = parseFloat(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }

    if (withdrawalAmount > winningMoney) {
        toast.error('Insufficient winning money.');
        return;
    }
    if (withdrawalAmount < 200) {
        toast.error('Minimum withdrawal amount is ₹200.');
        return;
    }

    if (method === 'upi' && !validateUPI(upiId)) {
      toast.error('Please enter a valid UPI ID (e.g., user@bank).');
      return;
    }

    if (method === 'bank' && (!accountNumber || !ifscCode || !bankName)) {
      toast.error('Please fill in all bank details.');
      return;
    }

    if (!user) {
      toast.error('User not logged in.');
      return;
    }

    setSubmitLoading(true);

    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await transaction.get(userRef);

        if (!userSnap.exists()) {
          throw new Error("User data not found in Firestore.");
        }

        const currentWinningMoney = userSnap.data().winningMoney || 0;
        const userName = userSnap.data().name || 'Anonymous';

        if (currentWinningMoney < withdrawalAmount) {
          throw new Error("Insufficient winning money for withdrawal.");
        }

        // Deduct winning money
        transaction.update(userRef, { winningMoney: currentWinningMoney - withdrawalAmount });

        // Record withdrawal request
        const withdrawalsCollectionRef = collection(db, 'withdrawals');
        transaction.set(doc(withdrawalsCollectionRef), {
          userId: user.uid,
          name: userName,
          amount: withdrawalAmount,
          method,
          upiId: method === 'upi' ? upiId : '',
          accountNumber: method === 'bank' ? accountNumber : '',
          ifscCode: method === 'bank' ? ifscCode : '',
          bankName: method === 'bank' ? bankName : '',
          status: 'pending',
          createdAt: new Date(),
        });
      });
      
      toast.success('Withdrawal request submitted successfully!');
      setAmount('');
      setUpiId('');
      setAccountNumber('');
      setIfscCode('');
      setBankName('');
    } catch (err) {
      console.error('Withdrawal error:', err);
      toast.error(`Withdrawal failed: ${err.message}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="font-roboto min-h-screen bg-[#042346] text-white p-4">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate("/Wallet")}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-yellow-500" />
        </button>
        <h1 className="text-2xl font-bold ml-4">Withdraw Winning Money</h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading...</p>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 h-64 flex items-center justify-center">
          <p>{error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Recent Withdrawals List */}
          {withdrawals.length > 0 && (
            <div className="space-y-4">
              {withdrawals.map((w) => (
                <div key={w.id} className="bg-[#0a2d55] rounded-xl p-5 shadow-lg space-y-2 border-l-4 border-yellow-500">
                  <h3 className="text-lg font-bold">Withdrawal ({w.method === 'upi' ? 'UPI' : 'Bank'})</h3>
                  <p className="text-sm text-gray-400">{w.createdAt?.toDate().toLocaleString()}</p>
                  <p className="text-sm font-medium">{w.method === 'upi' ? w.upiId : `${w.accountNumber} (${w.bankName})`}</p>
                  <p className="text-xs text-blue-400">Credits within 10-24 hours</p>
                  <div className="flex justify-between items-center pt-2">
                    <p className="text-xl font-bold text-red-400">-₹{w.amount.toFixed(2)}</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      w.status === 'approved' ? 'bg-green-100 text-green-800' : 
                      w.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {w.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Withdrawal Form */}
          <div className="bg-[#0a2d55] rounded-xl p-6 shadow-lg space-y-6">
            <div className="text-center mb-4">
              <h2 className="text-xl font-semibold text-yellow-500 mb-2">Make Another Withdrawal</h2>
              <p className="text-lg text-gray-300">Your Winning Money:</p>
              <p className="text-4xl font-bold text-yellow-500 flex items-center justify-center">
                <IndianRupee className="w-8 h-8 mr-2" />
                {winningMoney.toFixed(2)}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">Amount to Withdraw</label>
                  <input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="w-full bg-[#042346] border border-gray-600 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                  />
              </div>

              <div className="flex justify-center gap-4">
                  <button type="button" onClick={() => setMethod('upi')} className={`px-6 py-2 rounded-full font-semibold transition-colors ${method === 'upi' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white hover:bg-gray-600'}`}>UPI</button>
                  <button type="button" onClick={() => setMethod('bank')} className={`px-6 py-2 rounded-full font-semibold transition-colors ${method === 'bank' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white hover:bg-gray-600'}`}>Bank Transfer</button>
              </div>

              {method === 'upi' && (
                  <input
                    type="text"
                    placeholder="Enter your UPI ID (e.g., user@upi)"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    required={method === 'upi'}
                    className="w-full bg-[#042346] border border-gray-600 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                  />
              )}

              {method === 'bank' && (
                  <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Bank Account Number"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        required={method === 'bank'}
                        className="w-full bg-[#042346] border border-gray-600 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                      />
                      <input
                        type="text"
                        placeholder="IFSC Code"
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value)}
                        required={method === 'bank'}
                        className="w-full bg-[#042346] border border-gray-600 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                      />
                      <input
                        type="text"
                        placeholder="Bank Name"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        required={method === 'bank'}
                        className="w-full bg-[#042346] border border-gray-600 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                      />
                  </div>
              )}

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full bg-yellow-500 text-black font-bold py-3 rounded-full hover:bg-yellow-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submitLoading ? 'Submitting...' : 'Submit Withdrawal Request'}
              </button>
            </form>
          </div>
        </div>
      )}
      <SocialButtons/>
    </div>
  );
};

export default Withdraw;