import React from "react";

const numbers = [
  ["3", "6", "9", "12", "15", "18", "21", "24", "27", "30", "33", "36"],
  ["2", "5", "8", "11", "14", "17", "20", "23", "26", "29", "32", "35"],
  ["1", "4", "7", "10", "13", "16", "19", "22", "25", "28", "31", "34"],
];

const redNumbers = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23,
  25, 27, 30, 32, 34, 36,
];

const isRed = (num) => redNumbers.includes(Number(num));
const isGreen = (num) => num === "0" || num === "00";

export default function RouletteBoard({ setSelectedBetType, selectedBetType }) {
  return (
    <div className="p-2 md:p-6 bg-green-900 min-h-screen flex flex-col items-center">
      {/* Top grid */}
      <div className="flex flex-col md:flex-row items-start md:items-center">
        {/* Left side: 0 and 00 */}
        <div className="flex flex-row md:flex-col">
          <div
            onClick={() => setSelectedBetType("0")}
            className={`w-10 h-16 md:w-16 md:h-24 flex items-center justify-center text-white text-base md:text-lg font-bold border border-white bg-green-600 cursor-pointer ${selectedBetType === "0" ? "ring-2 ring-yellow-500" : ""}`}
          >
            0
          </div>
          <div
            onClick={() => setSelectedBetType("00")}
            className={`w-10 h-16 md:w-16 md:h-24 flex items-center justify-center text-white text-base md:text-lg font-bold border border-white bg-green-600 cursor-pointer ${selectedBetType === "00" ? "ring-2 ring-yellow-500" : ""}`}
          >
            00
          </div>
        </div>

        {/* Number grid */}
        <div className="grid grid-cols-12 border border-white overflow-x-auto">
          {numbers.map((row, rIdx) =>
            row.map((num, cIdx) => (
              <div
                key={num}
                onClick={() => setSelectedBetType(num)}
                className={`w-10 h-10 md:w-16 md:h-16 flex items-center justify-center text-white text-base md:text-lg font-bold border border-white cursor-pointer
                  ${isGreen(num) ? "bg-green-600" : isRed(num) ? "bg-red-600" : "bg-black"}
                  ${selectedBetType === num ? "ring-2 ring-yellow-500" : ""}`}
              >
                {num}
              </div>
            ))
          )}
        </div>

        {/* Right side: 2 to 1 */}
        <div className="flex flex-row md:flex-col">
          <div
            onClick={() => setSelectedBetType("col1")}
            className={`w-10 h-10 md:w-16 md:h-16 flex items-center justify-center text-white text-xs md:text-sm font-bold border border-white cursor-pointer ${selectedBetType === "col1" ? "ring-2 ring-yellow-500" : ""}`}
          >
            2 to 1
          </div>
          <div
            onClick={() => setSelectedBetType("col2")}
            className={`w-10 h-10 md:w-16 md:h-16 flex items-center justify-center text-white text-xs md:text-sm font-bold border border-white cursor-pointer ${selectedBetType === "col2" ? "ring-2 ring-yellow-500" : ""}`}
          >
            2 to 1
          </div>
          <div
            onClick={() => setSelectedBetType("col3")}
            className={`w-10 h-10 md:w-16 md:h-16 flex items-center justify-center text-white text-xs md:text-sm font-bold border border-white cursor-pointer ${selectedBetType === "col3" ? "ring-2 ring-yellow-500" : ""}`}
          >
            2 to 1
          </div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-3 md:grid-cols-6 mt-2 w-full max-w-[960px] text-white font-bold text-base md:text-lg border border-white">
        <div
          onClick={() => setSelectedBetType("1st12")}
          className={`col-span-1 md:col-span-2 flex items-center justify-center border border-white py-2 md:py-4 cursor-pointer ${selectedBetType === "1st12" ? "ring-2 ring-yellow-500" : ""}`}
        >
          1st 12
        </div>
        <div
          onClick={() => setSelectedBetType("2nd12")}
          className={`col-span-1 md:col-span-2 flex items-center justify-center border border-white py-2 md:py-4 cursor-pointer ${selectedBetType === "2nd12" ? "ring-2 ring-yellow-500" : ""}`}
        >
          2nd 12
        </div>
        <div
          onClick={() => setSelectedBetType("3rd12")}
          className={`col-span-1 md:col-span-2 flex items-center justify-center border border-white py-2 md:py-4 cursor-pointer ${selectedBetType === "3rd12" ? "ring-2 ring-yellow-500" : ""}`}
        >
          3rd 12
        </div>

        <div
          onClick={() => setSelectedBetType("1-18")}
          className={`flex items-center justify-center border border-white py-2 md:py-4 cursor-pointer ${selectedBetType === "1-18" ? "ring-2 ring-yellow-500" : ""}`}
        >
          1 to 18
        </div>
        <div
          onClick={() => setSelectedBetType("even")}
          className={`flex items-center justify-center border border-white py-2 md:py-4 cursor-pointer ${selectedBetType === "even" ? "ring-2 ring-yellow-500" : ""}`}
        >
          EVEN
        </div>
        <div
          onClick={() => setSelectedBetType("red")}
          className={`flex items-center justify-center border border-white py-2 md:py-4 cursor-pointer bg-red-600 ${selectedBetType === "red" ? "ring-2 ring-yellow-500" : ""}`}
        >
          ◆
        </div>
        <div
          onClick={() => setSelectedBetType("black")}
          className={`flex items-center justify-center border border-white py-2 md:py-4 cursor-pointer bg-black ${selectedBetType === "black" ? "ring-2 ring-yellow-500" : ""}`}
        >
          ◆
        </div>
        <div
          onClick={() => setSelectedBetType("odd")}
          className={`flex items-center justify-center border border-white py-2 md:py-4 cursor-pointer ${selectedBetType === "odd" ? "ring-2 ring-yellow-500" : ""}`}
        >
          ODD
        </div>
        <div
          onClick={() => setSelectedBetType("19-36")}
          className={`flex items-center justify-center border border-white py-2 md:py-4 cursor-pointer ${selectedBetType === "19-36" ? "ring-2 ring-yellow-500" : ""}`}
        >
          19 to 36
        </div>
      </div>

      {/* Footer */}
      <p className="text-white mt-2 italic text-sm md:text-base">American Roulette</p>
    </div>
  );
}