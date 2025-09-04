import React, { useState } from "react";

const HarufGrid = () => {
  const [selected, setSelected] = useState(null);

  return (
    <div className="flex flex-col items-center p-4">
      {/* Numbers Grid */}
      <p>Andar Haruf Bahar Haruf</p>

      <div className="grid grid-cols-10 gap-2">
        {Array.from({ length: 100 }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            onClick={() => setSelected(num)}
            className={`w-10 h-10 flex items-center justify-center rounded-md text-white font-medium
              ${selected === num ? "bg-green-500" : "bg-red-500 hover:bg-red-600"}
            `}
          >
            {num}
          </button>
        ))}
      </div>

      {/* Andar / Haruf Buttons */}
      <div className="flex gap-4 mt-6">
        <button className="px-6 py-2 bg-blue-500 text-white rounded-xl shadow hover:bg-blue-600">
          Andar
        </button>
        <button className="px-6 py-2 bg-purple-500 text-white rounded-xl shadow hover:bg-purple-600">
          Haruf
        </button>
      </div>

      {/* Show Selected */}
      {selected && (
        <p className="mt-4 text-lg font-semibold">
          Selected Number: <span className="text-green-600">{selected}</span>
        </p>
      )}
    </div>
  );
};

export default HarufGrid;
