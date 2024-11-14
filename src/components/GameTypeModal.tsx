import React from 'react';
import { Globe, Map, Compass } from 'lucide-react';

interface GameTypeModalProps {
  onSelect: (gameType: 'classic' | 'hiddenGems' | 'continent') => void;
}

const GameTypeModal: React.FC<GameTypeModalProps> = ({ onSelect }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-900">Select Game Type</h2>
        <div className="space-y-4">
          <button
            onClick={() => onSelect('classic')}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-4 rounded-lg flex items-center space-x-4 transition-all duration-200 transform hover:scale-[1.02]"
          >
            <Globe className="text-blue-100" size={28} />
            <div className="text-left">
              <h3 className="font-bold text-lg">Classic</h3>
              <p className="text-sm text-blue-100">Explore famous landmarks around the world</p>
            </div>
          </button>

          <button
            onClick={() => onSelect('hiddenGems')}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white p-4 rounded-lg flex items-center space-x-4 transition-all duration-200 transform hover:scale-[1.02]"
          >
            <Map className="text-emerald-100" size={28} />
            <div className="text-left">
              <h3 className="font-bold text-lg">Hidden Gems</h3>
              <p className="text-sm text-emerald-100">Discover lesser-known but fascinating locations</p>
            </div>
          </button>

          <button
            onClick={() => onSelect('continent')}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white p-4 rounded-lg flex items-center space-x-4 transition-all duration-200 transform hover:scale-[1.02]"
          >
            <Compass className="text-purple-100" size={28} />
            <div className="text-left">
              <h3 className="font-bold text-lg">Continent Challenge</h3>
              <p className="text-sm text-purple-100">Test your knowledge continent by continent</p>
            </div>
          </button>
        </div>

        <p className="mt-6 text-center text-gray-600 text-sm">
          Choose a game type to begin your globe-trotting adventure!
        </p>
      </div>
    </div>
  );
};

export default GameTypeModal;