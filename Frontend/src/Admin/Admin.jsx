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
import { collection, query, onSnapshot, doc, runTransaction, getDocs, where } from 'firebase/firestore';
import useAuthStore from '../store/authStore';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [barcodeFile, setBarcodeFile] = useState(null);
  const [barcodeUrl, setBarcodeUrl] = useState('');

  const [payments, setPayments] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const handleBarcodeUpload = async () => {
    if (!barcodeFile) {
      toast.error('Please select a file to upload.');
      return;
    }
    const barcodeRef = ref(storage, 'barcodes/qr.jpg');
    try {
      await uploadBytes(barcodeRef, barcodeFile);
      const url = await getDownloadURL(barcodeRef);
      setBarcodeUrl(url);
      toast.success('Barcode uploaded successfully!');
    } catch (error) {
      console.error("Error uploading barcode:", error);
      toast.error('Failed to upload barcode.');
    }
  };

  useEffect(() => {
    const fetchBarcodeUrl = async () => {
        try {
            const barcodeRef = ref(storage, 'barcodes/qr.jpg');
            const url = await getDownloadURL(barcodeRef);
            setBarcodeUrl(url);
        } catch (error) {
            console.log("QR code not found, admin needs to upload one.")
        }
    };

    fetchBarcodeUrl();
  }, []);

  // Fetch payments (top-ups) from Firestore
  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'top-ups'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPayments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().createdAt ? new Date(doc.data().createdAt).toLocaleDateString() : 'N/A',
        user: doc.data().userId, // Placeholder, will fetch user details later
      }));
      setPayments(fetchedPayments);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  // Fetch withdrawals from Firestore
  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'withdrawals'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedWithdrawals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().createdAt ? new Date(doc.data().createdAt).toLocaleDateString() : 'N/A',
        user: doc.data().userId, // Placeholder, will fetch user details later
      }));
      setWithdrawals(fetchedWithdrawals);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  // Fetch total users count
  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTotalUsers(snapshot.size);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  // Sample data (remove or replace with actual data fetching for barcodes and winners)
  const [barcodes, setBarcodes] = useState([
    { id: 1, code: 'BC001', product: 'Product A', status: 'active', created: '2024-01-15' },
    { id: 2, code: 'BC002', product: 'Product B', status: 'inactive', created: '2024-01-16' },
    { id: 3, code: 'BC003', product: 'Product C', status: 'active', created: '2024-01-17' }
  ]);

  const [winners, setWinners] = useState([
    { id: 1, user: 'Alice Brown', prize: 'iPhone 15', status: 'announced', date: '2024-01-15' },
    { id: 2, user: 'Bob Wilson', prize: 'Cash Prize ₹10000', status: 'pending', date: '2024-01-16' },
    { id: 3, user: 'Carol Davis', prize: 'Laptop', status: 'announced', date: '2024-01-17' }
  ]);

  // Helper to fetch user details (e.g., phone number) for display
  const fetchUserDetails = async (userId) => {
    const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', userId)));
    if (!userDoc.empty) {
      return userDoc.docs[0].data().phoneNumber || 'N/A';
    }
    return 'User Not Found';
  };

  // Action handlers
  const handlePaymentApproval = async (paymentId, action, userId, amount) => {
    try {
      await runTransaction(db, async (transaction) => {
        const paymentRef = doc(db, 'top-ups', paymentId);
        transaction.update(paymentRef, { status: action });

        if (action === 'approved') {
          const userRef = doc(db, 'users', userId);
          const userSnap = await transaction.get(userRef);
          if (userSnap.exists()) {
            const currentBalance = userSnap.data().balance || 0;
            transaction.update(userRef, { balance: currentBalance + amount });
          } else {
            // If user document doesn't exist, create it with the new balance
            transaction.set(userRef, { balance: amount, winningMoney: 0, createdAt: new Date() });
          }
        }
      });
      toast.success(`Payment ${action} successfully!`);
    } catch (error) {
      console.error(`Error ${action} payment:`, error);
      toast.error(`Failed to ${action} payment.`);
    }
  };

  const handleWinnerAnnouncement = (id) => {
    setWinners(winners.map(winner => 
      winner.id === id ? { ...winner, status: 'announced' } : winner
    ));
  };

  const handleWithdrawalApproval = async (withdrawalId, action, userId, amount) => {
    try {
      await runTransaction(db, async (transaction) => {
        const withdrawalRef = doc(db, 'withdrawals', withdrawalId);
        transaction.update(withdrawalRef, { status: action });

        if (action === 'rejected') {
          // If withdrawal is rejected, return money to winningMoney balance
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

  const handleBarcodeUpdate = (id, status) => {
    setBarcodes(barcodes.map(barcode => 
      barcode.id === id ? { ...barcode, status } : barcode
    ));
  };

  const stats = [
    { title: 'Total Users', value: totalUsers.toString(), icon: Users, color: 'bg-blue-500' },
    { title: 'Pending Payments', value: payments.filter(p => p.status === 'pending').length.toString(), icon: CreditCard, color: 'bg-yellow-500' },
    { title: 'Winners Announced', value: winners.filter(w => w.status === 'announced').length.toString(), icon: Trophy, color: 'bg-green-500' },
    { title: 'Pending Withdrawals', value: withdrawals.filter(w => w.status === 'pending').length.toString(), icon: DollarSign, color: 'bg-red-500' }
  ];

  const Sidebar = () => (
    <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 text-white p-4 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:w-64`}>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-center">True Win Circle</h1>
          <p className="text-gray-400 text-center text-sm">Admin Dashboard</p>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2">
            <X className="h-6 w-6" />
        </button>
      </div>
      
      <nav className="space-y-2">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Settings },
          { id: 'barcodes', label: 'Barcode Management', icon: QrCode },
          { id: 'payments', label: 'Payment Approval', icon: CreditCard },
          { id: 'winners', label: 'Winner Announcement', icon: Trophy },
          { id: 'withdrawals', label: 'Withdrawal Approval', icon: DollarSign }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => {
                setActiveTab(item.id);
                setSidebarOpen(false);
            }}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              activeTab === item.id ? 'bg-blue-600' : 'hover:bg-gray-800'
            }`}
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
        <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2">
            <Menu className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-semibold capitalize">{activeTab}</h2>
      </div>
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="p-2 rounded-lg hover:bg-gray-100 relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">3</span>
        </button>
      </div>
    </div>
  );

  const DashboardView = () => (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">New payment received from John Doe</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Winner announced for iPhone 15</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm">Withdrawal request from David Lee</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add New Barcode</span>
            </button>
            <button className="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2">
              <Trophy className="h-4 w-4" />
              <span>Announce Winner</span>
            </button>
            <button className="w-full p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>View Reports</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const BarcodeView = () => (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm p-6 border-b">
        <h3 className="text-lg font-semibold">Barcode Management</h3>
        <div className="mt-4">
            <h4 className="text-md font-semibold">Current QR Code</h4>
            {barcodeUrl ? (
                <img src={barcodeUrl} alt="Current QR Code" className="w-48 h-48 mt-2" />
            ) : (
                <p className="text-gray-500 mt-2">No QR code uploaded yet.</p>
            )}
        </div>
        <div className="mt-4">
            <h4 className="text-md font-semibold">Upload New Barcode</h4>
            <input type="file" onChange={(e) => setBarcodeFile(e.target.files[0])} className="mt-2" />
            <button onClick={handleBarcodeUpload} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 mt-2">
              <Plus className="h-4 w-4" />
              <span>Upload Barcode</span>
            </button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm mt-6">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Barcode History (Sample)</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium">Code</th>
                <th className="text-left p-4 font-medium">Product</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Created</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {barcodes.map(barcode => (
                <tr key={barcode.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-mono">{barcode.code}</td>
                  <td className="p-4">{barcode.product}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      barcode.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {barcode.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">{barcode.created}</td>
                  <td className="p-4">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleBarcodeUpdate(barcode.id, barcode.status === 'active' ? 'inactive' : 'active')}
                        className="p-2 rounded-lg hover:bg-gray-100"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-gray-100">
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const PaymentView = () => (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Payment Approvals</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium">User</th>
                <th className="text-left p-4 font-medium">Amount</th>
                <th className="text-left p-4 font-medium">Method</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Date</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">{payment.user}</td>
                  <td className="p-4 font-medium">₹{payment.amount}</td>
                  <td className="p-4">{payment.method}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      payment.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : payment.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">{payment.date}</td>
                  <td className="p-4">
                    {payment.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handlePaymentApproval(payment.id, 'approved', payment.userId, payment.amount)}
                          className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handlePaymentApproval(payment.id, 'rejected', payment.userId, payment.amount)}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const WinnerView = () => (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Winner Announcements</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium">Winner</th>
                <th className="text-left p-4 font-medium">Prize</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Date</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {winners.map(winner => (
                <tr key={winner.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">{winner.user}</td>
                  <td className="p-4">{winner.prize}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      winner.status === 'announced' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {winner.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">{winner.date}</td>
                  <td className="p-4">
                    {winner.status === 'pending' && (
                      <button 
                        onClick={() => handleWinnerAnnouncement(winner.id)}
                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        <Trophy className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const WithdrawalView = () => (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Withdrawal Approvals</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium">User</th>
                <th className="text-left p-4 font-medium">Amount</th>
                <th className="text-left p-4 font-medium">Method</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Date</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map(withdrawal => (
                <tr key={withdrawal.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">{withdrawal.user}</td>
                  <td className="p-4 font-medium">₹{withdrawal.amount}</td>
                  <td className="p-4">{withdrawal.method}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      withdrawal.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : withdrawal.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {withdrawal.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">{withdrawal.date}</td>
                  <td className="p-4">
                    {withdrawal.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleWithdrawalApproval(withdrawal.id, 'approved', withdrawal.userId, withdrawal.amount)}
                          className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleWithdrawalApproval(withdrawal.id, 'rejected', withdrawal.userId, withdrawal.amount)}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView />;
      case 'barcodes': return <BarcodeView />;
      case 'payments': return <PaymentView />;
      case 'winners': return <WinnerView />;
      case 'withdrawals': return <WithdrawalView />;
      default: return <DashboardView />;
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