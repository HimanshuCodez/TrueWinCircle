import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import Loader from '../../components/Loader';

const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersQuery = query(collection(db, 'users'), orderBy('name'));
        const querySnapshot = await getDocs(usersQuery);
        const usersList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersList);
      } catch (err) {
        setError('Failed to fetch users. Please check console for details.');
        console.error("Error fetching users: ", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) {
      return users;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    return users.filter(user =>
      user.name?.toLowerCase().includes(lowercasedFilter) ||
      user.email?.toLowerCase().includes(lowercasedFilter) ||
      user.phoneNumber?.includes(lowercasedFilter)
    );
  }, [searchTerm, users]);

  if (loading) {
    return <div className="flex justify-center items-center p-8"><Loader /></div>;
  }

  if (error) {
    return <p className="text-red-500 p-6">{error}</p>;
  }

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">All Users ({filteredUsers.length})</h2>
      
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 text-left text-sm font-semibold text-gray-600">Name</th>
              <th className="p-4 text-left text-sm font-semibold text-gray-600">Phone Number</th>
              <th className="p-4 text-left text-sm font-semibold text-gray-600">Email</th>
              <th className="p-4 text-right text-sm font-semibold text-gray-600">Total Balance</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => {
              const totalBalance = (user.walletBalance || 0) + (user.winningMoney || 0);
              return (
                <tr key={user.id} className="border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium text-gray-800">{user.name || 'N/A'}</td>
                  <td className="p-4 text-gray-600">{user.phoneNumber || 'N/A'}</td>
                  <td className="p-4 text-gray-600">{user.email || 'N/A'}</td>
                  <td className="p-4 text-right font-semibold text-gray-800">₹{totalBalance.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllUsers;
