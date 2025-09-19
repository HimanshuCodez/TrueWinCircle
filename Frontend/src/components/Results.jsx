import React from 'react';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';

const dummyResults = [
  { id: 1, gameName: 'Delhi Bazaar', result: 'win', amount: 500, date: '2025-09-19' },
  { id: 2, gameName: 'Gali', result: 'loss', amount: -200, date: '2025-09-19' },
  { id: 3, gameName: 'Disawar', result: 'win', amount: 1000, date: '2025-09-18' },
  { id: 4, gameName: 'Faridabad', result: 'loss', amount: -150, date: '2025-09-18' },
  { id: 5, gameName: 'Shree Ganesh', result: 'win', amount: 300, date: '2025-09-17' },
  { id: 6, gameName: 'Dhan Kuber', result: 'loss', amount: -50, date: '2025-09-17' },
  { id: 7, gameName: 'Market', result: 'win', amount: 750, date: '2025-09-16' },
];

const Results = () => {
  return (
    <div className="min-h-screen bg-[#042346] text-white">
      {/* Header */}
      <header className="bg-red-600 px-4 py-4 flex items-center gap-3">
        <button aria-label="back" className="text-white">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-white font-semibold text-lg">Game Results</h1>
      </header>

      <main className="p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-yellow-500">Your Recent Results</h2>
          
          <div className="space-y-4">
            {dummyResults.map((item) => (
              <div 
                key={item.id} 
                className={`rounded-lg p-4 flex items-center justify-between shadow-lg transition-all duration-300 ${item.result === 'win' 
                    ? 'bg-green-500/20 border-l-4 border-green-500' 
                    : 'bg-red-500/20 border-l-4 border-red-500'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${item.result === 'win' ? 'bg-green-500/30' : 'bg-red-500/30'}`}>
                    {item.result === 'win' ? <TrendingUp className="text-green-400" size={24} /> : <TrendingDown className="text-red-400" size={24} />}
                  </div>
                  <div>
                    <p className="font-bold text-lg">{item.gameName}</p>
                    <p className="text-sm text-gray-300">{item.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-xl ${item.result === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                    {item.result === 'win' ? `+₹${item.amount}` : `-₹${Math.abs(item.amount)}`}
                  </p>
                  <p className={`text-sm font-semibold uppercase ${item.result === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                    {item.result}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Results;
