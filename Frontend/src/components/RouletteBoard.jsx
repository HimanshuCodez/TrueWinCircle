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

const blackNumbers = [
  2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24,
  26, 28, 29, 31, 33, 35,
];

const isRed = (num) => redNumbers.includes(Number(num));
const isBlack = (num) => blackNumbers.includes(Number(num));
const isOdd = (num) => Number(num) % 2 !== 0 && Number(num) > 0;
const isEven = (num) => Number(num) % 2 === 0 && Number(num) > 0;
const isHigh = (num) => Number(num) >= 19 && Number(num) <= 36;
const isLow = (num) => Number(num) >= 1 && Number(num) <= 18;
const isFirst12 = (num) => Number(num) >= 1 && Number(num) <= 12;
const isSecond12 = (num) => Number(num) >= 13 && Number(num) <= 24;
const isThird12 = (num) => Number(num) >= 25 && Number(num) <= 36;
const isCol1 = (num) => numbers[0].includes(String(num));
const isCol2 = (num) => numbers[1].includes(String(num));
const isCol3 = (num) => numbers[2].includes(String(num));

export default function RouletteBoard({ setSelectedBetType, selectedBetType }) {
  return (
    <div className="p-2 md:p-4 bg-green-900  flex flex-col items-center w-full">
      {/* Scrollable container for the entire board */}
      <div className="w-full overflow-x-auto pb-4 flex md:justify-center">
        <div className="inline-block min-w-max relative"> 
          {/* Main Board Layout */}
          <div className="flex  items-start">
            {/* Left side: 0 and 00 */}
            <div className="flex flex-col text-white text-base md:text-lg font-bold">
              <div
                onClick={() => setSelectedBetType("0")}
                className={`w-12 h-[54px] md:w-16 md:h-24 flex items-center justify-center bg-green-600 cursor-pointer border-l border-t border-b border-white ${selectedBetType === "0" ? "ring-2 ring-yellow-500 z-10" : ""}`}>
                0
              </div>
              <div
                onClick={() => setSelectedBetType("00")}
                className={`w-12 h-[54px] md:w-16 md:h-24 flex items-center justify-center bg-green-600 cursor-pointer border-l border-b border-white ${selectedBetType === "00" ? "ring-2 ring-yellow-500 z-10" : ""}`}>
                00
              </div>
            </div>

            {/* Main Number Grid */}
            <div className="grid grid-cols-12 border-t border-white">
              {numbers.map((row) =>
                row.map((num) => (
                  <div
                    key={num}
                    onClick={() => setSelectedBetType(num)}
                    className={`w-9 h-9 md:w-16 md:h-16 flex items-center justify-center text-white text-sm md:text-lg font-bold border-r border-b border-white cursor-pointer transition-all
                      ${isRed(num) ? "bg-red-600" : "bg-black"}
                      ${(selectedBetType === num || (selectedBetType === "red" && isRed(num)) || (selectedBetType === "black" && isBlack(num)) || (selectedBetType === "odd" && isOdd(num)) || (selectedBetType === "even" && isEven(num)) || (selectedBetType === "19-36" && isHigh(num)) || (selectedBetType === "1-18" && isLow(num)) || (selectedBetType === '1st12' && isFirst12(num)) || (selectedBetType === '2nd12' && isSecond12(num)) || (selectedBetType === '3rd12' && isThird12(num)) || (selectedBetType === 'col1' && isCol1(num)) || (selectedBetType === 'col2' && isCol2(num)) || (selectedBetType === 'col3' && isCol3(num))) ? "ring-2 ring-yellow-500 z-10 scale-110" : "hover:bg-opacity-75"}`}>
                    {num}
                  </div>
                ))
              )}
            </div>

            {/* Right side: 2 to 1 */}
            <div className="flex flex-col text-white text-xs md:text-sm font-bold">
              {[...Array(3)].map((_, i) => (
                <div
                  key={`col${i + 1}`}
                  onClick={() => setSelectedBetType(`col${i + 1}`)}
                  className={`w-9 h-9 md:w-16 md:h-16 flex items-center justify-center border-r border-b border-t border-white cursor-pointer ${selectedBetType === `col${i + 1}` ? "ring-2 ring-yellow-500 z-10" : ""}`}>
                  2 to 1
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Section (aligned with the grid) */}
          <div className="flex text-white font-bold text-sm md:text-lg">
            <div className="w-12 md:w-16 shrink-0"></div> {/* Spacer for 0/00 column */}
            <div className="grid grid-cols-3 w-[432px] md:w-[768px]">
              <div onClick={() => setSelectedBetType("1st12")} className={`flex-1 text-center border-b border-r border-white py-2 md:py-4 cursor-pointer ${selectedBetType === "1st12" ? "ring-2 ring-yellow-500 z-10" : ""}`}>1st 12</div>
              <div onClick={() => setSelectedBetType("2nd12")} className={`flex-1 text-center border-b border-r border-white py-2 md:py-4 cursor-pointer ${selectedBetType === "2nd12" ? "ring-2 ring-yellow-500 z-10" : ""}`}>2nd 12</div>
              <div onClick={() => setSelectedBetType("3rd12")} className={`flex-1 text-center border-b border-r border-white py-2 md:py-4 cursor-pointer ${selectedBetType === "3rd12" ? "ring-2 ring-yellow-500 z-10" : ""}`}>3rd 12</div>
            </div>
            <div className="w-9 md:w-16 shrink-0"></div> {/* Spacer for 2:1 column */}
          </div>
          <div className="flex text-white font-bold text-sm md:text-lg">
            <div className="w-12 md:w-16 shrink-0"></div> {/* Spacer */}
            <div className="grid grid-cols-6 w-[432px] md:w-[768px]">
              <div onClick={() => setSelectedBetType("1-18")} className={`flex-1 text-center border-b border-r border-white py-2 md:py-4 cursor-pointer ${selectedBetType === "1-18" ? "ring-2 ring-yellow-500 z-10" : ""}`}>1-18</div>
              <div onClick={() => setSelectedBetType("even")} className={`flex-1 text-center border-b border-r border-white py-2 md:py-4 cursor-pointer ${selectedBetType === "even" ? "ring-2 ring-yellow-500 z-10" : ""}`}>EVEN</div>
              <div onClick={() => setSelectedBetType("red")} className={`flex-1 text-center border-b border-r border-white py-2 md:py-4 cursor-pointer bg-red-600 ${selectedBetType === "red" ? "ring-2 ring-yellow-500 z-10" : ""}`}>◆</div>
              <div onClick={() => setSelectedBetType("black")} className={`flex-1 text-center border-b border-r border-white py-2 md:py-4 cursor-pointer bg-black ${selectedBetType === "black" ? "ring-2 ring-yellow-500 z-10" : ""}`}>◆</div>
              <div onClick={() => setSelectedBetType("odd")} className={`flex-1 text-center border-b border-r border-white py-2 md:py-4 cursor-pointer ${selectedBetType === "odd" ? "ring-2 ring-yellow-500 z-10" : ""}`}>ODD</div>
              <div onClick={() => setSelectedBetType("19-36")} className={`flex-1 text-center border-b border-r border-white py-2 md:py-4 cursor-pointer ${selectedBetType === "19-36" ? "ring-2 ring-yellow-500 z-10" : ""}`}>19-36</div>
            </div>
            <div className="w-9 md:w-16 shrink-0"></div> {/* Spacer */}
          </div>
        </div>
      </div>

      <p className="text-white mt-2 italic text-sm md:text-base">American Roulette</p>
    </div>
  );
}
