import { useState, useRef, useEffect } from "react";

export default function CasinoRoulette() {
  const [recent, setRecent] = useState([7, 24, 12, 0, 19]);
  const [spinning, setSpinning] = useState(false);
  const [winningNumber, setWinningNumber] = useState(null);
  const [rotation, setRotation] = useState(0); // Current rotation in degrees for visual spin
  const wheelRef = useRef(null);

  const spinWheel = () => {
    if (spinning) return;

    setSpinning(true);
    setWinningNumber(null); // Clear previous winning number

    const newWinningNumber = Math.floor(Math.random() * 37); // Generate random number 0-36

    // Generate a large random rotation for visual effect
    // Add a few full rotations (e.g., 5-10) plus a random angle to stop at
    const randomFullRotations = Math.floor(Math.random() * 6) + 5; // 5 to 10 full rotations
    const randomStopAngle = Math.floor(Math.random() * 360); // Random angle within the last rotation
    const finalRotation = rotation + (randomFullRotations * 360) + randomStopAngle;

    setRotation(finalRotation); // Apply rotation

    // After the transition ends, set spinning to false and update winning number
    setTimeout(() => {
      setSpinning(false);
      setWinningNumber(newWinningNumber);
      setRecent((prevRecent) => [newWinningNumber, ...prevRecent].slice(0, 5)); // Keep last 5
    }, 5000); // Match CSS transition duration (e.g., 5s)
  };

  return (
    <div className="p-6  bg-gray-900 min-h-screen text-white font-roboto">
      <h2 className="text-3xl font-bold mb-6 text-center text-yellow-400">Spin Wheel Game</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Roulette Table */}
        <div className="bg-gray-800 rounded-lg p-6 flex flex-col items-center justify-between shadow-lg">
          {/* Wheel */}
          <div
            ref={wheelRef}
            className="w-40 h-40 rounded-full bg-black flex items-center justify-center relative"
            style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? 'transform 5s ease-out' : 'none' }}
          >
            {/* Red/Black Sections */}
            <div className="absolute w-full h-1/2 bg-red-600 top-0 left-0 rounded-t-full"></div>
            <div className="absolute w-full h-1/2 bg-black bottom-0 left-0 rounded-b-full"></div>
            {/* Zero Circle / Winning Number Display */}
            <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center font-bold text-black relative z-10 text-xl">
              {winningNumber !== null ? winningNumber : '0'}
            </div>
          </div>

          {/* Bet Options - Keeping static for now as per request focus */}
          <div className="grid grid-cols-3 gap-3 mt-8 w-full">
            <button className="bg-red-600 text-white font-bold py-2 px-4 rounded hover:bg-red-700 transition-colors">
              1-18
            </button>
            <button className="bg-black text-white font-bold py-2 px-4 rounded hover:bg-gray-900 transition-colors">
              EVEN
            </button>
            <button className="bg-red-600 text-white font-bold py-2 px-4 rounded hover:bg-red-700 transition-colors">
              RED
            </button>
            <button className="bg-red-600 text-white font-bold py-2 px-4 rounded hover:bg-red-700 transition-colors">
              ODD
            </button>
            <button className="bg-black text-white font-bold py-2 px-4 rounded hover:bg-gray-900 transition-colors">
              19-36
            </button>
            <button className="bg-black text-white font-bold py-2 px-4 rounded hover:bg-gray-900 transition-colors">
              BLACK
            </button>
          </div>

          {/* Spin Button */}
          <button
            onClick={spinWheel}
            disabled={spinning}
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold px-8 py-3 rounded-full mt-6 shadow-lg shadow-yellow-500/30 transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {spinning ? 'Spinning...' : 'Spin Wheel'}
          </button>
        </div>

        {/* Right - Rules & Recent Numbers */}
        <div className="bg-gray-800 text-white rounded-lg p-6 flex flex-col justify-between shadow-lg lg:col-span-1">
          <div>
            <h3 className="font-semibold text-xl mb-4 text-yellow-400">Roulette Rules</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>🟡 Bet on number, colors or ranges</li>
              <li>🟡 Minimum bet amount ₹50</li>
              <li>🟡 Number with lowest total bet wins</li>
              <li>🟡 Results every 15 minutes</li>
              <li>🟡 Payouts up to 35x</li>
            </ul>
          </div>

          {/* Recent Numbers */}
          <div className="mt-6 pt-4 border-t border-white/20">
            <h4 className="font-semibold text-xl  text-yellow-400">Recent Numbers</h4>
            <div className="flex flex-wrap gap-2">
              {recent.map((num, i) => (
                <span
                  key={i}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                    num === 0
                      ? "bg-yellow-400 text-black"
                      : num % 2 === 0
                      ? "bg-black text-white"
                      : "bg-red-600 text-white"
                  }`}
                >
                  {num}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
