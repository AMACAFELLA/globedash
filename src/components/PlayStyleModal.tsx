import React from 'react';
import { Plane, Mouse } from 'lucide-react';

interface PlayStyleModalProps {
  onSelect: (style: 'plane' | 'mouse') => void;
}

const PlayStyleModal: React.FC<PlayStyleModalProps> = ({ onSelect }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-900">Choose Your Style</h2>
        <div className="space-y-4">
          <button
            onClick={() => onSelect('plane')}
            className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white p-6 rounded-lg flex items-center space-x-4 transition-all duration-200 transform hover:scale-[1.02] group"
          >
            <div className="bg-sky-400/20 p-3 rounded-lg group-hover:bg-sky-400/30 transition-colors">
              <Plane className="text-sky-100 transform -rotate-90" size={32} />
            </div>
            <div className="text-left flex-1">
              <h3 className="font-bold text-xl">3D Plane Mode</h3>
              <p className="text-sm text-sky-100">Fly through the map in an immersive 3D experience</p>
              <div className="mt-2 bg-sky-400/20 rounded-lg p-2 text-xs text-sky-100">
                <p>Controls:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>W/A/S/D or Arrow Keys to move</li>
                  <li>Left Click to accelerate</li>
                  <li>Right Click to descend</li>
                  <li>Mouse to look around</li>
                </ul>
              </div>
            </div>
          </button>

          <button
            onClick={() => onSelect('mouse')}
            className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white p-6 rounded-lg flex items-center space-x-4 transition-all duration-200 transform hover:scale-[1.02] group"
          >
            <div className="bg-indigo-400/20 p-3 rounded-lg group-hover:bg-indigo-400/30 transition-colors">
              <Mouse className="text-indigo-100" size={32} />
            </div>
            <div className="text-left flex-1">
              <h3 className="font-bold text-xl">Classic Mouse Mode</h3>
              <p className="text-sm text-indigo-100">Navigate traditionally with your mouse</p>
              <div className="mt-2 bg-indigo-400/20 rounded-lg p-2 text-xs text-indigo-100">
                <p>Controls:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Click and drag to move around</li>
                  <li>Scroll to zoom in/out</li>
                  <li>Double click to select location</li>
                </ul>
              </div>
            </div>
          </button>
        </div>

        <p className="mt-6 text-center text-gray-600 text-sm">
          Choose your preferred way to explore the world!
        </p>
      </div>
    </div>
  );
};

export default PlayStyleModal;