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
      // Simulate fetching data with a delay
      setTimeout(() => {
        const dummyResults = [
          { id: '1', date: new Date(new Date().setDate(new Date().getDate() - 0)), number: '42' },
          { id: '2', date: new Date(new Date().setDate(new Date().getDate() - 1)), number: '17' },
          { id: '3', date: new Date(new Date().setDate(new Date().getDate() - 2)), number: '88' },
          { id: '4', date: new Date(new Date().setDate(new Date().getDate() - 3)), number: '05' },
          { id: '5', date: new Date(new Date().setDate(new Date().getDate() - 4)), number: '91' },
          { id: '6', date: new Date(new Date().setDate(new Date().getDate() - 5)), number: '33' },
          { id: '7', date: new Date(new Date().setDate(new Date().getDate() - 6)), number: '76' },
          { id: '8', date: new Date(new Date().setDate(new Date().getDate() - 7)), number: '67' },
          { id: '9', date: new Date(new Date().setDate(new Date().getDate() - 8)), number: '70' },
          { id: '10', date: new Date(new Date().setDate(new Date().getDate() - 9)), number: '26' },
          { id: '11', date: new Date(new Date().setDate(new Date().getDate() - 10)), number: '76' },
          { id: '12', date: new Date(new Date().setDate(new Date().getDate() - 11)), number: '46' },
          { id: '13', date: new Date(new Date().setDate(new Date().getDate() - 12)), number: '80' },
          { id: '14', date: new Date(new Date().setDate(new Date().getDate() - 13)), number: '76' },
          { id: '15', date: new Date(new Date().setDate(new Date().getDate() - 14)), number: '60' },
          { id: '16', date: new Date(new Date().setDate(new Date().getDate() - 15)), number: '56' },
          { id: '17', date: new Date(new Date().setDate(new Date().getDate() - 16)), number: '66' },
          { id: '18', date: new Date(new Date().setDate(new Date().getDate() - 17)), number: '45' },
          { id: '19', date: new Date(new Date().setDate(new Date().getDate() - 18)), number: '79' },
          { id: '20', date: new Date(new Date().setDate(new Date().getDate() - 19)), number: '44' },
          { id: '21', date: new Date(new Date().setDate(new Date().getDate() - 20)), number: '88' },
          { id: '22', date: new Date(new Date().setDate(new Date().getDate() - 21)), number: '76' },
          { id: '23', date: new Date(new Date().setDate(new Date().getDate() - 22)), number: '61' },
          { id: '24', date: new Date(new Date().setDate(new Date().getDate() - 23)), number: '72' },
          { id: '25', date: new Date(new Date().setDate(new Date().getDate() - 24)), number: '78' },
          { id: '26', date: new Date(new Date().setDate(new Date().getDate() - 25)), number: '56' },
          { id: '27', date: new Date(new Date().setDate(new Date().getDate() - 26)), number: '90' },
          { id: '28', date: new Date(new Date().setDate(new Date().getDate() - 27)), number: '13' },
          { id: '29', date: new Date(new Date().setDate(new Date().getDate() - 28)), number: '86' },
          { id: '30', date: new Date(new Date().setDate(new Date().getDate() - 29)), number: '34' },
          { id: '31', date: new Date(new Date().setDate(new Date().getDate() - 30)), number: '85' },
          { id: '32', date: new Date(new Date().setDate(new Date().getDate() - 31)), number: '66' },
        ];
        setResults(dummyResults);
        setLoading(false);
      }, 1000); // 1 second delay to show loader
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
                    <p className="text-center text-gray-500 mt-4">No data available.</p>
                )}
                </div>
            )}
        </div>
    </div>
  );
};

export default ResultChart;