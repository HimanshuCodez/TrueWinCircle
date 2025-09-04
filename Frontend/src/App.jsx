import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Login from './Pages/Login';

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

const App = () => {
  const setUser = useAuthStore((state) => state.setUser);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, [auth, setUser]);

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/login" element={<Login />} />
      
        <Route path="/spinwheel" element={<SpinWheel />} />
        <Route path="/fixnumber" element={<FixNumber />} />
        <Route path="/wingame" element={<WinGame />} />
        <Route path="/phonesignup" element={<PhoneSignUp />} />
        <Route path="/AddCash" element={<AddCash />} />
        <Route path="/Pay" element={<Pay />} />
        <Route path="/PayConfirm" element={<PaymentConfirmation />} />
        <Route path="/Wallet" element={<MyWallet />} />
      </Routes>
    </Router>
  );
};

export default App;
