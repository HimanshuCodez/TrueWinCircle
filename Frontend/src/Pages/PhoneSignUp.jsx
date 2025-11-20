import React, { useState, useEffect } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { auth, db } from "../firebase";

const PhoneSignUp = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [referralCodeInput, setReferralCodeInput] = useState("");
  const [generatedReferralCode, setGeneratedReferralCode] = useState("");
  const [step, setStep] = useState(1);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Create reCAPTCHA only once
  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth, // first arg → auth (modular v9)
        "recaptcha-container", // div id
        {
          size: "invisible",
          callback: () => console.log("reCAPTCHA solved"),
          "expired-callback": () => console.warn("reCAPTCHA expired"),
        }
      );
    }
  }, []);

  const generateReferralCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) { // Generate a 6-character code
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const sendOtp = async () => {
    if (!name) return toast.error("Enter your name");
    if (!email) return toast.error("Enter your email");
    if (!phone) return toast.error("Enter phone number");
    setLoading(true);
    try {
      const newReferralCode = generateReferralCode();
      setGeneratedReferralCode(newReferralCode); // Store the generated code

      const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;
      const result = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        window.recaptchaVerifier
      );
      setConfirmationResult(result);
      setStep(2);
      toast.success("OTP Sent Successfully!");
    } catch (err) {
      console.error("OTP send error:", err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp) return toast.error("Enter OTP");
    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      console.log("User signed in:", user);

      // Create user document in Firestore if it doesn't exist
      const userDocRef = doc(db, "users", user.uid);

      let referrerId = null;
      let bonusAmount = 0;
      if (referralCodeInput) {
        const referrerQuery = query(collection(db, "users"), where("referralCode", "==", referralCodeInput));
        const referrerSnapshot = await getDocs(referrerQuery);

        if (!referrerSnapshot.empty) {
          const referrerDoc = referrerSnapshot.docs[0];
          referrerId = referrerDoc.id;
          bonusAmount = 50;
          toast.success(`Referral code applied! You received ₹${bonusAmount} bonus.`);
        } else {
          toast.warn("Invalid referral code. No bonus applied.");
        }
      }

      await setDoc(userDocRef, {
        phoneNumber: user.phoneNumber,
        name: name,
        email: email,
        role: 'user', // Explicitly set role for new users
        referralCode: generatedReferralCode,
        referredBy: referrerId,
        balance: bonusAmount,
        winningMoney: 0,
        createdAt: new Date(),
      }, { merge: true });

      if (bonusAmount > 0) {
        await addDoc(collection(db, "transactions"), {
          userId: user.uid,
          type: "referral_bonus",
          amount: bonusAmount,
          description: `Referral bonus from ${referralCodeInput}`,
          createdAt: new Date(),
        });
      }

      toast.success("Sign in successful!");
      navigate("/");
    } catch (err) {
      console.error("OTP verify error:", err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#042346] text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto bg-[#0a2d55] p-6 md:p-8 rounded-xl shadow-lg">
        <div className="text-center mb-6">
          <h1 className="font-bold text-3xl mb-2">
            TrueWin<span className="text-yellow-500">Circle</span>
          </h1>
          <p className="text-gray-300">
            {step === 1 ? "Enter your phone number to continue" : "Enter the OTP sent to your phone"}
          </p>
        </div>

        {step === 1 ? (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-[#042346] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <input
              type="email"
              placeholder="Enter Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#042346] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <input
              type="tel"
              placeholder="Enter Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 bg-[#042346] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <input
              type="text"
              placeholder="Referral Code (Optional)"
              value={referralCodeInput}
              onChange={(e) => setReferralCodeInput(e.target.value)}
              className="w-full px-4 py-3 bg-[#042346] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <button
              onClick={sendOtp}
              disabled={loading}
              className="w-full bg-yellow-500 text-black font-bold px-5 py-3 rounded-full hover:bg-yellow-600 transition-colors duration-300 disabled:bg-gray-400"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-4 py-3 bg-[#042346] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <button
              onClick={verifyOtp}
              className="w-full bg-yellow-500 text-black font-bold px-5 py-3 rounded-full hover:bg-yellow-600 transition-colors duration-300"
            >
              Verify OTP
            </button>
          </div>
        )}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
};

export default PhoneSignUp;
