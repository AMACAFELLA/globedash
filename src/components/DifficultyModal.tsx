import React from 'react';
import { MapPin, Shield, Swords } from 'lucide-react';

interface DifficultyModalProps {
  onSelect: (difficulty: 'easy' | 'normal' | 'hard') => void;
}

const DifficultyModal: React.FC<DifficultyModalProps> = ({ onSelect }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-center">Select Difficulty</h2>
        <div className="space-y-4">
          <button
            onClick={() => onSelect('easy')}
            className="w-full bg-green-100 hover:bg-green-200 p-4 rounded-lg flex items-center space-x-4 transition-colors"
          >
            <Shield className="text-green-600" size={24} />
            <div className="text-left">
              <h3 className="font-bold text-green-800">Easy</h3>
              <p className="text-sm text-green-600">Free camera movement, 90s timer</p>
            </div>
          </button>

          <button
            onClick={() => onSelect('normal')}
            className="w-full bg-blue-100 hover:bg-blue-200 p-4 rounded-lg flex items-center space-x-4 transition-colors"
          >
            <MapPin className="text-blue-600" size={24} />
            <div className="text-left">
              <h3 className="font-bold text-blue-800">Normal</h3>
              <p className="text-sm text-blue-600">Street-level view, 60s timer</p>
            </div>
          </button>

          <button
            onClick={() => onSelect('hard')}
            className="w-full bg-red-100 hover:bg-red-200 p-4 rounded-lg flex items-center space-x-4 transition-colors"
          >
            <Swords className="text-red-600" size={24} />
            <div className="text-left">
              <h3 className="font-bold text-red-800">Hard</h3>
              <p className="text-sm text-red-600">Limited view, 45s timer</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DifficultyModal;