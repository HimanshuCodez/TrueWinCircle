export default function FixNumber() {
  const games = [
    {
      name: "Gali",
      time: "12:30 PM",
      lastResult: 78,
      mostBets: { number: 89, amount: "₹12,450" },
      leastBets: { number: 23, amount: "₹850" },
    },
    {
      name: "Disawar",
      time: "1:00 PM",
      lastResult: 35,
      mostBets: { number: 67, amount: "₹9,800" },
      leastBets: { number: 12, amount: "₹1,200" },
    },
    {
      name: "Dhan Kuber",
      time: "3:00 PM",
      lastResult: 14,
      currentLowest: { number: 14, amount: "₹3,100" },
      yourBets: 0,
    },
  ];

  return (
    <div className="px-8 py-6">
      {/* Section Title */}
      <h2 className="text-xl font-bold mb-2">Fixed Number Result Games</h2>
      <hr className="mb-6" />

      {/* Game Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {games.map((game, idx) => (
          <div
            key={idx}
            className="border rounded-lg shadow-sm overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#042346] text-white px-4 py-2 font-bold rounded-t-lg flex justify-between items-center">
              <span>{game.name}</span>
              <span className="text-xs font-normal">
                Next result: {game.time}
              </span>
            </div>

            {/* Body */}
            <div className="p-4 space-y-2 text-sm">
              <p>
                Last Result:{" "}
                <span className="font-bold text-lg">{game.lastResult}</span>
              </p>
              {game.mostBets && (
                <p>
                  Most Bets:{" "}
                  <span className="font-bold text-[#042346]">
                    {game.mostBets.number} ({game.mostBets.amount})
                  </span>
                </p>
              )}
              {game.leastBets && (
                <p>
                  Least Bets:{" "}
                  <span className="font-bold text-[#042346]">
                    {game.leastBets.number} ({game.leastBets.amount})
                  </span>
                </p>
              )}
              {game.currentLowest && (
                <p>
                  Current Lowest:{" "}
                  <span className="font-bold text-[#042346]">
                    {game.currentLowest.number} ({game.currentLowest.amount})
                  </span>
                </p>
              )}
              {game.yourBets !== undefined && (
                <p>
                  Your Bets:{" "}
                  <span className="font-bold text-[#042346]">
                    {game.yourBets}
                  </span>
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 pb-4">
              <button className="w-full bg-[#d4af37] text-black font-semibold py-2 rounded hover:bg-[#c19d2c]">
                Place Bet
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
