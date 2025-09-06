import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from "firebase/auth";

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

const App = () => {
  const setUser = useAuthStore((state) => state.setUser);
  const auth = getAuth();
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoadingAuth(false); // Auth state determined
    });

    return () => unsubscribe();
  }, [auth, setUser]);

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#042346] text-white flex items-center justify-center">
        <p>Loading authentication...</p>
      </div>
    );
  }

  return (
    <Router>
      <Navbar />
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
        <Route path="/pay" element={<Pay />} />
        <Route path="/Withdraw" element={<Withdraw />} />
        <Route path="/payconfirm" element={<PaymentConfirmation />} />
        <Route path="/Wallet" element={<MyWallet />} />
        <Route path="/Admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
};

export default App;
