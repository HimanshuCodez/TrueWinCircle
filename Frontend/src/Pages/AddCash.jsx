import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'react-toastify';

export function AddCash() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState(''); // New state for message

  const handleNext = () => {
    const parsedAmount = parseInt(amount);
    if (!parsedAmount || parsedAmount < 50 || parsedAmount > 1000000) {
      toast.error('Please enter an amount between ₹50 and ₹1,000,000');
      return;
    }
    if (!message.trim()) {
      toast.error('Please provide a message for the payment.');
      return;
    }
    window.localStorage.setItem('Amount', parsedAmount);
    window.localStorage.setItem('PaymentMessage', message); // Save message
    navigate('/Pay');
  };

  const quickAmounts = ['50', '500', '1000', '5000', '10000', '25000'];

  return (
    <div className="font-roboto bg-gray-900 text-white min-h-screen flex flex-col">
     
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-yellow-400">Add Cash to Wallet</h1>
            <p className="text-gray-400">Select an amount or enter your own.</p>
          </div>

          <div className="bg-blue-900/50 border border-blue-700 text-blue-200 text-xs rounded-lg p-3">
            <strong>Note:</strong> Please use the correct UPI & Account number shown on the payment page. Deposits to incorrect accounts will not be processed.
          </div>

          <div>
            <label htmlFor="amount-input" className="block text-sm font-medium text-gray-400 mb-2">
              Enter Amount
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 text-lg">₹</span>
              <input
                id="amount-input"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white text-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition"
                placeholder="50 - 1,000,000"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {quickAmounts.map((val) => (
              <button
                key={val}
                onClick={() => setAmount(val)}
                className="bg-gray-700 hover:bg-yellow-500 hover:text-gray-900 rounded-lg py-3 font-bold transition-colors duration-200"
              >
                ₹{val}
              </button>
            ))}
          </div>

          <div>
            <label htmlFor="message-input" className="block text-sm font-medium text-gray-400 mb-2">
              Message (Required)
            </label>
            <textarea
              id="message-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition"
              placeholder="e.g., Transaction ID, or payment details"
              rows="3"
              required
            />
          </div>

          <button
            onClick={handleNext}
            className="w-full bg-yellow-500 text-gray-900 font-bold py-3 rounded-lg hover:bg-yellow-600 transition-colors text-lg shadow-lg shadow-yellow-500/20"
          >
            Next
          </button>
        </div>
      </main>

    </div>
  );
}