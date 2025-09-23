import React, { useEffect, useState } from 'react';
import { 
  Users, 
  CreditCard, 
  Trophy, 
  DollarSign, 
  QrCode, 
  Check, 
  X, 
  Eye,
  Edit,
  Plus,
  Search,
  Bell,
  Settings,
  LogOut,
  Menu
} from 'lucide-react';
import { db } from '../firebase';
import { collection, query, onSnapshot, doc, runTransaction, getDocs, where, deleteDoc } from 'firebase/firestore';
import useAuthStore from '../store/authStore';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BarCodeUpdate from './components/BarCodeUpdate';
import PaymentApproval from './components/PaymentApproval';
import WinnerApprove from './components/WinnerApprove';
import WithdrawApproval from './components/WithdrawApproval';
import DashboardView from './components/DashboardView';
import MarqueeUpdate from './components/MarqueeUpdate';

// Import Child Components


const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  // State managed by AdminDashboard and passed to children
  const [payments, setPayments] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [winners, setWinners] = useState([ // Sample data
    { id: 1, user: 'Alice Brown', prize: 'iPhone 15', status: 'announced', date: '2024-01-15' },
    { id: 2, user: 'Bob Wilson', prize: 'Cash Prize ₹10000', status: 'pending', date: '2024-01-16' },
    { id: 3, user: 'Carol Davis', prize: 'Laptop', status: 'announced', date: '2024-01-17' }
  ]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userDetails, setUserDetails] = useState({});

  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  // --- DATA FETCHING ---
  useEffect(() => {
    if (!isAdmin) return;

    // Fetch Payments
    const paymentsQuery = query(collection(db, 'top-ups'));
    const unsubscribePayments = onSnapshot(paymentsQuery, (snapshot) => {
      const fetchedPayments = snapshot.docs.map(d => ({ id: d.id, ...d.data(), date: d.data().createdAt ? new Date(d.data().createdAt).toLocaleDateString() : 'N/A', user: d.data().userId }));
      setPayments(fetchedPayments);
      // Fetch user details for new users
      const userIds = [...new Set(fetchedPayments.map(p => p.userId))];
      fetchMissingUserDetails(userIds);
    });

    // Fetch Withdrawals
    const withdrawalsQuery = query(collection(db, 'withdrawals'));
    const unsubscribeWithdrawals = onSnapshot(withdrawalsQuery, (snapshot) => {
      const fetchedWithdrawals = snapshot.docs.map(d => ({ id: d.id, ...d.data(), date: d.data().createdAt ? new Date(d.data().createdAt).toLocaleDateString() : 'N/A', user: d.data().userId }));
      setWithdrawals(fetchedWithdrawals);
      // Fetch user details for new users
      const userIds = [...new Set(fetchedWithdrawals.map(w => w.userId))];
      fetchMissingUserDetails(userIds);
    });

    // Fetch Total Users
    const usersQuery = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      setTotalUsers(snapshot.size);
    });

    return () => {
      unsubscribePayments();
      unsubscribeWithdrawals();
      unsubscribeUsers();
    };
  }, [isAdmin]);

  const fetchMissingUserDetails = (userIds) => {
    userIds.forEach(async (userId) => {
      if (!userDetails[userId]) {
        const userQuery = query(collection(db, 'users'), where('uid', '==', userId));
        const userSnap = await getDocs(userQuery);
        if (!userSnap.empty) {
          setUserDetails(prev => ({ ...prev, [userId]: userSnap.docs[0].data() }));
        }
      }
    });
  };

  // --- ACTION HANDLERS ---
  const handlePaymentApproval = async (paymentId, action, userId, amount, reason = null) => {
    try {
      await runTransaction(db, async (transaction) => {
        const paymentRef = doc(db, 'top-ups', paymentId);
        const userRef = doc(db, 'users', userId);

        let userSnap;
        if (action === 'approved') {
          userSnap = await transaction.get(userRef);
        }

        const paymentUpdateData = { status: action };
        if (action === 'rejected' && reason) {
          paymentUpdateData.adminComment = reason;
        }
        transaction.update(paymentRef, paymentUpdateData);

        if (action === 'approved') {
          if (userSnap.exists()) {
            const currentBalance = userSnap.data().walletBalance || 0;
            transaction.update(userRef, { walletBalance: currentBalance + amount });
          } else {
            transaction.set(userRef, { walletBalance: amount, winningMoney: 0, createdAt: new Date() });
          }
        }
      });
      toast.success(`Payment ${action} successfully!`);
    } catch (error) {
      console.error(`Error ${action} payment:`, error);
      toast.error(`Failed to ${action} payment.`);
    }
  };

  const handleWithdrawalApproval = async (withdrawalId, action, userId, amount) => {
    try {
      await runTransaction(db, async (transaction) => {
        const withdrawalRef = doc(db, 'withdrawals', withdrawalId);
        transaction.update(withdrawalRef, { status: action });

        if (action === 'rejected') {
          const userRef = doc(db, 'users', userId);
          const userSnap = await transaction.get(userRef);
          if (userSnap.exists()) {
            const currentWinningMoney = userSnap.data().winningMoney || 0;
            transaction.update(userRef, { winningMoney: currentWinningMoney + amount });
          }
        }
      });
      toast.success(`Withdrawal ${action} successfully!`);
    } catch (error) {
      console.error(`Error ${action} withdrawal:`, error);
      toast.error(`Failed to ${action} withdrawal.`);
    }
  };
  
  const handleDeletePayment = async (paymentId) => {
    try {
      await deleteDoc(doc(db, 'top-ups', paymentId));
      toast.success('Payment record deleted successfully!');
    } catch (error) {
      console.error('Error deleting payment record:', error);
      toast.error('Failed to delete payment record.');
    }
  };

  const handleWinnerAnnouncement = (id) => {
    setWinners(winners.map(winner => 
      winner.id === id ? { ...winner, status: 'announced' } : winner
    ));
  };

  // --- CHILD COMPONENTS ---
  const Sidebar = () => (
    <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 text-white p-4 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:w-64`}>
      <div className="mb-8 flex justify-center items-center">
        <div>
          <h1 className="text-2xl font-bold text-center">True Win Circle</h1>
          <p className="text-gray-400 text-center text-sm">Admin Dashboard</p>
        </div>
      </div>
      <nav className="space-y-2">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Settings },
          { id: 'barcodes', label: 'Barcode Management', icon: QrCode },
          { id: 'payments', label: 'Payment Approval', icon: CreditCard },
          { id: 'winners', label: 'Winner Announcement', icon: Trophy },
          { id: 'withdrawals', label: 'Withdrawal Approval', icon: DollarSign },
          { id: 'marquee', label: 'Screen Text', icon: Edit }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${activeTab === item.id ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="absolute bottom-4 left-4 right-4">
        <button className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-800 text-red-400">
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  const Header = () => (
    <div className="bg-white shadow-sm border-b p-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="md:hidden p-2">
            {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        <h2 className="text-2xl font-semibold capitalize">{activeTab}</h2>
      </div>
      
    </div>
  );

  const renderContent = () => {
    const stats = {
        totalUsers: totalUsers,
        pendingPayments: payments.filter(p => p.status === 'pending').length,
        winnersAnnounced: winners.filter(w => w.status === 'announced').length,
        pendingWithdrawals: withdrawals.filter(w => w.status === 'pending').length
    };

    switch (activeTab) {
      case 'dashboard': 
        return <DashboardView stats={stats} />;
      case 'barcodes': 
        return <BarCodeUpdate />;
      case 'payments': 
        return <PaymentApproval 
                  payments={payments} 
                  userDetails={userDetails} 
                  handlePaymentApproval={handlePaymentApproval} 
                  handleDeletePayment={handleDeletePayment} 
                />;
      case 'winners': 
        return <WinnerApprove 
                  winners={winners}
                  handleWinnerAnnouncement={handleWinnerAnnouncement}
                />;
      case 'withdrawals': 
        return <WithdrawApproval 
                  withdrawals={withdrawals}
                  userDetails={userDetails}
                  handleWithdrawalApproval={handleWithdrawalApproval}
                />;
      case 'marquee':
        return <MarqueeUpdate />;
      default: 
        return <DashboardView stats={stats} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <ToastContainer />
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
