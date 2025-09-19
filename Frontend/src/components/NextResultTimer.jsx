import { useEffect, useState } from "react";

export default function NextResultTimer() {
  // Countdown state
  const [time, setTime] = useState({ hours: 1, minutes: 54, seconds: 41 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prev) => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) seconds--;
        else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        }
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (  
    <div className="bg-gradient-to-r mt-10 from-[#042346]                      to-[#1d2d44] text-white rounded-lg p-6 flex justify-between items-center">
      {/* Left Side - Countdown */}
      <div>
        <h3 className="font-semibold mb-2">Next Result Countdown</h3>
        <div className="flex space-x-6 text-center">
          <div>
            <p className="text-2xl font-bold">{String(time.hours).padStart(2, "0")}</p>
            <span className="text-xs">Hours</span>
          </div>
          <div>
            <p className="text-2xl font-bold">{String(time.minutes).padStart(2, "0")}</p>
            <span className="text-xs">Minutes</span>
          </div>
          <div>
            <p className="text-2xl font-bold">{String(time.seconds).padStart(2, "0")}</p>
            <span className="text-xs">Seconds</span>
          </div>
        </div>
      </div>

      {/* Right Side - Jackpot */}
      <div className="text-right">
        <h3 className="font-semibold">Current Jackpot</h3>
        <p className="text-2xl font-bold text-[#d4af37]">₹1,24,850</p>
        <p className="text-xs text-gray-300">Last Winner: Rajesh K. (₹52,000)</p>
      </div>
    </div>
  );
}
