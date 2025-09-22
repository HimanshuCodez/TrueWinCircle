import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { app } from '../firebase';
import { ref, getDownloadURL, getStorage } from 'firebase/storage';

const Pay = () => {
  const storage = getStorage(app);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const navigate = useNavigate();
  const amount = window.localStorage.getItem('Amount');
  const isExpired = timeLeft === 0;

  useEffect(() => {
    const fetchQrCode = async () => {
      try {
        const qrCodeRef = ref(storage, 'barcodes/qr.jpg');
        const url = await getDownloadURL(qrCodeRef);
        setQrCodeUrl(url);
      } catch (error) {
        console.error("Error fetching QR code:", error);
        // Handle error, e.g., show a placeholder or an error message
      }
    };

    fetchQrCode();
  }, []);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 font-roboto">
      <div className="w-full max-w-sm text-center">
        {isExpired ? (
          <div className="bg-gray-800 rounded-2xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-red-500 mb-4">QR Code Expired</h2>
            <p className="text-gray-400">Please go back and generate a new QR code.</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-6 w-full bg-yellow-500 text-gray-900 font-bold py-3 px-4 rounded-lg hover:bg-yellow-600 transition-colors"
            >
              Go Back
            </button>
          </div>
        ) : (
          <>
            <div className="bg-gray-800 rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-yellow-400 mb-2">Scan & Pay</h2>
              <p className="text-5xl font-bold mb-4">₹{amount}</p>
              <div className="bg-white p-4 rounded-lg inline-block">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="QR Code to pay" className="w-48 h-48" />
                ) : (
                  <div className="w-48 h-48 bg-gray-300 flex items-center justify-center">
                    <p className="text-gray-500">Loading QR...</p>
                  </div>
                )}
              </div>
              <p className="mt-4 text-gray-400">Scan using any UPI app</p>
              <div className="mt-4 text-5xl font-mono font-bold text-red-500" aria-live="polite">
                {formatTime(timeLeft)}
              </div>
              <p className="mt-1 text-sm text-gray-500">Code expires soon</p>
            </div>
            <div className="w-full mt-6">
              <button
                onClick={() => navigate('/PayConfirm')}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-4 rounded-lg transition-colors text-lg"
              >
                I Have Paid
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Pay;
