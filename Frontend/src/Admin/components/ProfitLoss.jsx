import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  CircleDollarSign,
  Calendar,
  Gamepad2,
} from "lucide-react";
import { db } from "../../firebase";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import Loader from "../../components/Loader";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function ProfitLoss() {
  const [gameFilter, setGameFilter] = useState("all");
  const [summary, setSummary] = useState({
    profit: 0,
    loss: 0,
    totalCollection: 0,
  });
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const setDateRange = (filter) => {
    const now = new Date();
    let start, end = new Date();

    switch (filter) {
      case "yesterday":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        break;
      case "7days":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
        break;
      case "today":
      default:
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
    }
    setStartDate(start);
    setEndDate(end);
  };

  useEffect(() => {
    const fetchProfitLossData = async () => {
      setLoading(true);
      
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const firestoreStart = Timestamp.fromDate(start);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      const firestoreEnd = Timestamp.fromDate(end);

      try {
        const allBetCollections = [
          { name: "wingame_bets", gameId: "wingame", timeField: "createdAt", amountField: "amount" },
          { name: "harufBets", gameId: "haruf", timeField: "timestamp", amountField: "betAmount" },
          { name: "rouletteBets", gameId: "roulette", timeField: "timestamp", amountField: "betAmount" },
        ];

        const betCollections = gameFilter === 'all'
            ? allBetCollections
            : allBetCollections.filter(c => c.gameId === gameFilter);

        let totalProfit = 0;
        let totalLoss = 0;
        let totalCollection = 0;

        if (betCollections.length > 0) {
            const promises = betCollections.map(c => {
                const q = query(
                    collection(db, c.name),
                    where(c.timeField, ">=", firestoreStart),
                    where(c.timeField, "<=", firestoreEnd)
                );
                return getDocs(q);
            });

            const snapshots = await Promise.all(promises);

            snapshots.forEach((snapshot, index) => {
            const config = betCollections[index];
            snapshot.forEach((doc) => {
                const bet = doc.data();
                const betAmount = bet[config.amountField] || 0;
                totalCollection += betAmount;

                if (bet.status === "win") {
                totalLoss += bet.winnings || 0;
                } else if (bet.status === "loss") {
                totalProfit += betAmount;
                }
            });
            });
        }
        
        setSummary({
          profit: totalProfit,
          loss: totalLoss,
          totalCollection: totalCollection,
        });

      } catch (error) {
        console.error("Error fetching profit/loss data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfitLossData();
  }, [startDate, endDate, gameFilter]);

  return (
    <div className="w-full p-6 grid grid-cols-1 gap-6 text-white">
      {/* Daily Game Summary */}
      <div className="rounded-2xl p-6 bg-gray-900 border border-gray-700 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
            <CircleDollarSign className="w-5 h-5" />
            Game Summary
            </h2>
        </div>

        <div className="mb-4 p-4 rounded-xl bg-gray-800 flex flex-wrap items-center justify-start gap-4">
            {/* Game Filter */}
            <div className="flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-gray-400" />
                <select
                    value={gameFilter}
                    onChange={(e) => setGameFilter(e.target.value)}
                    className="p-2 rounded-md bg-gray-700 text-gray-200 outline-none"
                    disabled={loading}
                >
                    <option value="all">All Games</option>
                    <option value="wingame">Win Game</option>
                    <option value="haruf">Haruf</option>
                    <option value="roulette">Roulette</option>
                </select>
            </div>

            {/* Date Presets */}
            <div className="flex items-center gap-2">
                <button onClick={() => setDateRange("today")} className="p-2 rounded-md bg-gray-700 hover:bg-yellow-500 hover:text-black transition-colors">Today</button>
                <button onClick={() => setDateRange("yesterday")} className="p-2 rounded-md bg-gray-700 hover:bg-yellow-500 hover:text-black transition-colors">Yesterday</button>
                <button onClick={() => setDateRange("7days")} className="p-2 rounded-md bg-gray-700 hover:bg-yellow-500 hover:text-black transition-colors">Last 7 Days</button>
            </div>
            
            {/* Date Pickers */}
            <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    className="p-2 rounded-md bg-gray-700 text-gray-200 w-32"
                />
                <span className="text-gray-400">to</span>
                <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    className="p-2 rounded-md bg-gray-700 text-gray-200 w-32"
                />
            </div>
        </div>


        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader />
          </div>
        ) : (
          <div className="space-y-3 text-gray-300 text-sm">
            <p className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2"><Receipt className="w-4 h-4" /> Total amount collected:</span>
                <span className="font-semibold text-gray-100">₹{summary.totalCollection.toFixed(2)}</span>
            </p>
            <p className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2"><Receipt className="w-4 h-4" /> Total amount paid out:</span>
                <span className="font-semibold text-gray-100">₹{summary.loss.toFixed(2)}</span>
            </p>
            <p className="flex items-center justify-between gap-2 text-green-400">
                <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Total profit:</span>
                <span className="font-bold">₹{summary.profit.toFixed(2)}</span>
            </p>
            <p className="flex items-center justify-between gap-2 text-red-400">
                <span className="flex items-center gap-2"><TrendingDown className="w-4 h-4" /> Total loss (payouts):</span>
                <span className="font-bold">₹{summary.loss.toFixed(2)}</span>
            </p>
             <p className="flex items-center justify-between gap-2 pt-2 border-t border-gray-700 mt-2">
                <span className="flex items-center gap-2 font-semibold text-base"><CircleDollarSign className="w-5 h-5 text-yellow-400" /> Net Profit/Loss:</span>
                <span className={`font-bold text-lg ${(summary.profit - summary.loss) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ₹{(summary.profit - summary.loss).toFixed(2)}
                </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}