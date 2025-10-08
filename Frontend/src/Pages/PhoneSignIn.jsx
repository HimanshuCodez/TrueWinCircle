import React, { useState, useEffect } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { auth } from "../firebase";

const PhoneSignIn = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => console.log("reCAPTCHA solved"),
          "expired-callback": () => console.warn("reCAPTCHA expired"),
        }
      );
    }
  }, []);

  const sendOtp = async () => {
    if (!phone) return toast.error("Enter phone number");
    setLoading(true);
    try {
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
      await confirmationResult.confirm(otp);
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
            {step === 1 ? "Enter your phone number to log in" : "Enter the OTP sent to your phone"}
          </p>
        </div>

        {step === 1 ? (
          <div className="space-y-4">
            <input
              type="tel"
              placeholder="Enter Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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

export default PhoneSignIn;
