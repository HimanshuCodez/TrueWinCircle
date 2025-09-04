import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { toast } from 'react-toastify';
import { CheckCircle, Clock, UploadCloud } from 'lucide-react';

const PaymentConfirmation = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadState, setUploadState] = useState('idle'); // idle -> uploading -> waiting -> success
  const navigate = useNavigate();
  const amount = localStorage.getItem('Amount');

  const onFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("File is too large. Maximum size is 5MB.");
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please upload a payment screenshot');
      return;
    }

    const formData = new FormData();
    formData.append('screenshot', file);
    formData.append('amount', amount);

    setIsSubmitting(true);
    setUploadState('uploading');

    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-auth-token': localStorage.getItem('token'),
        },
      };
      // The backend is expected to return a transaction ID to poll for status
      // const { data } = await axios.post('https://fundex.onrender.com/api/payment', formData, config);
      // For now, we will simulate the API call and move to the waiting state.
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulating upload
      
      setUploadState('waiting');

    } catch (err) {
      toast.error('Upload failed. Please try again.');
      console.error(err);
      setUploadState('idle');
    } finally {
      setIsSubmitting(false);
    }
  };

  // This effect simulates waiting for admin confirmation.
  // In a real application, you would poll a backend endpoint here.
  useEffect(() => {
    if (uploadState === 'waiting') {
     
      const timer = setTimeout(() => {
        setUploadState('success');
      }, 10000); // 10-second wait to simulate admin approval

      return () => {
        // clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [uploadState]);

  // Navigate home after success message
  useEffect(() => {
    if (uploadState === 'success') {
      toast.success("Payment approved!");
      const timer = setTimeout(() => {
        navigate('/');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [uploadState, navigate]);


  if (uploadState === 'waiting' || uploadState === 'success') {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4 text-white text-center">
        <div className="w-full max-w-md">
          {uploadState === 'waiting' ? (
            <>
              <Clock className="mx-auto h-16 w-16 text-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />
              <h2 className="mt-6 text-3xl font-extrabold">Waiting for Confirmation</h2>
              <p className="mt-2 text-gray-400">
                Your payment is being verified by our team. This may take a few minutes. Please do not close this page.
              </p>
            </>
          ) : (
            <>
              <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
              <h2 className="mt-6 text-3xl font-extrabold">Payment Approved!</h2>
              <p className="mt-2 text-gray-400">
                ₹{amount} has been added to your wallet. Redirecting you now...
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center p-4 text-white">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-yellow-400">Upload Payment Proof</h2>
          <p className="text-gray-400">Upload a screenshot of your ₹{amount} payment.</p>
        </div>

        <div className="bg-gray-800 p-8 rounded-2xl shadow-lg">
          <form className="space-y-6" onSubmit={onSubmit}>
            <div>
              <label
                htmlFor="screenshot"
                className="block text-sm font-medium text-gray-400 mb-2"
              >
                Screenshot
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  {preview ? (
                     <img src={preview} alt="Screenshot Preview" className="mx-auto h-40 rounded-md" />
                  ) : (
                    <>
                      <UploadCloud className="mx-auto h-12 w-12 text-gray-500" />
                      <p className="text-sm text-gray-400">Drag & drop or click to upload</p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                    </>
                  )}
                  <input
                    id="screenshot"
                    name="screenshot"
                    type="file"
                    required
                    accept="image/png, image/jpeg, image/gif"
                    onChange={onFileChange}
                    className="sr-only"
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-gray-900 bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit for Confirmation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentConfirmation;
