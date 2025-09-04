import React, { useState, useEffect } from 'react';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, getAdditionalUserInfo } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';

const PhoneSignUp = () => {
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const auth = getAuth();
    const navigate = useNavigate();

    useEffect(() => {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': (response) => {
                // reCAPTCHA solved, allow signInWithPhoneNumber.
            },
            'expired-callback': () => {
                // Response expired. Ask user to solve reCAPTcha again.
                // ...
            }
        });
    }, [auth]);

    const sendOtp = async () => {
        setLoading(true);
        setError('');
        try {
            let phoneNumber = phone;
            if (!phoneNumber.startsWith('+')) {
                phoneNumber = '+91' + phoneNumber;
            }
            const appVerifier = window.recaptchaVerifier;
            const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
            setResult(confirmation);
            setStep(2);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async () => {
        setLoading(true);
        setError('');
        try {
            const confirmationResult = await result.confirm(otp);
            const additionalUserInfo = getAdditionalUserInfo(confirmationResult);

            if (additionalUserInfo?.isNewUser) {
                // Send user data to your backend
                try {
                    const response = await fetch('http://localhost:5000/api/registerUser', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            uid: confirmationResult.user.uid,
                            phoneNumber: confirmationResult.user.phoneNumber,
                        }),
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Failed to register user with backend');
                    }

                    console.log('User registered with backend successfully!');
                } catch (backendError) {
                    console.error('Error sending user data to backend:', backendError);
                    setError('Failed to save user data to backend: ' + backendError.message);
                    // Optionally, you might want to revert Firebase signup or show a critical error
                }
            }
            navigate('/');
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center sm:py-12">
            <div className="p-10 xs:p-0 mx-auto md:w-full md:max-w-md">
                <h1 className="font-bold text-center text-2xl mb-5">Phone Verification</h1>
                <div className="bg-white shadow w-full rounded-lg divide-y divide-gray-200">
                    {step === 1 && (
                        <div className="px-5 py-7">
                            <label className="font-semibold text-sm text-gray-600 pb-1 block">Enter Phone Number</label>
                            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full" />
                            <button onClick={sendOtp} disabled={loading} className="transition duration-200 bg-blue-500 hover:bg-blue-600 focus:bg-blue-700 focus:shadow-sm focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 text-white w-full py-2.5 rounded-lg text-sm shadow-sm hover:shadow-md font-semibold text-center inline-block">
                                {loading ? 'Sending...' : 'Send OTP'}
                            </button>
                        </div>
                    )}
                    {step === 2 && (
                        <div className="px-5 py-7">
                            <label className="font-semibold text-sm text-gray-600 pb-1 block">Enter OTP</label>
                            <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} className="border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full" />
                            <button onClick={verifyOtp} disabled={loading} className="transition duration-200 bg-blue-500 hover:bg-blue-600 focus:bg-blue-700 focus:shadow-sm focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 text-white w-full py-2.5 rounded-lg text-sm shadow-sm hover:shadow-md font-semibold text-center inline-block">
                                {loading ? 'Verifying...' : 'Verify OTP'}
                            </button>
                        </div>
                    )}
                    {error && <p className="text-red-500 text-xs p-5">{error}</p>}
                    <div id="recaptcha-container"></div>
                </div>
            </div>
        </div>
    );
};

export default PhoneSignUp;
