import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import useAuthStore from '../store/authStore';
import Loader from '../components/Loader';
import { ArrowLeft, UserPlus, Wallet, ArrowRight, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';


export default function Referrals() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [referredUsers, setReferredUsers] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReferredUsers = async () => {
      if (!user?.uid) {
        setError("You must be logged in to view your referrals.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Query for users who have this user's UID as their 'referredBy' field
        const q = query(collection(db, 'users'), where('referredBy', '==', user.uid));
        const querySnapshot = await getDocs(q);

        let fetchedReferredUsers = [];
        let currentTotalEarnings = 0;

        for (const docSnapshot of querySnapshot.docs) {
          const referredUser = docSnapshot.data();
          const earningAmount = referredUser.referralBonusAwarded ? 50 : 0; // Assuming 50 for awarded bonus
          fetchedReferredUsers.push({
            id: docSnapshot.id,
            name: referredUser.name || 'Unknown User',
            email: referredUser.email || 'N/A',
            phoneNumber: referredUser.phoneNumber || 'N/A',
            bonusAwarded: referredUser.referralBonusAwarded || false,
            earned: earningAmount,
            createdAt: referredUser.createdAt?.toDate ? referredUser.createdAt.toDate() : new Date(),
          });
          currentTotalEarnings += earningAmount;
        }

        fetchedReferredUsers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setReferredUsers(fetchedReferredUsers);
        setTotalEarnings(currentTotalEarnings);

      } catch (err) {
        console.error("Error fetching referred users:", err);
        toast.error("Failed to load referred users.");
        setError("Failed to load referred users.");
      } finally {
        setLoading(false);
      }
    };

    fetchReferredUsers();
  }, [user?.uid]);

  if (loading) {
    return <div className="min-h-screen bg-gray-900 flex justify-center items-center"><Loader /></div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        <p className="text-red-400">{error}</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-yellow-500 hover:underline">Go Back</button>
      </div>
    );
  }

  return (
    <div className="font-roboto bg-gray-900 text-white min-h-screen p-4 pt-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-yellow-500" />
          </button>
          <h1 className="text-2xl font-bold text-yellow-500">My Referrals</h1>
        </div>

        {/* Referral Summary */}
        <div className="rounded-2xl p-6 bg-gray-800 border border-gray-700 shadow-lg mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-3">
            <UserPlus className="w-5 h-5 text-yellow-500" /> Referral Summary
          </h2>
          <p className="text-gray-300 text-sm">Track users you've referred and your earnings from them.</p>
        </div>

        {/* Total Earnings */}
        <div className="rounded-2xl p-5 bg-gray-800 border border-gray-700 shadow-lg flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Wallet className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-sm text-gray-300">Total Referral Earnings</p>
              <h3 className="text-2xl font-semibold text-green-400">₹{totalEarnings.toFixed(2)}</h3>
            </div>
          </div>
        </div>

        {/* Referred Users List */}
        <div className="rounded-2xl p-6 bg-gray-800 border border-gray-700 shadow-lg">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Users className="w-5 h-5" /> Referred Users ({referredUsers.length})
          </h3>

          {referredUsers.length === 0 ? (
            <p className="text-gray-400 text-center text-sm py-4">You haven't referred anyone yet.</p>
          ) : (
            <div className="space-y-3">
              {referredUsers.map((referredUser) => (
                <div
                  key={referredUser.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-700 border border-gray-600 hover:bg-gray-600 transition"
                >
                  <div className="flex items-center gap-3">
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <div>
                        <p className="text-gray-200 font-medium">{referredUser.name}</p>
                        <p className="text-xs text-gray-400">{referredUser.phoneNumber}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${referredUser.bonusAwarded ? 'text-green-400' : 'text-yellow-400'}`}>
                        {referredUser.bonusAwarded ? `+₹${referredUser.earned.toFixed(2)}` : 'Pending Top-up'}
                    </p>
                    <p className="text-xs text-gray-400">Joined: {referredUser.createdAt.toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
