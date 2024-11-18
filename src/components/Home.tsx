import React from "react";
import { Link } from "react-router-dom";
import {
  Globe,
  Trophy,
  Settings,
  User,
  MapPin,
  Gamepad2,
  MapIcon,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
// Home component
const Home: React.FC = () => {
  const { user } = useAuth(); // Get user authentication status
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:3rem_3rem]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Globe Icon */}
            <div className="flex justify-center mb-8 animate-bounce">
              <Globe className="h-20 w-20 text-white" />
            </div>
            {/* Title and Description */}
            <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
              Globe Dash
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-12">
              Navigate historical sites and popular locations around the world
              in this exciting geography exploration game!
            </p>
            {/* Main Action Buttons */}
            <div className="max-w-4xl mx-auto mb-16">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
                <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
                  <div className="flex-shrink-0">
                    <Gamepad2 className="h-16 w-16 text-green-400 mx-auto" />
                  </div>
                  <div className="text-left flex-grow">
                    <h2 className="text-2xl font-bold text-white mb-3">
                      Single Player Mode
                    </h2>
                    <p className="text-blue-100 mb-4">
                      Embark on a solo journey to explore the world, test your
                      geography skills, and set personal records across diverse
                      and challenging locations.
                    </p>
                    <Link
                      to="/game"
                      className="inline-block bg-gradient-to-r from-green-500 to-emerald-600
                      text-white font-bold py-3 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700
                      transition-all duration-300 transform hover:scale-105"
                    >
                      {user ? "Play Now" : "Login"}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            {/* Secondary Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {/* Leaderboard Link */}
              <Link
                to="/leaderboard"
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/15 transition-all duration-200"
              >
                <Trophy className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
                <h3 className="text-white font-semibold">Leaderboard</h3>
                <p className="text-sm text-blue-100">View top players</p>
              </Link>
              {/* Profile Link */}
              <Link
                to="/profile"
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/15 transition-all duration-200"
              >
                <User className="h-6 w-6 text-blue-300 mx-auto mb-2" />
                <h3 className="text-white font-semibold">Profile</h3>
                <p className="text-sm text-blue-100">View your stats</p>
              </Link>
              {/* Settings Link */}
              <Link
                to="/settings"
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/15 transition-all duration-200"
              >
                <Settings className="h-6 w-6 text-gray-300 mx-auto mb-2" />
                <h3 className="text-white font-semibold">Settings</h3>
                <p className="text-sm text-blue-100">Customize your game</p>
              </Link>
              {/* Locations Section */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <MapPin className="h-6 w-6 text-red-400 mx-auto mb-2" />
                <h3 className="text-white font-semibold">Locations</h3>
                <p className="text-sm text-blue-100">
                  {user ? "100+ landmarks" : "Login to explore"}
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Features Section */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 3D World Exploration Feature */}
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
            {/* Location discovery Feature */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <MapIcon className="h-6 w-6 text-green-300" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Learn & Discover
                </h3>
              </div>
              <p className="text-blue-100">
                Learn and find hidden gems, popular attractactions all within a
                3d world to visit in the real world.
              </p>
            </div>
            {/* Competitive Play Feature */}
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
                Climb the global leaderboard to become the ultimate globe
                master.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Home;
