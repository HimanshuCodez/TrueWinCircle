import React, { useState, useEffect } from "react";
import HarufGrid from "../../Pages/Haruf";
import { Play, BarChart2, X } from "lucide-react";
import ResultChart from "../ResultChart";
import { db } from "../../firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";

const MarketCard = ({ marketName, openTime, closeTime }) => {
  const [open, setOpen] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [todayResult, setTodayResult] = useState("..");
  const [yesterdayResult, setYesterdayResult] = useState("..");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      try {
        const resultsRef = collection(db, "results");
        const allResultsSnapshot = await getDocs(resultsRef); // Fetch all documents
        const allResults = allResultsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Filter for today's result
        const todayResultDoc = allResults.find(result =>
          result.marketName === marketName &&
          result.date.toDate() >= today &&
          result.date.toDate() < tomorrow
        );

        if (todayResultDoc) {
          setTodayResult(todayResultDoc.number);
        } else {
          setTodayResult(
            Math.floor(Math.random() * 100)
              .toString()
              .padStart(2, "0")
          );
        }

        // Filter for yesterday's result
        const yesterdayResultDoc = allResults.find(result =>
          result.marketName === marketName &&
          result.date.toDate() >= yesterday &&
          result.date.toDate() < today
        );

        if (!yesterdayResultDoc) {
          setYesterdayResult('..');
        } else {
          setYesterdayResult(yesterdayResultDoc.number);
        }
      } catch (error) {
        console.error(`Error fetching results for ${marketName}:`, error);
        setTodayResult(
          Math.floor(Math.random() * 100)
            .toString()
            .padStart(2, "0")
        );
        setYesterdayResult('..');
      } finally {
        setLoading(false);
      }
    };

    if (marketName) {
      fetchResults();
    }
  }, [marketName]);

  if (showChart) {
    return (
      <ResultChart marketName={marketName} onClose={() => setShowChart(false)} />
    );
  }

  if (open) {
    return (
      <div>
        <div className="bg-sky-800 p-2 flex justify-end">
          <button
            onClick={() => setOpen(false)}
            className="bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <HarufGrid />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Card */}
      <div
        onClick={() => setOpen(true)}
        className="cursor-pointer rounded-xl border-2 border-blue-950 bg-white shadow-md overflow-hidden"
      >
        {/* Header */}
        <div className="bg-yellow-500 text-black font-bold text-center py-2">
          {marketName}
        </div>

        {/* Body */}
        <div className="flex flex-col items-center justify-center gap-2 py-4 px-3">
          {/* Status line */}
          <div className="flex items-center gap-2 text-red-600 text-lg font-bold">
            {loading ? (
              <span>Loading...</span>
            ) : (
              <>
                <span>{`{ ${yesterdayResult} }`}</span>
                <span className="text-black">{`→`}</span>
                <span>{`[ ${todayResult} ]`}</span>
              </>
            )}
          </div>

          {/* Market Running */}
          <p className="text-green-600 font-semibold text-sm">
            Market is Running
          </p>

          {/* Action row */}
          <div className="flex justify-between items-center w-full mt-2 px-2">
            {/* Left icon */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                setShowChart(true);
              }}
              className="cursor-pointer flex items-center gap-1 text-red-500"
            >
              <BarChart2 size={35} />
            </div>

            {/* Right play button */}
            <button className="bg-[#042346]  p-3 rounded-full hover:bg-yellow-600">
              <Play
                onClick={() => setOpen(true)}
                className="text-white"
                size={24}
              />
            </button>
          </div>

          {/* Timings */}
          <div className="flex justify-between text-sm text-gray-700 w-full mt-3">
            <p>
              <span className="font-medium">Open:</span> {openTime}
            </p>
            <p>
              <span className="font-medium">Close:</span> {closeTime}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketCard;
