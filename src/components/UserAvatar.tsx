import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { auth } from '../utils/firebase';
import {
  User,
  LogOut,
  Home,
  Settings as SettingsIcon,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface UserAvatarProps {
  onQuit?: () => void;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ onQuit }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
      toast.error('Failed to log out');
    }
  };

  if (!user) return null;

  return (
    <div className="absolute top-4 right-4 z-50">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-center focus:outline-none hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg"
      >
        {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
      </button>
      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-1 border border-gray-100">
          <button
            onClick={() => {
              setShowMenu(false);
              navigate('/');
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            Home
          </button>
          <button
            onClick={() => {
              setShowMenu(false);
              navigate('/profile');
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
          >
            <User className="w-4 h-4 mr-2" />
            View Profile
          </button>
          <button
            onClick={() => {
              setShowMenu(false);
              navigate('/settings');
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
          >
            <SettingsIcon className="w-4 h-4 mr-2" />
            Settings
          </button>
          {onQuit && (
            <button
              onClick={() => {
                setShowMenu(false);
                onQuit();
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <X className="w-4 h-4 mr-2" />
              Quit Game
            </button>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserAvatar;