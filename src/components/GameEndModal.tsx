import React, { useState } from "react";
import { Trophy, Star, Award, ArrowRight, Home, Loader2 } from "lucide-react";
import { Achievement } from "../utils/gameLogic";
// Props interface for GameEndModal
interface GameEndModalProps {
  gameState: "round_end" | "game_end";
  roundScore: number;
  totalScore: number;
  bestTime: number | null;
  gamesPlayed: number;
  achievements: Achievement[];
  onNextRound: () => Promise<void>;
  onNewGame: () => void;
  onHome: () => void;
}
// GameEndModal functional component
const GameEndModal: React.FC<GameEndModalProps> = ({
  gameState,
  roundScore,
  totalScore,
  bestTime,
  gamesPlayed,
  achievements,
  onNextRound,
  onNewGame,
  onHome,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  // Handle next round action
  const handleNextRound = async () => {
    setIsLoading(true);
    try {
      await onNextRound();
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <h2 className="text-3xl font-bold text-center">
            {gameState === "round_end" ? "Round Complete!" : "Game Over!"}
          </h2>
        </div>
        <div className="p-8">
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-4">
                <Trophy className="w-8 h-8 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {gameState === "round_end"
                  ? `${roundScore} Points`
                  : `Final Score: ${totalScore}`}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl text-center">
                <Star className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Games Played</p>
                <p className="text-lg font-bold text-gray-900">{gamesPlayed}</p>
              </div>
              {bestTime !== null && (
                <div className="bg-gray-50 p-4 rounded-xl text-center">
                  <Award className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Best Time</p>
                  <p className="text-lg font-bold text-gray-900">{bestTime}s</p>
                </div>
              )}
            </div>
            {achievements.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-lg text-gray-900">
                  Achievements Unlocked
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="flex items-center space-x-2 bg-gradient-to-r from-yellow-50 to-orange-50 p-3 rounded-lg"
                    >
                      <span className="text-2xl">{achievement.icon}</span>
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          {achievement.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {achievement.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-4 mt-6">
              {gameState === "round_end" ? (
                <button
                  onClick={handleNextRound}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Next Round
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={onNewGame}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200"
                >
                  New Game
                  <ArrowRight size={20} />
                </button>
              )}
              <button
                onClick={onHome}
                className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl transition-colors duration-200"
              >
                <Home size={20} />
                Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default GameEndModal;
