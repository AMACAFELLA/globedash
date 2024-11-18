import React from "react";
import { AlertTriangle } from "lucide-react";
// Props interface for QuitGameModal component
interface QuitGameModalProps {
  onConfirm: () => void; // Callback for confirming quit action
  onCancel: () => void; // Callback for canceling quit action
  onBeforeQuit?: () => Promise<void>; // Optional callback to run before quitting
}
// QuitGameModal functional component
const QuitGameModal: React.FC<QuitGameModalProps> = ({
  onConfirm,
  onCancel,
  onBeforeQuit,
}) => {
  // Handle quit action
  const handleQuit = async () => {
    if (onBeforeQuit) {
      await onBeforeQuit(); // Call optional callback if provided
    }
    onConfirm(); // Call confirm callback
  };
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center space-x-3 mb-6">
          <AlertTriangle className="text-red-500" size={28} />{" "}
          {/* Warning icon */}
          <h2 className="text-2xl font-bold text-red-600">Quit Game?</h2>{" "}
          {/* Title */}
        </div>
        <div className="mb-6 space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-semibold mb-2">Warning:</p>
            <ul className="list-disc list-inside text-red-600 space-y-1">
              <li>Your current game progress will be saved</li>
              <li>
                Your score will be recorded if it's higher than your previous
                best
              </li>
              <li>You'll need to start a new game to play again</li>
            </ul>
          </div>
        </div>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel} // Call cancel callback
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
          >
            Keep Playing {/* Button text */}
          </button>
          <button
            onClick={handleQuit} // Handle quit action
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
          >
            Quit Game {/* Button text */}
          </button>
        </div>
      </div>
    </div>
  );
};
export default QuitGameModal;
