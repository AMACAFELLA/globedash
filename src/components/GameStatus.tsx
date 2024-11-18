import React from "react";
import { Users, Trophy } from "lucide-react";
import GameTimer from "./GameTimer";
// Props interface for the GameStatus component
interface GameStatusProps {
  user: any;
  score: number;
  timeLeft: number;
  currentRound?: number;
  totalRounds?: number;
}
/**
 * GameStatus Component
 * Displays the current game status including user info, score, and timer
 */
const GameStatus: React.FC<GameStatusProps> = ({
  user,
  score,
  timeLeft,
  currentRound,
  totalRounds,
}) => {
  return (
    <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-lg max-w-sm border border-gray-100">
      <div className="flex items-center space-x-3 mb-6">
        <Users className="text-blue-500" size={24} />
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
          Game Status
        </h2>
      </div>
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                {user.displayName?.[0].toUpperCase() || "U"}
              </div>
              <div>
                <span className="font-medium text-gray-700">
                  {user.displayName}
                </span>
                <div className="flex items-center mt-1">
                  <Trophy className="text-yellow-500 mr-1" size={16} />
                  <span className="font-bold text-gray-900">{score}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {currentRound !== undefined && totalRounds !== undefined && (
          <div className="mt-4 flex justify-between items-center">
            <span className="text-gray-600">Round</span>
            <span className="font-bold">
              {currentRound}/{totalRounds}
            </span>
          </div>
        )}
        <GameTimer initialTime={90} timeLeft={timeLeft} />
      </div>
    </div>
  );
};

export default GameStatus;
