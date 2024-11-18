import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { auth } from "../utils/firebase";
import { User, LogOut, Home, Settings as SettingsIcon, X } from "lucide-react";
import toast from "react-hot-toast";
// Interface for UserAvatar component props
interface UserAvatarProps {
  onQuit?: () => void; // Optional callback for quitting the game
}
// UserAvatar component for displaying user options
const UserAvatar: React.FC<UserAvatarProps> = ({ onQuit }) => {
  const { user } = useAuth(); // Get user from authentication context
  const navigate = useNavigate(); // Hook for navigation
  const [showMenu, setShowMenu] = useState(false); // State for menu visibility
  // Handle user logout
  const handleLogout = async () => {
    try {
      await auth.signOut(); // Sign out from Firebase
      toast.success("Logged out successfully"); // Show success message
      navigate("/login"); // Redirect to login page
    } catch (error) {
      console.error("Failed to log out", error); // Log error
      toast.error("Failed to log out"); // Show error message
    }
  };
  // Return null if no user is authenticated
  if (!user) return null;
  return (
    <div className="absolute top-4 right-4 z-50">
      {/* Button to toggle menu visibility */}
      <button
        onClick={() => setShowMenu(!showMenu)} // Toggle the menu
        className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-center focus:outline-none hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg"
      >
        {user.displayName ? user.displayName[0].toUpperCase() : "U"}{" "}
        {/* Display user's first initial */}
      </button>
      {/* Dropdown menu for user options */}
      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-1 border border-gray-100">
          {/* Home navigation button */}
          <button
            onClick={() => {
              setShowMenu(false); // Close the menu
              navigate("/"); // Navigate to home
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
          >
            <Home className="w-4 h-4 mr-2" /> {/* Home icon */}
            Home
          </button>
          {/* View Profile button */}
          <button
            onClick={() => {
              setShowMenu(false); // Close the menu
              navigate("/profile"); // Navigate to user profile
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
          >
            <User className="w-4 h-4 mr-2" /> {/* User icon */}
            View Profile
          </button>
          {/* Settings button */}
          <button
            onClick={() => {
              setShowMenu(false); // Close the menu
              navigate("/settings"); // Navigate to settings
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
          >
            <SettingsIcon className="w-4 h-4 mr-2" /> {/* Settings icon */}
            Settings
          </button>
          {/* Quit Game button (if onQuit callback is provided) */}
          {onQuit && (
            <button
              onClick={() => {
                setShowMenu(false); // Close the menu
                onQuit(); // Execute quit callback
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <X className="w-4 h-4 mr-2" /> {/* Quit icon */}
              Quit Game
            </button>
          )}
          {/* Logout button */}
          <button
            onClick={handleLogout} // Handle logout action
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" /> {/* Logout icon */}
            Logout
          </button>
        </div>
      )}
    </div>
  );
};
export default UserAvatar;
