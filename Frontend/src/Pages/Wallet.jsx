
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { ArrowLeft, Wallet as WalletIcon, IndianRupee } from "lucide-react";

export function MyWallet() {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;
  const [walletBalance, setWalletBalance] = useState(0); // Renamed from depositChips for clarity
  const [winningMoney, setWinningMoney] = useState(0); // Renamed from winningChips for clarity
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWallet = async () => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setWalletBalance(parseFloat(userSnap.data().balance) || 0); // Assuming 'balance' is the field for wallet balance
            setWinningMoney(parseFloat(userSnap.data().winningMoney) || 0); // Assuming 'winningMoney' is the field for winning money
          } else {
            setError("User data not found.");
          }
        } catch (err) {
          console.error("Error fetching wallet data:", err);
          setError("Failed to load wallet data.");
        } finally {
          setLoading(false);
        }
      }
      else {
        setLoading(false);
        setError("Please log in to view your wallet.");
      }
    };
    fetchWallet();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#042346] text-white flex items-center justify-center">
        <p>Loading Wallet...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#042346] text-white flex items-center justify-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="font-roboto bg-[#042346] text-white">
      {/* Header Section */}
      <div className="max-w-md md:max-w-full mx-auto flex items-center mb-6">
        <button
          onClick={() => navigate("/")}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-yellow-500" />
        </button>
        <h1 className="text-2xl font-bold ml-4">My Wallet</h1>
      </div>

      {/* Wallet Summary */}
      <div className="max-w-md md:max-w-full mx-auto bg-[#0a2d55] rounded-xl p-4 md:p-6 mb-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <WalletIcon className="w-8 h-8 text-yellow-500" />
            <h2 className="text-xl font-semibold">Total Balance</h2>
          </div>
          <p className="text-3xl font-bold text-yellow-500">
            <IndianRupee className="inline-block w-6 h-6 mr-1" />
            {(walletBalance + winningMoney).toFixed(2)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10">
          {/* Wallet Balance */}
          <div className="bg-[#042346] rounded-lg p-4 shadow-md">
            <p className="text-sm text-gray-400">Wallet Balance</p>
            <p className="text-2xl font-bold mt-1">
              <IndianRupee className="inline-block w-5 h-5 mr-1" />
              {walletBalance.toFixed(2)}
            </p>
            <button
              onClick={() => navigate("/AddCash")}
              className="mt-3 w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Add Cash
            </button>
          </div>

          {/* Winning Money */}
          <div className="bg-[#042346] rounded-lg p-4 shadow-md">
            <p className="text-sm text-gray-400">Winning Money</p>
            <p className="text-2xl font-bold mt-1">
              <IndianRupee className="inline-block w-5 h-5 mr-1" />
              {winningMoney.toFixed(2)}
            </p>
            <button
              onClick={() => navigate("/Withdraw")}
              className="mt-3 w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Withdraw
            </button>
          </div>
        </div>
      </div>

      {/* Additional sections can go here */}
    </div>
  );
}