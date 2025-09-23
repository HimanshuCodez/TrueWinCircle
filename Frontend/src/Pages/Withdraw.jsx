// src/components/Withdraw.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { doc, getDoc, runTransaction, collection, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";
import { ArrowLeft, IndianRupee } from "lucide-react";

const Withdraw = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [method, setMethod] = useState('upi'); // 'upi' or 'bank'

  const [loading, setLoading] = useState(true); // Initial loading for fetching balance
  const [submitLoading, setSubmitLoading] = useState(false); // For withdrawal submission
  const [error, setError] = useState('');
  const [winningMoney, setWinningMoney] = useState(0); // Renamed from userBalance
  const [onCooldown, setOnCooldown] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [withdrawalSubmitted, setWithdrawalSubmitted] = useState(false); // New state
  const [lastWithdrawal, setLastWithdrawal] = useState(null); // New state for last withdrawal details

  const COOLDOWN_DURATION = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

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
      } else {
        setLoading(false);
        toast.error("Please log in to withdraw.");
        setError("Please log in to withdraw.");
      }
    };
    fetchWinningMoney();
  }, [user]);

  useEffect(() => {
    const lastWithdrawalTimestamp = localStorage.getItem('withdrawalTimestamp');
    if (lastWithdrawalTimestamp) {
      const timeElapsed = new Date().getTime() - parseInt(lastWithdrawalTimestamp);
      if (timeElapsed < COOLDOWN_DURATION) {
        setOnCooldown(true);
        setCooldownRemaining(COOLDOWN_DURATION - timeElapsed);
      } else {
        localStorage.removeItem('withdrawalTimestamp');
        setOnCooldown(false);
      }
    }

    const timer = setInterval(() => {
      if (onCooldown && cooldownRemaining > 0) {
        setCooldownRemaining(prev => prev - 1000);
      } else if (onCooldown && cooldownRemaining <= 0) {
        setOnCooldown(false);
        localStorage.removeItem('withdrawalTimestamp');
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [onCooldown, cooldownRemaining]);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

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
    if (withdrawalAmount < 100) { // Changed from 200 to 100
        toast.error('Minimum withdrawal amount is ₹100.');
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

        if (currentWinningMoney < withdrawalAmount) {
          throw new Error("Insufficient winning money for withdrawal.");
        }

        // Deduct winning money
        transaction.update(userRef, { winningMoney: currentWinningMoney - withdrawalAmount });

        // Record withdrawal request
        const withdrawalsCollectionRef = collection(db, 'withdrawals');
        transaction.set(doc(withdrawalsCollectionRef), {
          userId: user.uid,
          amount: withdrawalAmount,
          method,
          upiId: method === 'upi' ? upiId : '',
          accountNumber: method === 'bank' ? accountNumber : '',
          ifscCode: method === 'bank' ? ifscCode : '',
          bankName: method === 'bank' ? bankName : '',
          status: 'pending', // pending, approved, rejected
          createdAt: new Date(),
        });
      });
      
      localStorage.setItem('withdrawalTimestamp', new Date().getTime().toString());
      setOnCooldown(true);
      setCooldownRemaining(COOLDOWN_DURATION);
      toast.success('Withdrawal request submitted successfully!');
      setWithdrawalSubmitted(true); // Set submitted state
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
      ) : onCooldown ? (
        <div className="bg-[#0a2d55] rounded-xl p-6 shadow-lg text-center space-y-4">
          <h2 className="text-xl font-semibold text-yellow-500">Withdrawal Request Submitted!</h2>
          <p className="text-lg">Status: <span className="font-semibold text-yellow-400">Pending</span></p>
          
          <div className="text-sm text-gray-200 space-y-2 my-4 p-4 bg-[#042346] rounded-lg border border-gray-700">
            <p>Your payment will be credited to your account within 10 to 24 hours.</p>
            <p>आपका भुगतान 10 से 24 घंटों के अंदर आपके खाते में पहुँचा दिया जाएगा।</p>
          </div>

          <p className="text-lg">Your next withdrawal will be available in:</p>
          <div className="text-4xl font-bold text-white">
            {formatTime(cooldownRemaining)}
          </div>
          <p className="text-sm text-gray-400">Please wait for the cooldown period to end.</p>
        </div>
      ) : (
        <div className="bg-[#0a2d55] rounded-xl p-6 shadow-lg space-y-6">
          <div className="text-center mb-4">
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
              disabled={submitLoading || onCooldown}
              className="w-full bg-yellow-500 text-black font-bold py-3 rounded-full hover:bg-yellow-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitLoading ? 'Submitting...' : 'Submit Withdrawal Request'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Withdraw;