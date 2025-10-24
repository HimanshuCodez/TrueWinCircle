import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Trophy } from 'lucide-react';
import Loader from '../../components/Loader';

const WinnerApprove = ({ handleWinnerAnnouncement }) => {
  const [winners, setWinners] = useState([]);
  const [userDetails, setUserDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const winnersQuery = query(collection(db, 'winners'), orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(winnersQuery, async (querySnapshot) => {
      const winnersList = [];
      const userIds = new Set();

      querySnapshot.forEach(doc => {
        const winnerData = { id: doc.id, ...doc.data() };
        winnersList.push(winnerData);
        if (winnerData.userId) {
          userIds.add(winnerData.userId);
        }
      });

      setWinners(winnersList);

      // Fetch user details for any new winners
      const newUsers = {};
      const userDetailsKeys = Object.keys(userDetails);
      const userIdsToFetch = [...userIds].filter(id => !userDetailsKeys.includes(id));

      if (userIdsToFetch.length > 0) {
        for (const userId of userIdsToFetch) {
          try {
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              newUsers[userId] = userDoc.data();
            }
          } catch (err) {
            console.error(`Failed to fetch user ${userId}`, err);
          }
        }
        setUserDetails(prev => ({ ...prev, ...newUsers }));
      }
      
      setLoading(false);
    }, (err) => {
      console.error("Error fetching winners:", err);
      setError("Failed to load winner information.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []); // Removed userDetails from dependency array to avoid re-fetching loops

  if (loading) {
    return <div className="flex justify-center items-center p-8"><Loader /></div>;
  }

  if (error) {
    return <p className="text-red-500 p-6">{error}</p>;
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Winner Announcements</h3>
        </div>
        <div className="overflow-x-auto">
          {winners.length === 0 ? (
            <p className="p-6 text-center text-gray-500">No winner yet</p>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-medium">Winner</th>
                  <th className="text-left p-4 font-medium">Game</th>
                  <th className="text-left p-4 font-medium">Prize</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Date</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {winners.map(winner => (
                  <tr key={winner.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-800">
                      {userDetails[winner.userId]?.name || 'Unknown User'}
                    </td>
                    <td className="p-4">{winner.gameName}</td>
                    <td className="p-4 font-semibold">₹{winner.prize?.toFixed(2) || '0.00'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        winner.status === 'announced' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {winner.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">
                      {winner.timestamp?.toDate().toLocaleString()}
                    </td>
                    <td className="p-4">
                      {winner.status === 'pending_approval' && (
                        <button 
                          onClick={() => handleWinnerAnnouncement(winner.id)}
                          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
                        >
                          <Trophy className="h-4 w-4 mr-1" />
                          Announce
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default WinnerApprove;