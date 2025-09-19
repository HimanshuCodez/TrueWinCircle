import React from 'react';
import { Check, X } from 'lucide-react';

const PaymentApproval = ({ payments, userDetails, handlePaymentApproval }) => {
  return (
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
                <th className="text-left p-4 font-medium">Proof</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Date</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">{userDetails[payment.user]?.phoneNumber || payment.user}</td>
                  <td className="p-4 font-medium">₹{payment.amount}</td>
                  <td className="p-4">
                    <a href={payment.paymentProof} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      View Proof
                    </a>
                  </td>
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
};

export default PaymentApproval;