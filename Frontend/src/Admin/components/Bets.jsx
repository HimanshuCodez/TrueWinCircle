import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Loader2 } from 'lucide-react';

const GAME_CONFIG = {
  winGame: {
    name: '1 to 12 Win',
    gameStateDoc: 'win_game_1_to_12',
    betsCollection: 'wingame_bets',
    numberField: 'number',
    amountField: 'amount',
  },
  haruf: {
    name: 'Haruf Game',
    gameStateDoc: 'haruf_game',
    betsCollection: 'harufBets',
    numberField: 'selectedNumber',
    amountField: 'betAmount',
  },
  roulette: {
    name: 'Roulette',
    // Roulette doesn't have a server-side round concept that can be monitored this way.
    gameStateDoc: null,
    betsCollection: 'rouletteBets',
    numberField: 'betType',
    amountField: 'betAmount',
  },
};

const Bets = () => {
  const [selectedGame, setSelectedGame] = useState('winGame');
  const [betsSummary, setBetsSummary] = useState([]);
  const [totalBets, setTotalBets] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentRoundId, setCurrentRoundId] = useState(null);

  // Effect to get the current round ID for the selected game
  useEffect(() => {
    const config = GAME_CONFIG[selectedGame];
    if (!config || !config.gameStateDoc) {
      setCurrentRoundId(null);
      setBetsSummary([]);
      setTotalBets(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const gameStateRef = doc(db, 'game_state', config.gameStateDoc);
    
    const unsubscribeGameState = onSnapshot(gameStateRef, (docSnap) => {
      if (docSnap.exists()) {
        const roundId = docSnap.data().roundId;
        setCurrentRoundId(roundId);
      } else {
        setCurrentRoundId(null);
      }
      // Loading will be set to false in the bets effect
    }, (error) => {
      console.error(`Error fetching game state for ${config.name}:`, error);
      setLoading(false);
      setCurrentRoundId(null);
    });

    return () => unsubscribeGameState();
  }, [selectedGame]);

  // Effect to fetch bets for the current round
  useEffect(() => {
    const config = GAME_CONFIG[selectedGame];

    if (!currentRoundId) {
      setBetsSummary([]);
      setTotalBets(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const betsRef = collection(db, config.betsCollection);
    const q = query(betsRef, where('roundId', '==', currentRoundId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const summary = {};
      let total = 0;

      snapshot.forEach((doc) => {
        const bet = doc.data();
        const number = bet[config.numberField];
        const amount = bet[config.amountField];
        const userId = bet.userId;

        if (number === undefined || amount === undefined) return;

        if (!summary[number]) {
          summary[number] = { count: 0, amount: 0, users: new Set() };
        }
        summary[number].count += 1;
        summary[number].amount += amount;
        summary[number].users.add(userId);
        total += amount;
      });

      // Convert summary to a sorted array
      const sortedSummary = Object.entries(summary)
        .map(([number, data]) => ({
          number,
          count: data.count,
          amount: data.amount,
          userCount: data.users.size,
        }))
        .sort((a, b) => b.amount - a.amount); // Sort by amount descending

      setBetsSummary(sortedSummary);
      setTotalBets(total);
      setLoading(false);
    }, (error) => {
      console.error(`Error fetching bets for ${config.name}:`, error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentRoundId, selectedGame]);
  
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-blue-500" size={32} />
          <p className="ml-2 text-gray-600">Loading Bets for Current Round...</p>
        </div>
      );
    }

    const config = GAME_CONFIG[selectedGame];
    if (selectedGame === 'roulette' || !config.gameStateDoc) {
      return <p className="text-gray-600 mt-4 text-center">Live round summary is not available for this game type.</p>;
    }
    
    if (!currentRoundId) {
      return <p className="text-red-500 mt-4 text-center">No active game round found. Please ensure the game is running.</p>;
    }
    
    if (betsSummary.length === 0) {
        return <p className="text-gray-600 mt-4 text-center">No bets have been placed in this round yet.</p>;
    }

    const mostBetted = betsSummary[0];

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
                <p className="text-sm text-blue-800 font-semibold">Total Bet Amount</p>
                <p className="text-3xl font-bold text-blue-600">₹{totalBets.toFixed(2)}</p>
            </div>
            {mostBetted && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
                    <p className="text-sm text-green-800 font-semibold">Most Betted Number</p>
                    <p className="text-3xl font-bold text-green-600">{mostBetted.number}</p>
                    <p className="text-xs text-gray-600">
                        ₹{mostBetted.amount.toFixed(2)} from {mostBetted.userCount} user(s)
                    </p>
                </div>
            )}
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-center">
                <p className="text-sm text-yellow-800 font-semibold">Total Bets Placed</p>
                <p className="text-3xl font-bold text-yellow-600">{betsSummary.reduce((acc, bet) => acc + bet.count, 0)}</p>
            </div>
        </div>

        <h3 className="text-xl font-semibold mb-3">All Bets in this Round</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {betsSummary.map((bet, index) => (
            <div key={bet.number} className={`p-3 rounded-md text-center transition-all ${index === 0 ? 'bg-green-100 ring-2 ring-green-400' : 'bg-gray-100'}`}>
              <p className="text-xl font-bold text-gray-800">{bet.number}</p>
              <p className="text-sm text-gray-600">Users: {bet.userCount}</p>
              <p className="text-sm text-gray-600">Bets: {bet.count}</p>
              <p className="text-sm font-semibold text-gray-800">₹{bet.amount.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
        <div>
            <h2 className="text-2xl font-semibold">
              Live Bet Summary
            </h2>
            <p className="text-sm text-gray-500">Round ID: {currentRoundId || 'N/A'}</p>
        </div>
        
        <div className="w-full md:w-64">
            <label htmlFor="game-select" className="block text-sm font-medium text-gray-700 mb-1">Select Game</label>
            <select
                id="game-select"
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
                <option value="winGame">1 to 12 Win</option>
                <option value="haruf">Haruf Game</option>
                <option value="roulette">Roulette</option>
            </select>
        </div>
      </div>

      {renderContent()}
    </div>
  );
};

export default Bets;
