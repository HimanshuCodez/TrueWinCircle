import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from './firebase';

import SpinWheel from './Pages/SpinWheel';
import FixNumber from './Pages/FixNumber';
import WinGame from './Pages/WinGame';
import PhoneSignUp from './Pages/PhoneSignUp';
import Navbar from './components/Navbar';
import Home from './Pages/Home';
import useAuthStore from './store/authStore';
import { AddCash } from './Pages/AddCash';
import Pay from './Pages/Pay';
import { MyWallet } from './Pages/Wallet';
import PaymentConfirmation from './Pages/PaymentConfirmation';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Withdraw from './Pages/Withdraw';
import AdminDashboard from './Admin/Admin';

import AdminRoute from './Admin/AdminRoute';
import Spinner from './components/Loader';
import ReferralScreen from './components/Refer';
import Profile from './Pages/Profile';
import Support from './Pages/Support';
import ProfileCard from './Pages/Profile';
import History from './Pages/History';
import PrivacyPolicy from './components/PrivacyPolicy';

const AppContent = () => {
  const location = useLocation();
  // The Navbar will not be shown on the /Admin route
  const showNavbar = location.pathname.toLowerCase() !== '/admin';

  return (
    <>
      {showNavbar && <Navbar />}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    
    
        <Routes>
          <Route path="/" element={<Home />} />
        <Route path="/spinwheel" element={<SpinWheel />} />
        <Route path="/fixnumber" element={<FixNumber />} />
        <Route path="/wingame" element={<WinGame />} />
        <Route path="/testphonesignup" element={<PhoneSignUp />} />
        <Route path="/addcash" element={<AddCash />} />
        <Route path="/Profile" element={<Profile />} />
        <Route path="/pay" element={<Pay />} />
        <Route path="/Withdraw" element={<Withdraw />} />
        <Route path="/payconfirm" element={<PaymentConfirmation />} />
        <Route path="/Wallet" element={<MyWallet />} />
        <Route path="/Support" element={<Support />} />
        <Route path="/History" element={<History />} />
        <Route path="/Privacy" element={< PrivacyPolicy/>} />
        <Route path="/Profile" element={<ProfileCard />} />
        <Route path="/Reffer" element={<ReferralScreen />} />
        <Route path="/Admin" element={<AdminDashboard />} />
        {/* <AdminRoute></AdminRoute> */}
      </Routes>
    
    </>
  );
}

const App = () => {
  const { setUser } = useAuthStore();
  const auth = getAuth();
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (userAuth) => {
      if (userAuth) {
        const userRef = doc(db, "users", userAuth.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUser({ ...userAuth, ...userSnap.data() });
        } else {
          setUser(userAuth);
        }
      } else {
        setUser(null);
      }
      setLoadingAuth(false); // Auth state determined
    });

    return () => unsubscribe();
  }, [auth, setUser]);

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#042346] text-white flex items-center justify-center">
        <Spinner/>
      </div>
    );
  }

  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;