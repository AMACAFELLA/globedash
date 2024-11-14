import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, where, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { LeaderboardEntry } from '../utils/firebaseUtils';
import { Trophy, Medal, Crown, ArrowLeft, Globe, Target, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';

interface ExtendedLeaderboardEntry extends LeaderboardEntry {
  difficulty: 'easy' | 'normal' | 'hard';
}

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<ExtendedLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [gameType, setGameType] = useState<'classic' | 'hiddenGems' | 'continent'>('classic');
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('easy');

  useEffect(() => {
    const leaderboardRef = collection(db, 'leaderboard');
    const q = query(
      leaderboardRef,
      where('gameType', '==', gameType),
      where('difficulty', '==', difficulty),
      orderBy('score', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // Create a Map to store unique entries by userId
        const uniqueEntries = new Map();
        
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          // Only add/update if this user's score is higher than what we have
          if (!uniqueEntries.has(data.userId) || uniqueEntries.get(data.userId).score < data.score) {
            uniqueEntries.set(data.userId, {
              userId: data.userId,
              username: data.username,
              score: data.score,
              gameType: data.gameType,
              difficulty: data.difficulty,
            });
          }
        });

        // Convert Map values to array and sort by score
        const newLeaderboard = Array.from(uniqueEntries.values())
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);

        setLeaderboard(newLeaderboard);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching leaderboard:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [gameType, difficulty]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 0:
        return <Crown className="text-yellow-500" size={24} />;
      case 1:
        return <Medal className="text-gray-400" size={24} />;
      case 2:
        return <Medal className="text-amber-600" size={24} />;
      default:
        return <Trophy className="text-blue-500 opacity-50" size={24} />;
    }
  };

  const getGameTypeIcon = () => {
    switch (gameType) {
      case 'classic':
        return <Trophy className="h-16 w-16 text-yellow-500" />;
      case 'hiddenGems':
        return <Star className="h-16 w-16 text-purple-500" />;
      case 'continent':
        return <Target className="h-16 w-16 text-green-500" />;
      default:
        return <Globe className="h-16 w-16 text-blue-500" />;
    }
  };

  const getDifficultyColor = (diff: 'easy' | 'normal' | 'hard') => {
    switch (diff) {
      case 'easy':
        return 'bg-green-500 hover:bg-green-600';
      case 'normal':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'hard':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-blue-600">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center mb-8">
          {getGameTypeIcon()}
          <h1 className="text-4xl font-bold text-white mb-2">Top Players</h1>
          <p className="text-blue-100">
            The best globe-trotters from around the world
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <Link
              to="/"
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back to Home</span>
            </Link>
          </div>
          
          <div className="p-6">
            <div className="space-y-6 mb-8">
              <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => setGameType('classic')}
                  className={`px-6 py-3 rounded-lg flex items-center justify-center space-x-2 ${
                    gameType === 'classic'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } transition-colors duration-200`}
                >
                  <Trophy size={20} />
                  <span>Classic</span>
                </button>
                <button
                  onClick={() => setGameType('hiddenGems')}
                  className={`px-6 py-3 rounded-lg flex items-center justify-center space-x-2 ${
                    gameType === 'hiddenGems'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } transition-colors duration-200`}
                >
                  <Star size={20} />
                  <span>Hidden Gems</span>
                </button>
                <button
                  onClick={() => setGameType('continent')}
                  className={`px-6 py-3 rounded-lg flex items-center justify-center space-x-2 ${
                    gameType === 'continent'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } transition-colors duration-200`}
                >
                  <Target size={20} />
                  <span>By Continent</span>
                </button>
              </div>

              <div className="flex justify-center space-x-4">
                {(['easy', 'normal', 'hard'] as const).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`px-6 py-3 rounded-lg text-white ${
                      difficulty === diff
                        ? getDifficultyColor(diff)
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } transition-colors duration-200`}
                  >
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              {leaderboard.map((entry, index) => (
                <div
                  key={`${entry.userId}_${entry.gameType}_${entry.difficulty}`}
                  className={`flex items-center justify-between p-6 rounded-xl ${
                    index === 0
                      ? 'bg-gradient-to-r from-yellow-50 to-yellow-100'
                      : index === 1
                      ? 'bg-gradient-to-r from-gray-50 to-gray-100'
                      : index === 2
                      ? 'bg-gradient-to-r from-amber-50 to-amber-100'
                      : 'bg-white hover:bg-gray-50'
                  } transition-colors duration-200 shadow-md`}
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        index === 0
                          ? 'bg-yellow-500'
                          : index === 1
                          ? 'bg-gray-400'
                          : index === 2
                          ? 'bg-amber-600'
                          : 'bg-blue-500 bg-opacity-50'
                      }`}
                    >
                      {getRankIcon(index)}
                    </div>
                    <div>
                      <p className={`font-bold text-lg ${
                        index === 0
                          ? 'text-yellow-900'
                          : index === 1
                          ? 'text-gray-900'
                          : index === 2
                          ? 'text-amber-900'
                          : 'text-gray-900'
                      }`}>
                        {entry.username}
                      </p>
                      <p className="text-sm text-gray-500">Rank #{index + 1}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div
                      className={`px-6 py-3 rounded-full ${
                        index === 0
                          ? 'bg-yellow-200 text-yellow-900'
                          : index === 1
                          ? 'bg-gray-200 text-gray-900'
                          : index === 2
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-blue-100 text-blue-900'
                      }`}
                    >
                      <span className="font-mono font-bold text-lg">
                        {entry.score.toLocaleString()}
                      </span>
                      <span className="ml-1 text-sm">points</span>
                    </div>
                  </div>
                </div>
              ))}

              {leaderboard.length === 0 && (
                <div className="text-center py-12">
                  <Trophy className="mx-auto mb-4 text-gray-400" size={48} />
                  <p className="text-lg text-gray-500 mb-6">
                    No scores yet for {gameType} ({difficulty}). Be the first to play!
                  </p>
                  <Link
                    to="/game"
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                  >
                    Start Playing
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;