import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Loader2, Trophy } from 'lucide-react';

const GAME_CONFIG = {
  winGame: {
    name: '1 to 12 Win',
    gameStateDoc: 'win_game_1_to_12',
    betsCollection: 'wingame_bets',
    numberField: 'number',
    amountField: 'amount',
  },
// ... (rest of the config is unchanged)
// ...

const Bets = () => {
  const [selectedGame, setSelectedGame] = useState('winGame');
  const [betsSummary, setBetsSummary] = useState([]);
  const [totalBets, setTotalBets] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentRoundId, setCurrentRoundId] = useState(null);
  const [phase, setPhase] = useState(null); // To track game phase (betting, results)

  // Effect to get the current round ID and phase for the selected game
  useEffect(() => {
    const config = GAME_CONFIG[selectedGame];
    if (!config || !config.gameStateDoc) {
      setCurrentRoundId(null);
      setPhase(null);
      setBetsSummary([]);
      setTotalBets(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const gameStateRef = doc(db, 'game_state', config.gameStateDoc);
    
    const unsubscribeGameState = onSnapshot(gameStateRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCurrentRoundId(data.roundId);
        setPhase(data.phase || null);
      } else {
        setCurrentRoundId(null);
        setPhase(null);
      }
    }, (error) => {
      console.error(`Error fetching game state for ${config.name}:`, error);
      setLoading(false);
      setCurrentRoundId(null);
      setPhase(null);
    });

    return () => unsubscribeGameState();
  }, [selectedGame]);

  // Effect to fetch bets for the current round
  useEffect(() => {
// ... (this effect is unchanged)
// ...
    return () => unsubscribe();
  }, [currentRoundId, selectedGame]);

  const handleSelectWinner = async (number) => {
    const config = GAME_CONFIG[selectedGame];
    if (phase !== 'results') {
      alert('You can only select a winner during the "Results" phase.');
      return;
    }
    if (!currentRoundId) {
      alert('No active round to declare a winner for.');
      return;
    }
    if (!window.confirm(`Are you sure you want to make ${number} the winner for this round? This action is irreversible.`)) {
      return;
    }

    const gameStateRef = doc(db, 'game_state', config.gameStateDoc);
    try {
      await updateDoc(gameStateRef, {
        forcedWinner: number,
        winnerProcessed: false, // Flag to indicate processing should start
      });
      alert(`Successfully declared ${number} as the winner! The results will be processed shortly.`);
    } catch (error) {
      console.error("Failed to set winner:", error);
      alert("An error occurred while trying to set the winner. Please check the console.");
    }
  };
  
  const renderContent = () => {
// ... (loading, no summary, etc. is unchanged)
// ...
    if (betsSummary.length === 0) {
        return <p className="text-gray-600 mt-4 text-center">No bets have been placed in this round yet.</p>;
    }

    const mostBetted = betsSummary[0];

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
{/* ... (summary cards are unchanged) ... */}
        </div>

        <h3 className="text-xl font-semibold mb-3">
          All Bets in this Round {selectedGame === 'winGame' && phase === 'results' && <span className="text-sm font-normal text-yellow-600">(Select a winner)</span>}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {betsSummary.map((bet, index) => (
            <div key={bet.number} className={`p-3 rounded-md text-center transition-all ${index === 0 ? 'bg-green-100 ring-2 ring-green-400' : 'bg-gray-100'}`}>
              <div className="flex items-center justify-center gap-2">
                <p className="text-xl font-bold text-gray-800">{bet.number}</p>
                {selectedGame === 'winGame' && phase === 'results' && (
                  <Trophy
                    className="cursor-pointer text-yellow-500 hover:text-yellow-700 transition-transform hover:scale-125"
                    size={20}
                    onClick={() => handleSelectWinner(bet.number)}
                    title={`Declare ${bet.number} as winner`}
                  />
                )}
              </div>
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
            {selectedGame === 'winGame' && phase && (
              <p className={`text-sm font-bold ${phase === 'betting' ? 'text-green-600' : 'text-blue-600'}`}>
                Phase: {phase.charAt(0).toUpperCase() + phase.slice(1)}
              </p>
            )}
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
