import React, { useState, useEffect } from "react";
import { Globe, Sparkles } from "lucide-react";
// Props interface for LoadingSpinner component
interface LoadingSpinnerProps {
  message?: string;
}
// LoadingSpinner functional component
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = "Loading Globe Dash...",
}) => {
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(message);

  const loadingMessages = [
    { message: "Initializing Globe Dash...", duration: 10000 },
    { message: "Generating new locations...", duration: 15000 },
    { message: "Fetching location data...", duration: 15000 },
    { message: "Getting target information...", duration: 15000 },
    { message: "Quick dance break! 💃", duration: 15000 },
    { message: "Almost there...", duration: 15000 },
    { message: "Finalizing preparations...", duration: 15000 },
  ];

  useEffect(() => {
    let currentIndex = 0;
    let progressInterval: NodeJS.Timeout;
    let messageInterval: NodeJS.Timeout;

    // Progress bar animation
    progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 100);

    // Cycle through messages
    const cycleMessages = () => {
      if (currentIndex < loadingMessages.length) {
        setCurrentMessage(loadingMessages[currentIndex].message);
        messageInterval = setTimeout(() => {
          currentIndex++;
          cycleMessages();
        }, loadingMessages[currentIndex].duration);
      }
    };

    cycleMessages();

    return () => {
      clearInterval(progressInterval);
      clearTimeout(messageInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-500 to-blue-600 flex flex-col items-center justify-center">
      <div className="relative">
        <Globe size={64} className="text-white animate-bounce" />
        <Sparkles
          size={24}
          className="absolute -top-2 -right-2 text-yellow-300 animate-pulse"
        />
      </div>

      <div className="mt-8 w-64">
        <div className="relative h-2 bg-blue-300 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-white transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 text-right text-sm text-blue-100">{progress}%</div>
      </div>

      <h2 className="mt-4 text-2xl font-bold text-white animate-pulse">
        {currentMessage}
      </h2>

      <div className="mt-8 space-y-2 text-center">
        <p className="text-blue-100">Get ready to explore amazing locations!</p>
        <p className="text-sm text-blue-200 italic">
          This might take a moment if we're generating new locations...
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
