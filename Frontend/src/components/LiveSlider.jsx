export default function LiveBettingHighlights() {
  return (
    <div className="bg-white rounded-xl mt-14 mb-14 shadow p-4 overflow-hidden">
      <h3 className="font-semibold text-[#0a2342] mb-2">
        Live Betting Highlights
      </h3>

      {/* Marquee Container */}
      <div className="relative w-full mt-2 overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee">
          {/* Block 1 */}
          <div className="flex items-center space-x-6 px-4">
            <span>🔥 Best bets on: <b>23</b> (₹850)</span>
            <span className="bg-[#0a2342] text-white px-3 py-1 rounded-full text-sm">
              1-12 Win
            </span>
            <span>Top number: <b>7</b> (₹8,200)</span>
            <span className="bg-[#0a2342] text-white px-3 py-1 rounded-full text-sm">
              Dhan Kuber
            </span>
            <span>Current lowest: <b>14</b> (₹3,100)</span>
          </div>

          {/* Block 2 (duplicate for smooth infinite loop) */}
          <div className="flex items-center space-x-6 px-4">
            <span>🔥 Best bets on: <b>23</b> (₹850)</span>
            <span className="bg-[#0a2342] text-white px-3 py-1 rounded-full text-sm">
              1-12 Win
            </span>
            <span>Top number: <b>7</b> (₹8,200)</span>
            <span className="bg-[#0a2342] text-white px-3 py-1 rounded-full text-sm">
              Dhan Kuber
            </span>
            <span>Current lowest: <b>14</b> (₹3,100)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
