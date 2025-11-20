import React from "react";
import { X, Info, Undo, Plus, Minus, Coins } from "lucide-react";

export default function BettingPanel({ betAmount, setBetAmount, spinWheel, spinning, bettingLoading, balance, selectedBetType }) {
  const parsedBetAmount = parseFloat(betAmount) || 0;

  const handleBetChange = (change) => {
    const newAmount = parsedBetAmount + change;
    if (newAmount >= 1) {
      setBetAmount(newAmount.toString());
    } else {
      setBetAmount("1");
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-gray-900 via-black to-gray-900 text-white py-3 px-4 md:px-6 flex flex-col md:flex-row items-center md:justify-between space-y-3 md:space-y-0">
      
      {/* Left buttons */}
      <div className="flex items-center space-x-2 md:space-x-4">
        <button className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600">
          <X size={20} />
        </button>
        <button className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600">
          <Undo size={20} />
        </button>
        <button className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600">
          <Info size={20} />
        </button>
      </div>

      {/* Center section */}
      <div className="flex flex-col items-center space-y-1 md:space-y-0">
        <span className="text-xs uppercase tracking-wider opacity-80">
          Place Your Bet, Please
        </span>
        <div className="flex items-center space-x-2 md:space-x-4 mt-1">
          <span className="text-sm font-semibold">{balance.toFixed(2)}</span>
          <button 
            onClick={() => handleBetChange(-1)}
            disabled={parsedBetAmount <= 10}
            className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Minus size={20} />
          </button>
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            className="w-24 bg-gray-700 rounded-lg p-2 text-center text-lg font-bold focus:ring-2 focus:ring-yellow-500 outline-none"
            placeholder="Amount"
          />
          <button 
            onClick={() => handleBetChange(1)}
            className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Right side - Spin Button */}
      <button
        onClick={spinWheel}
        disabled={spinning || bettingLoading || parsedBetAmount <= 0 || selectedBetType === null}
        className="flex items-center space-x-2 bg-yellow-500 px-4 py-2 rounded-full hover:bg-yellow-600 text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed mt-3 md:mt-0"
      >
        <Coins size={20} className="text-black" />
        <span className="font-semibold">{bettingLoading ? "Placing..." : spinning ? "Spinning..." : "Spin"}</span>
      </button>
    </div>
  );
}