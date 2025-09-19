import React from 'react';
import { Trophy } from 'lucide-react';

const WinnerApprove = ({ winners, handleWinnerAnnouncement }) => {
  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Winner Announcements</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium">Winner</th>
                <th className="text-left p-4 font-medium">Prize</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Date</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {winners.map(winner => (
                <tr key={winner.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">{winner.user}</td>
                  <td className="p-4">{winner.prize}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      winner.status === 'announced' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {winner.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">{winner.date}</td>
                  <td className="p-4">
                    {winner.status === 'pending' && (
                      <button 
                        onClick={() => handleWinnerAnnouncement(winner.id)}
                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        <Trophy className="h-4 w-4" />
                      </button>
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

export default WinnerApprove;
