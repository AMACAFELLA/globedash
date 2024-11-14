import React from 'react';
import { Users, Play, Crown } from 'lucide-react';
import { GameSession } from '../utils/firebaseUtils';
import { useAuth } from '../contexts/AuthContext';
import { setPlayerReady } from '../utils/firebaseUtils';

interface WaitingRoomProps {
  session: GameSession;
  isHost: boolean;
  onStartGame: () => void;
  onReadyToggle: () => void;
}

const WaitingRoom: React.FC<WaitingRoomProps> = ({
  session,
  isHost,
  onStartGame,
  onReadyToggle,
}) => {
  const { user } = useAuth();
  const players = Object.values(session.players).filter(Boolean);
  const allPlayersReady = players.every((player) => player.ready);
  const enoughPlayers = players.length >= 2;
  const canStartGame = isHost && allPlayersReady && enoughPlayers;

  const handleReadyToggle = async () => {
    if (!user?.uid) return;
    const currentReadyState = session.players[user.uid]?.ready || false;
    await setPlayerReady(session.id, user.uid, !currentReadyState);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Waiting Room</h1>
          {!session.isQuickPlay && session.shareCode && (
            <p className="text-gray-600">
              Share code: <span className="font-mono font-bold">{session.shareCode}</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <Users className="text-blue-500" size={24} />
              <h2 className="text-xl font-bold text-gray-900">Players</h2>
            </div>
            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between bg-gray-50 p-4 rounded-xl"
                >
                  <div className="flex items-center space-x-3">
                    {session.host === player.id && (
                      <Crown className="text-yellow-500" size={20} />
                    )}
                    <span className="font-medium">{player.username}</span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      player.ready
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {player.ready ? 'Ready' : 'Not Ready'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <Users className="text-blue-500" size={24} />
              <h2 className="text-xl font-bold text-gray-900">Game Settings</h2>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Game Type:</span>
                <span className="font-medium capitalize">
                  {session.gameType || 'Classic'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Difficulty:</span>
                <span className="font-medium capitalize">
                  {session.difficulty || 'Normal'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mode:</span>
                <span className="font-medium">
                  {session.isQuickPlay ? 'Quick Play' : 'Custom Game'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Players:</span>
                <span className="font-medium">
                  {players.length}/{session.maxPlayers || 2}
                </span>
              </div>
            </div>
          </div>
        </div>

        {isHost ? (
          <div className="space-y-4">
            <button
              onClick={handleReadyToggle}
              className={`w-full py-3 px-6 rounded-xl font-bold text-white transition-colors duration-200 ${
                session.players[user?.uid || '']?.ready
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {session.players[user?.uid || '']?.ready ? 'Cancel Ready' : 'Ready Up'}
            </button>
            
            <button
              onClick={onStartGame}
              disabled={!canStartGame}
              className={`w-full flex items-center justify-center space-x-2 py-3 px-6 rounded-xl font-bold text-white transition-colors duration-200 ${
                canStartGame
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              <Play size={20} />
              <span>Start Game</span>
            </button>
          </div>
        ) : (
          <button
            onClick={handleReadyToggle}
            className={`w-full py-3 px-6 rounded-xl font-bold text-white transition-colors duration-200 ${
              session.players[user?.uid || '']?.ready
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {session.players[user?.uid || '']?.ready ? 'Cancel Ready' : 'Ready Up'}
          </button>
        )}

        {!enoughPlayers && (
          <p className="mt-4 text-center text-sm text-gray-500">
            Waiting for more players to join...
          </p>
        )}
        {enoughPlayers && !allPlayersReady && (
          <p className="mt-4 text-center text-sm text-gray-500">
            Waiting for all players to be ready...
          </p>
        )}
      </div>
    </div>
  );
};

export default WaitingRoom;