import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";
// Props interface for GameTimer component
interface GameTimerProps {
  initialTime: number;
  timeLeft: number;
}
// GameTimer functional component
const GameTimer: React.FC<GameTimerProps> = ({ initialTime, timeLeft }) => {
  const [progress, setProgress] = useState(100); // Progress percentage of the timer
  // Update progress when timeLeft changes
  useEffect(() => {
    setProgress((timeLeft / initialTime) * 100);
  }, [timeLeft, initialTime]);
  // Determine the color of the timer based on progress
  const getTimerColor = () => {
    if (progress > 66) return "bg-green-500";
    if (progress > 33) return "bg-yellow-500";
    return "bg-red-500";
  };
  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="text-blue-500" size={20} />
        <span className="text-xl font-bold text-gray-800">{timeLeft}s</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${getTimerColor()}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
export default GameTimer;
