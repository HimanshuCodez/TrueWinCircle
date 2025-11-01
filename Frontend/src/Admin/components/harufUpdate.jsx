import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';
import Loader from '../../components/Loader';

const marketNames = [
  "DELHI BAZAAR",
  "DHAN KUBER",
  "DISAWAR",
  "FARIDABAD",
  "GALI",
  "SHREE GANESH",
];

const HarufUpdate = () => {
  const [selectedMarket, setSelectedMarket] = useState(marketNames[0]);
  const [newResult, setNewResult] = useState('');
  const [currentYesterdayResult, setCurrentYesterdayResult] = useState('..');
  const [currentTodayResult, setCurrentTodayResult] = useState('..');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState([]);

  const fetchResultsAndHistory = async (market) => {
    setLoading(true);
    setCurrentTodayResult('..');
    setCurrentYesterdayResult('..');
    setHistory([]);
    try {
      // Fetch ALL results because we are not using an index.
      // WARNING: This is inefficient and can be slow and costly if you have many results.
      const resultsRef = collection(db, "results");
      const allResultsSnapshot = await getDocs(resultsRef);
      const allResults = allResultsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Filter results for the selected market
      const marketResults = allResults.filter(result => result.marketName === market);

      // Sort the market-specific results by date
      marketResults.sort((a, b) => {
        if (a.date && b.date) {
          return b.date.toDate() - a.date.toDate(); // descending
        }
        return 0;
      });


      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let foundToday = false;
      let foundYesterday = false;

      for (const result of marketResults) {
        if (result.date) { // Ensure date exists
            const resultDate = result.date.toDate();
            if (!foundToday && resultDate >= today && resultDate < tomorrow) {
                setCurrentTodayResult(result.number);
                foundToday = true;
            }
            if (!foundYesterday && resultDate >= yesterday && resultDate < today) {
                setCurrentYesterdayResult(result.number);
                foundYesterday = true;
            }
        }
      }

      // Set history, limited to the last 30 results for display
      setHistory(marketResults.slice(0, 30));

    } catch (error) {
      console.error("Error fetching results:", error);
      toast.error("Failed to fetch results.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMarket) {
        fetchResultsAndHistory(selectedMarket);
    }
  }, [selectedMarket]);

  const handleUpdateResult = async () => {
    if (!newResult || isNaN(parseInt(newResult)) || parseInt(newResult) < 0 || parseInt(newResult) > 99) {
      toast.error("Please enter a valid number between 0 and 99.");
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, "results"), {
        marketName: selectedMarket,
        number: parseInt(newResult).toString().padStart(2, '0'), // Ensure two digits
        date: serverTimestamp(),
      });
      toast.success(`Result for ${selectedMarket} updated successfully!`);
      setNewResult('');
      fetchResultsAndHistory(selectedMarket); // Refresh results and history
    } catch (error) {
      console.error("Error updating result:", error);
      toast.error("Failed to update result.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Update Market Results</h3>

        <div className="mb-4">
          <label htmlFor="marketSelect" className="block text-sm font-medium text-gray-700">Select Market</label>
          <select
            id="marketSelect"
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            {marketNames.map((name) => (
              <option key={name} value={name}>{name}</option>))}
          </select>
        </div>

        {loading ? (
          <Loader />
        ) : (
          <div className="mb-4">
            <p className="text-sm text-gray-700">Current Results for {selectedMarket}:</p>
            <div className="flex items-center gap-2 text-red-600 text-lg font-bold">
              <span>{`{ ${currentYesterdayResult} }`}</span>
              <span className="text-black">{`→`}</span>
              <span>{`[ ${currentTodayResult} ]`}</span>
            </div>
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="newResult" className="block text-sm font-medium text-gray-700">New Result (0-99)</label>
          <input
            type="number"
            id="newResult"
            value={newResult}
            onChange={(e) => setNewResult(e.target.value)}
            min="0"
            max="99"
            className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            placeholder="Enter new result (0-99)"
          />
        </div>

        <button
          onClick={handleUpdateResult}
          disabled={submitting || loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Updating...' : 'Update Result'}
        </button>
      </div>

      <div className="mt-6">
        <h4 className="text-md font-semibold mb-2">Update History for {selectedMarket}</h4>
        <div className="max-h-96 overflow-y-auto border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Number
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {history.length > 0 ? (
                history.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.date ? item.date.toDate().toLocaleDateString() : 'No date'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.number}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" className="px-6 py-4 text-center text-sm text-gray-500">
                    {loading ? 'Loading history...' : 'No history found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HarufUpdate;
