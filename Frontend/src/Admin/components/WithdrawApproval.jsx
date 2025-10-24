import React from 'react';
import { Check, X } from 'lucide-react';

const WithdrawApproval = ({ withdrawals, userDetails, handleWithdrawalApproval }) => {
  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Withdrawal Approvals</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium">User</th>
                <th className="text-left p-4 font-medium">Amount</th>
                <th className="text-left p-4 font-medium">Method</th>
                <th className="text-left p-4 font-medium">Status</th>
               
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map(withdrawal => (
                <tr key={withdrawal.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">{userDetails[withdrawal.userId]?.name || 'Unknown User'}</td>
                  <td className="p-4 font-medium">₹{withdrawal.amount}</td>
                  <td className="p-4">{withdrawal.method}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      withdrawal.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : withdrawal.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {withdrawal.status}
                    </span>
                  </td>
                 
                  <td className="p-4">
                    {withdrawal.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleWithdrawalApproval(withdrawal.id, 'approved', withdrawal.userId, withdrawal.amount)}
                          className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleWithdrawalApproval(withdrawal.id, 'rejected', withdrawal.userId, withdrawal.amount)}
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

export default WithdrawApproval;