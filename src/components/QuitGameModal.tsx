import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface QuitGameModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  isMultiplayer?: boolean;
}

const QuitGameModal: React.FC<QuitGameModalProps> = ({
  onConfirm,
  onCancel,
  isMultiplayer = false,
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center space-x-3 mb-6">
          <AlertTriangle className="text-red-500" size={28} />
          <h2 className="text-2xl font-bold text-red-600">Quit Game?</h2>
        </div>
        
        <div className="mb-6 space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-semibold mb-2">Warning:</p>
            <ul className="list-disc list-inside text-red-600 space-y-1">
              <li>All progress in the current game will be lost</li>
              <li>Your current round score will not be saved</li>
              {isMultiplayer ? (
                <>
                  <li>Other players will receive bonus points</li>
                  <li>The game will end for all players</li>
                  <li>This action cannot be undone</li>
                </>
              ) : (
                <li>You'll need to start a new game to play again</li>
              )}
            </ul>
          </div>
          
          {isMultiplayer && (
            <p className="text-gray-600">
              Please be considerate of other players and only quit if absolutely necessary.
            </p>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
          >
            Keep Playing
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
          >
            Quit Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuitGameModal;