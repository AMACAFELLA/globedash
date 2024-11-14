import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Globe,
  Users,
  Trophy,
  Settings,
  User,
  MapPin,
  Gamepad2,
  Sparkles,
} from 'lucide-react';
import MultiplayerModal from './MultiplayerModal';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const [showMultiplayerModal, setShowMultiplayerModal] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:3rem_3rem]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-8 animate-bounce">
              <Globe className="h-20 w-20 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
              Globe Dash
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-12">
              Navigate historical sites and popular locations around the world in
              this exciting geography exploration game!
            </p>

            {/* Main Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-16">
              <Link
                to="/game"
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-1 hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-[1.02]"
              >
                <div className="relative bg-black/5 rounded-xl px-8 py-6">
                  <div className="flex items-center justify-center space-x-4">
                    <Gamepad2 className="h-8 w-8 text-white" />
                    <span className="text-xl font-bold text-white">
                      Single Player
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-green-100">
                    Challenge the AI in a race around the globe
                  </p>
                </div>
              </Link>

              <button
                onClick={() => setShowMultiplayerModal(true)}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 p-1 hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-[1.02]"
              >
                <div className="relative bg-black/5 rounded-xl px-8 py-6">
                  <div className="flex items-center justify-center space-x-4">
                    <Users className="h-8 w-8 text-white" />
                    <span className="text-xl font-bold text-white">
                      Multiplayer
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-purple-100">
                    Compete with friends in real-time
                  </p>
                </div>
              </button>
            </div>

            {/* Secondary Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              <Link
                to="/leaderboard"
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/15 transition-all duration-200"
              >
                <Trophy className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
                <h3 className="text-white font-semibold">Leaderboard</h3>
                <p className="text-sm text-blue-100">View top players</p>
              </Link>

              <Link
                to="/profile"
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/15 transition-all duration-200"
              >
                <User className="h-6 w-6 text-blue-300 mx-auto mb-2" />
                <h3 className="text-white font-semibold">Profile</h3>
                <p className="text-sm text-blue-100">View your stats</p>
              </Link>

              <Link
                to="/settings"
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/15 transition-all duration-200"
              >
                <Settings className="h-6 w-6 text-gray-300 mx-auto mb-2" />
                <h3 className="text-white font-semibold">Settings</h3>
                <p className="text-sm text-blue-100">Customize your game</p>
              </Link>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <MapPin className="h-6 w-6 text-red-400 mx-auto mb-2" />
                <h3 className="text-white font-semibold">Locations</h3>
                <p className="text-sm text-blue-100">
                  {user ? '100+ landmarks' : 'Login to explore'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Globe className="h-6 w-6 text-purple-300" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  3D World Exploration
                </h3>
              </div>
              <p className="text-blue-100">
                Navigate through photorealistic 3D maps of famous landmarks and
                historical sites.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Sparkles className="h-6 w-6 text-green-300" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  AI Opponent
                </h3>
              </div>
              <p className="text-blue-100">
                Challenge our intelligent AI that adapts to your skill level
                for an engaging experience.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Trophy className="h-6 w-6 text-yellow-300" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Competitive Play
                </h3>
              </div>
              <p className="text-blue-100">
                Compete with friends or climb the global leaderboard to become
                the ultimate globe master.
              </p>
            </div>
          </div>
        </div>
      </div>

      {showMultiplayerModal && (
        <MultiplayerModal onClose={() => setShowMultiplayerModal(false)} />
      )}
    </div>
  );
};

export default Home;