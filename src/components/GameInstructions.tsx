import React from "react";
import { Info, MapPin, Timer, Trophy } from "lucide-react";
// Props interface for GameInstructions component
interface GameInstructionsProps {
  difficulty: "easy" | "normal" | "hard";
  onClose: () => void;
}
// GameInstructions functional component
const GameInstructions: React.FC<GameInstructionsProps> = ({
  difficulty,
  onClose,
}) => {
  // Difficulty settings for the game
  const difficultySettings = {
    easy: {
      time: "90 seconds",
      view: "Free camera movement with aerial views",
      special: "Full map navigation",
    },
    normal: {
      time: "60 seconds",
      view: "Street-level perspective",
      special: "Limited to ground-level navigation",
    },
    hard: {
      time: "45 seconds",
      view: "Restricted street-level view",
      special: "No map labels, limited movement",
    },
  };
  const settings = difficultySettings[difficulty]; // Get settings based on selected difficulty
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl shadow-xl max-w-lg w-full">
        <div className="flex items-center space-x-3 mb-6">
          <Info className="text-blue-500" size={28} />
          <h2 className="text-2xl font-bold">How to Play</h2>
        </div>
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-2">Game Settings</h3>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2">
                <Timer className="text-blue-500" size={20} />
                <span>Time Limit: {settings.time}</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="text-blue-500" size={20} />
                <span>View Type: {settings.view}</span>
              </li>
              <li className="flex items-center space-x-2">
                <Info className="text-blue-500" size={20} />
                <span>Special Rule: {settings.special}</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">Game Rules</h3>
            <ol className="list-decimal list-inside space-y-2">
              <li>You'll be shown a location for 30 seconds - remember it!</li>
              <li>After preview, you'll be placed somewhere in the world</li>
              <li>Use your mouse to navigate the map</li>
              <li>Navigate to the target location as fast as you can</li>
              <li>The faster you are, the more points you'll earn</li>
            </ol>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">Scoring</h3>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2">
                <Trophy className="text-yellow-500" size={20} />
                <span>Base Score: 1000 points</span>
              </li>
              <li>Time Bonus: Faster navigation earn bonus points</li>
            </ul>
          </div>
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
        >
          Got it, let's play!
        </button>
      </div>
    </div>
  );
};
export default GameInstructions;
