import React, { useState, useEffect, useCallback } from "react";
import { Music, Play, Pause } from "lucide-react";
import {
  getCurrentTrack,
  isAudioPlaying,
  toggleBackgroundMusic,
} from "../utils/audio";

const NowPlaying: React.FC = () => {
  const [showTrackInfo, setShowTrackInfo] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const checkPlayingStatus = () => {
      setPlaying(isAudioPlaying());
    };

    // Check initial status
    checkPlayingStatus();

    // Set up interval to check status
    const interval = setInterval(checkPlayingStatus, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleTrackChange = useCallback(() => {
    const track = getCurrentTrack();
    if (track) {
      setShowTrackInfo(true);
      const timeout = setTimeout(() => {
        setShowTrackInfo(false);
      }, 15000);
      return () => clearTimeout(timeout);
    }
  }, []);

  useEffect(() => {
    handleTrackChange();
  }, [handleTrackChange]);

  const handleClick = () => {
    try {
      toggleBackgroundMusic();
      setPlaying(!playing);
    } catch (error) {
      console.error("Error handling music toggle:", error);
    }
  };

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`
        flex items-center space-x-2 bg-white rounded-full shadow-lg
        transition-all duration-300 ease-in-out
        ${showTrackInfo ? "px-4 py-2" : "p-2"}
      `}
      >
        <button
          onClick={handleClick}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        >
          {isHovered ? (
            playing ? (
              <Pause size={18} />
            ) : (
              <Play size={18} />
            )
          ) : (
            <Music size={18} />
          )}
        </button>

        {showTrackInfo && (
          <div className="text-sm font-medium text-gray-700 animate-fade-in">
            Now Playing: {getCurrentTrack()?.title || "Loading..."}
          </div>
        )}
      </div>
    </div>
  );
};

export default NowPlaying;
