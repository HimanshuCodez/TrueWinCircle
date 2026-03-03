import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getAuth } from "firebase/auth";
import { collection, query, where, onSnapshot, limit } from "firebase/firestore";
import { db } from "../firebase";
import { Clock, Loader2, ArrowDownCircle, AlertTriangle } from 'lucide-react';

export function AddCash() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [topUps, setTopUps] = useState([]);
  const [user, setUser] = useState(null);

  const auth = getAuth();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        toast.error('Please log in to add cash.');
        navigate('/');
        return;
      }
      setUser(currentUser);
    });

    return () => unsubscribeAuth();
  }, [auth, navigate]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'top-ups'),
      where('userId', '==', user.uid),
      limit(20)
    );

    const unsubscribeSnapshot = onSnapshot(q, (querySnapshot) => {
      const now = new Date();
      const fetchedTopUps = querySnapshot.docs
        .map(doc => ({
          ...doc.data(),
          id: doc.id
        }))
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB - dateA;
        })
        .filter(t => {
          let createdAtDate = null;
          if (t.createdAt?.toDate) {
            createdAtDate = t.createdAt.toDate();
          } else if (t.createdAt instanceof Date) {
            createdAtDate = t.createdAt;
          } else if (typeof t.createdAt === 'string') {
            createdAtDate = new Date(t.createdAt);
          }

          if (!createdAtDate) return t.status === 'pending';

          const diffInHours = (now - createdAtDate) / (1000 * 60 * 60);
          return t.status === 'pending' || diffInHours < 24;
        })
        .slice(0, 5);

      setTopUps(fetchedTopUps);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching top-ups:", error);
      setIsLoading(false);
    });

    return () => unsubscribeSnapshot();
  }, [user, navigate]);

  const handleNext = () => {
    const parsedAmount = parseInt(amount);
    if (!parsedAmount || parsedAmount < 50 || parsedAmount > 1000000) {
      toast.error('Please enter an amount between ₹50 and ₹1,000,000');
      return;
    }
    if (!message.trim()) {
      toast.error('Please provide a message for the payment.');
      return;
    }
    window.localStorage.setItem('Amount', parsedAmount);
    window.localStorage.setItem('PaymentMessage', message);
    navigate('/Pay');
  };

  const quickAmounts = ['50', '500', '1000', '5000', '10000', '25000'];

  if (isLoading) {
    return (
      <div className="font-roboto bg-gray-900 text-white min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-10 h-10 text-yellow-400" />
        <p className="ml-3 text-lg">Loading status...</p>
      </div>
    );
  }

  return (
    <div className="font-roboto bg-gray-900 text-white min-h-screen flex flex-col p-4 lg:p-8">
      <main className="max-w-6xl mx-auto w-full pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Add Cash Form - Occupies more space on PC */}
          <div className="lg:col-span-7 xl:col-span-8 order-1">
            <div className="bg-gray-800 rounded-2xl shadow-xl p-6 lg:p-10 space-y-6 border border-gray-700">
              <div className="text-center lg:text-left">
                <h1 className="text-2xl lg:text-3xl font-bold text-yellow-400">Add Cash to Wallet</h1>
                <p className="text-gray-400 text-sm mt-1">Select an amount or enter your own.</p>
              </div>

              <div className="bg-blue-900/30 border border-blue-800 text-blue-200 text-xs lg:text-sm rounded-lg p-4">
                <strong>Note:</strong> Please use the correct UPI & Account number shown on the payment page. Deposits to incorrect accounts will not be processed.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="amount-input" className="block text-sm font-medium text-gray-400 mb-2">
                    Enter Amount
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 text-lg">₹</span>
                    <input
                      id="amount-input"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white text-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition"
                      placeholder="50 - 1,000,000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-400">Quick Select</label>
                  <div className="grid grid-cols-3 gap-2">
                    {quickAmounts.map((val) => (
                      <button
                        key={val}
                        onClick={() => setAmount(val)}
                        className="bg-gray-700 hover:bg-yellow-500 hover:text-gray-900 rounded-lg py-2 font-bold transition-all text-sm"
                      >
                        ₹{val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="message-input" className="block text-sm font-medium text-gray-400 mb-2">
                  Message (Required)
                </label>
                <textarea
                  id="message-input"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition"
                  placeholder="e.g., Transaction ID, or payment details"
                  rows="4"
                  required
                />
              </div>

              <button
                onClick={handleNext}
                className="w-full bg-yellow-500 text-gray-900 font-bold py-4 rounded-lg hover:bg-yellow-600 transition-all text-lg shadow-lg shadow-yellow-500/20"
              >
                Proceed to Payment
              </button>
            </div>
          </div>

          {/* Status Cards - Sidebar on PC */}
          <div className="lg:col-span-5 xl:col-span-4 order-2 space-y-4">
            {topUps.length > 0 ? (
              <>
                <h2 className="text-yellow-400 font-bold text-lg lg:text-xl px-1">Recent Activity</h2>
                <div className="space-y-3">
                  {topUps.map((item) => {
                    const date = item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
                    const statusColor = item.status === 'approved' ? 'text-green-400' : item.status === 'rejected' ? 'text-red-400' : 'text-yellow-400';
                    
                    return (
                      <div key={item.id} className="bg-gray-800 p-4 rounded-xl flex items-center justify-between shadow-lg border border-gray-700 hover:border-gray-600 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 rounded-full bg-gray-900">
                            <ArrowDownCircle className="text-green-500 w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-100">Deposit</p>
                            <p className="text-[10px] text-gray-400">{date.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-green-500">
                            +₹{parseFloat(item.amount).toFixed(2)}
                          </p>
                          <p className={`text-xs capitalize font-bold ${statusColor}`}>
                            {item.status || 'pending'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="hidden lg:block bg-gray-800/50 border border-dashed border-gray-700 rounded-2xl p-8 text-center text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No recent requests</p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}