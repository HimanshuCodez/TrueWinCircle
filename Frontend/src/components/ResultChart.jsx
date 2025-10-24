import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import Loader from './Loader';

const ResultChart = ({ marketName, onClose }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const resultsRef = collection(db, 'results');
        const allResultsSnapshot = await getDocs(resultsRef); // Fetch all documents
        let allResults = allResultsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Convert Firestore Timestamp to JS Date
                date: data.date.toDate(),
            };
        });

        // Client-side filtering
        allResults = allResults.filter(result => result.marketName === marketName);

        // Client-side sorting by date in descending order
        allResults.sort((a, b) => b.date.getTime() - a.date.getTime());

        // Client-side limiting
        const fetchedResults = allResults.slice(0, 30);

        setResults(fetchedResults);
      } catch (error) {
          console.error("Error fetching results: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [marketName]);

  return (
    <div className="w-full max-w-md mx-auto">
        <div className="bg-sky-800 p-2 flex justify-end">
          <button
            onClick={onClose}
            className="bg-red-500 text-black p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div className="p-4 bg-gray-50">
            <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">{marketName} Results</h2>
            {loading ? (
                <Loader />
            ) : (
                <div className="overflow-x-auto">
                {results.length > 0 ? (
                    <table className="w-full min-w-max table-auto border-collapse border border-gray-300 shadow-md rounded-lg">
                    <thead className="bg-gray-200">
                        <tr>
                        <th className="border border-gray-300 p-3 text-left">Date</th>
                        <th className="border border-gray-300 p-3 text-center">Number</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map((result, index) => (
                        <tr key={result.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="border border-gray-300 p-3">{result.date.toLocaleDateString()}</td>
                            <td className="border border-gray-300 p-3 text-center font-bold text-xl text-red-600">{result.number}</td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                ) : (
                    <p className="text-center text-gray-500 mt-4">No Result available.</p>
                )}
                </div>
            )}
        </div>
    </div>
  );
};

export default ResultChart;