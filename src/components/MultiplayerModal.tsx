import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  createGameSession,
  findAvailableSession,
  joinGameSession,
  findGameByShareCode,
} from '../utils/firebaseUtils';
import LoadingSpinner from './LoadingSpinner';
import { Users, UserPlus, Zap, Link as LinkIcon } from 'lucide-react';
import DifficultyModal from './DifficultyModal';
import GameTypeModal from './GameTypeModal';

interface MultiplayerModalProps {
  onClose: () => void;
}

const MultiplayerModal: React.FC<MultiplayerModalProps> = ({ onClose }) => {
  const [gameMode, setGameMode] = useState<'quickplay' | 'create' | 'join' | null>(null);
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [shareCode, setShareCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [showGameTypeModal, setShowGameTypeModal] = useState(false);
  const [selectedGameType, setSelectedGameType] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [createdGameInfo, setCreatedGameInfo] = useState<{
    sessionId: string;
    shareCode: string;
  } | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleQuickPlay = async (difficulty: 'easy' | 'normal' | 'hard') => {
    if (!user?.uid || !user?.displayName || !selectedGameType) {
      setError('Please log in to play multiplayer');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Find an available session with matching difficulty and game type
      const availableSessionId = await findAvailableSession(difficulty, selectedGameType);

      if (availableSessionId) {
        // Join existing session
        await joinGameSession(availableSessionId, user.uid, user.displayName);
        navigate(`/multiplayer/${availableSessionId}`);
      } else {
        // Create new session if none available
        const { sessionId } = await createGameSession(
          user.uid,
          user.displayName,
          2,
          difficulty,
          selectedGameType,
          true // isQuickPlay flag
        );
        navigate(`/multiplayer/${sessionId}`);
      }
    } catch (err) {
      console.error('Quick play error:', err);
      setError('Unable to start multiplayer game. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGame = async (difficulty: 'easy' | 'normal' | 'hard') => {
    if (!user?.uid || !user?.displayName || !selectedGameType) {
      setError('Please log in to create a game');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await createGameSession(
        user.uid,
        user.displayName,
        maxPlayers,
        difficulty,
        selectedGameType,
        false // not quickPlay
      );
      setCreatedGameInfo(result);
    } catch (err) {
      console.error('Create game error:', err);
      setError('Unable to create game. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !user?.displayName) {
      setError('Please log in to join a game');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const sessionId = await findGameByShareCode(shareCode);
      if (!sessionId) {
        setError('Game not found or already started');
        return;
      }

      await joinGameSession(sessionId, user.uid, user.displayName);
      navigate(`/multiplayer/${sessionId}`);
    } catch (err) {
      console.error('Join game error:', err);
      setError('Unable to join game. Please check the code and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGameTypeSelect = (gameType: 'classic' | 'hiddenGems' | 'continent') => {
    setSelectedGameType(gameType);
    setShowGameTypeModal(false);
    setShowDifficultyModal(true);
  };

  const handleQuickPlayClick = () => {
    setGameMode('quickplay');
    setShowGameTypeModal(true);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-xl shadow-xl">
          <LoadingSpinner />
          <p className="mt-4 text-center text-gray-700">
            Setting up your game session...
          </p>
        </div>
      </div>
    );
  }

  if (showGameTypeModal) {
    return <GameTypeModal onSelect={handleGameTypeSelect} />;
  }

  if (showDifficultyModal) {
    return (
      <DifficultyModal
        onSelect={(difficulty) => {
          setShowDifficultyModal(false);
          if (gameMode === 'quickplay') {
            handleQuickPlay(difficulty);
          } else {
            handleCreateGame(difficulty);
          }
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full">
        <h2 className="text-3xl font-bold mb-6 text-gray-900">
          Multiplayer Game
        </h2>
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {createdGameInfo ? (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Share Code:</h3>
              <div className="flex items-center space-x-2">
                <code className="bg-white px-3 py-2 rounded border flex-1 text-lg font-mono">
                  {createdGameInfo.shareCode}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(createdGameInfo.shareCode)}
                  className="p-2 hover:bg-blue-100 rounded"
                >
                  <LinkIcon size={20} className="text-blue-600" />
                </button>
              </div>
              <p className="text-sm text-blue-700 mt-2">
                Share this code with your friends to join your game
              </p>
            </div>
            <button
              onClick={() => navigate(`/multiplayer/${createdGameInfo.sessionId}`)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg"
            >
              Continue to Game
            </button>
          </div>
        ) : !gameMode ? (
          <div className="space-y-4">
            <button
              onClick={handleQuickPlayClick}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-lg flex items-center justify-center space-x-3 transition-all duration-200 transform hover:scale-[1.02]"
            >
              <Zap size={24} />
              <span>Quick Play (2 Players)</span>
            </button>
            <button
              onClick={() => {
                setGameMode('create');
                setShowGameTypeModal(true);
              }}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-lg flex items-center justify-center space-x-3 transition-all duration-200 transform hover:scale-[1.02]"
            >
              <UserPlus size={24} />
              <span>Create Custom Game</span>
            </button>
            <button
              onClick={() => setGameMode('join')}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-lg flex items-center justify-center space-x-3 transition-all duration-200 transform hover:scale-[1.02]"
            >
              <Users size={24} />
              <span>Join with Code</span>
            </button>
          </div>
        ) : gameMode === 'join' ? (
          <form onSubmit={handleJoinGame} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Share Code
              </label>
              <input
                type="text"
                value={shareCode}
                onChange={(e) => setShareCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-digit code"
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3 px-4"
                maxLength={6}
                pattern="[A-Z0-9]{6}"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-lg flex items-center justify-center space-x-3 transition-all duration-200 transform hover:scale-[1.02]"
            >
              <Users size={24} />
              <span>Join Game</span>
            </button>
          </form>
        ) : null}

        {gameMode && !createdGameInfo && !showDifficultyModal && !showGameTypeModal && (
          <button
            onClick={() => setGameMode(null)}
            className="mt-6 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Back
          </button>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default MultiplayerModal;