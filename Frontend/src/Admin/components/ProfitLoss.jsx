import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Receipt,
  CircleDollarSign,
  ListOrdered,
  Calendar,
} from "lucide-react";
import { db } from "../../firebase";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import Loader from "../../components/Loader";

export default function ProfitLoss() {
  const [dateFilter, setDateFilter] = useState("today");
  const [summary, setSummary] = useState({
    profit: 0,
    loss: 0,
    totalCollection: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateDateRange = () => {
      const now = new Date();
      let start, end;

      switch (dateFilter) {
        case "yesterday":
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
          break;
        case "7days":
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
          start.setHours(0, 0, 0, 0);
          end = new Date(); // Now
          break;
        case "today":
        default:
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          end = new Date(); // Now
          break;
      }
      return { start: Timestamp.fromDate(start), end: Timestamp.fromDate(end) };
    };

    const fetchProfitLossData = async () => {
      setLoading(true);
      const { start, end } = calculateDateRange();

      try {
        const betCollections = [
          { name: "wingame_bets", timeField: "createdAt", amountField: "amount" },
          { name: "harufBets", timeField: "timestamp", amountField: "betAmount" },
          { name: "rouletteBets", timeField: "timestamp", amountField: "betAmount" },
        ];

        let totalProfit = 0;
        let totalLoss = 0;
        let totalCollection = 0;

        const promises = betCollections.map(c => {
          const q = query(
            collection(db, c.name),
            where(c.timeField, ">=", start),
            where(c.timeField, "<=", end)
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
  }, [dateFilter]);

  return (
    <div className="w-full p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 text-white">
      {/* Per-Number Bet Tracking */}
      <div className="rounded-2xl p-6 bg-gray-900 border border-gray-700 shadow-lg">
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
          <ListOrdered className="w-5 h-5" />
          Per-Number Bet Tracking
        </h2>
        <div className="space-y-3 text-gray-300 text-sm">
          <p>Feature coming soon...</p>
        </div>
      </div>

      {/* Daily Game Summary */}
      <div className="rounded-2xl p-6 bg-gray-900 border border-gray-700 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
            <CircleDollarSign className="w-5 h-5" />
            Game Summary
            </h2>
            <div className="mt-3 sm:mt-0 p-2 rounded-xl bg-gray-800 text-gray-300 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="bg-transparent outline-none text-gray-200"
                    disabled={loading}
                >
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="7days">Last 7 Days</option>
                </select>
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