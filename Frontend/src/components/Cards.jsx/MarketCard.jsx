import React, { useState } from "react";
import HarufGrid from "../../Pages/Haruf"; // your betting component
import { Play, BarChart2, X } from "lucide-react"; // icons

const MarketCard = () => {
  const [open, setOpen] = useState(false);

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
          GHAZIABAD
        </div>

        {/* Body */}
        <div className="flex flex-col items-center justify-center gap-2 py-4 px-3">
          {/* Status line */}
          <div className="flex items-center gap-2 text-red-600 text-lg font-bold">
            <span>{`{ 23 }`}</span>
            <span className="text-black">{`→`}</span>
            <span>{`[ 78 ]`}</span>
          </div>

          {/* Market Running */}
          <p className="text-green-600 font-semibold text-sm">
            Market is Running
          </p>

          {/* Action row */}
          <div className="flex justify-between items-center w-full mt-2 px-2">
            {/* Left icon */}
            <div className="flex items-center gap-1 text-red-500">
              <BarChart2 size={35} />
            </div>

            {/* Right play button */}
            <button className="bg-[#042346]  p-3 rounded-full hover:bg-yellow-600">
              <Play onClick={() => setOpen(true)} className="text-white" size={24} />
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
