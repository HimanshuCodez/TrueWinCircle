import { useEffect, useState } from "react";
import { db } from '../firebase'; // Import db from firebase.js
import { doc, getDoc } from 'firebase/firestore'; // Import Firestore functions

export default function NextResultTimer() {
  // Countdown state
  const [time, setTime] = useState({ hours: 1, minutes: 54, seconds: 41 });
  // Jackpot state
  const [currentJackpot, setCurrentJackpot] = useState("Loading...");
  const [lastWinner, setLastWinner] = useState("Loading...");
  const [jackpotLoading, setJackpotLoading] = useState(true);

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

  useEffect(() => {
    const fetchJackpotInfo = async () => {
      try {
        const jackpotRef = doc(db, 'settings', 'jackpot');
        const docSnap = await getDoc(jackpotRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCurrentJackpot(data.currentJackpot || "N/A");
          setLastWinner(data.lastWinner || "N/A");
        } else {
          console.log("No jackpot document found in Firestore.");
          setCurrentJackpot("N/A");
          setLastWinner("N/A");
        }
      } catch (error) {
        console.error("Error fetching jackpot info:", error);
        setCurrentJackpot("Error");
        setLastWinner("Error");
      } finally {
        setJackpotLoading(false);
      }
    };

    fetchJackpotInfo();
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
        {jackpotLoading ? (
          <p className="text-2xl font-bold text-[#d4af37]">Loading...</p>
        ) : (
          <>
            <p className="text-2xl font-bold text-[#d4af37]">₹{currentJackpot}</p>
            <p className="text-xs text-gray-300">Last Winner: {lastWinner}</p>
          </>
        )}
      </div>
    </div>
  );
}
