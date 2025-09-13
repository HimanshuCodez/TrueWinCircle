import React, { useState } from "react";
import HarufGrid from "../Pages/Haruf"; // your betting component
import { Play, BarChart2 } from "lucide-react"; // icons

const MarketCard = () => {
  const [open, setOpen] = useState(false);

  if (open) {
    return <HarufGrid />;
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Card */}
      <div
        onClick={() => setOpen(true)}
        className="cursor-pointer rounded-xl border-2 border-red-500 bg-white shadow-md overflow-hidden"
      >
        {/* Header */}
        <div className="bg-red-500 text-white font-bold text-center py-2">
          GHAZIABAD
        </div>

        {/* Body */}
        <div className="flex flex-col items-center justify-center gap-2 py-4 px-3">
          {/* Status line */}
          <div className="flex items-center gap-2 text-red-600 text-lg font-bold">
            <span>{`{ ** }`}</span>
            <span className="text-black">{`→`}</span>
            <span>{`[ ** ]`}</span>
          </div>

          {/* Market Running */}
          <p className="text-green-600 font-semibold text-sm">
            Market is Running
          </p>

          {/* Action row */}
          <div className="flex justify-between items-center w-full mt-2 px-2">
            {/* Left icon */}
            <div className="flex items-center gap-1 text-red-500">
              <BarChart2 size={20} />
            </div>

            {/* Right play button */}
            <button className="bg-green-500 p-3 rounded-full hover:bg-green-600">
              <Play className="text-white" size={24} />
            </button>
          </div>

          {/* Timings */}
          <div className="flex justify-between text-sm text-gray-700 w-full mt-3">
            <p>
              <span className="font-medium">Open:</span> 03:00 PM
            </p>
            <p>
              <span className="font-medium">Close:</span> 08:40 PM
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketCard;
