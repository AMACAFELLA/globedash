import React from "react";
import { Globe } from "lucide-react";
// Props interface for LoadingSpinner component
interface LoadingSpinnerProps {
  message?: string; // Optional message prop
}
// LoadingSpinner functional component
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = "Loading Globe Dash...",
}) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-500 to-blue-600 flex flex-col items-center justify-center">
      <div className="relative">
        <Globe size={64} className="text-white animate-bounce" />{" "}
        {/* Animated globe icon */}
      </div>
      <h2 className="mt-8 text-2xl font-bold text-white animate-pulse">
        {message} {/* Display loading message */}
      </h2>
      <p className="mt-2 text-blue-100">Get ready to explore the world!</p>{" "}
      {/* Subtext encouraging exploration */}
    </div>
  );
};
export default LoadingSpinner;
