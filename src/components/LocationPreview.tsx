import React from "react";
import { MapPin, Clock, Info } from "lucide-react";
import type { GameData } from "../utils/gameLogic";
// Props interface for LocationPreview component
interface LocationPreviewProps {
  gameData: GameData; // Game data containing location and other details
  timeLimit: number; // Time limit for the location preview
}
// LocationPreview functional component
const LocationPreview: React.FC<LocationPreviewProps> = ({
  gameData,
  timeLimit,
}) => {
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl max-w-3xl w-full mx-4 border border-gray-100">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-red-50 p-2 rounded-lg">
            <MapPin className="text-red-500" size={24} /> {/* Location icon */}
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            Target Location {/* Title for target location */}
          </h2>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
            <Clock className="text-blue-500" size={20} /> {/* Timer icon */}
            <span className="font-semibold text-blue-700">
              {timeLimit}s
            </span>{" "}
            {/* Display time limit */}
          </div>
        </div>
      </div>
      {/* Location Details */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {gameData.targetLocation.name} {/* Target location name */}
        </h3>
        <p className="text-gray-600 leading-relaxed">
          {gameData.targetLocation.description}{" "}
          {/* Target location description */}
        </p>
      </div>
      {/* Info Cards */}
      {gameData.locationInfo && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Historical Significance Card */}
          <div className="bg-gray-50 p-4 rounded-xl">
            <div className="flex items-center space-x-2 mb-3">
              <Info className="text-gray-600" size={20} /> {/* Info icon */}
              <h4 className="font-semibold text-gray-800">
                Historical Significance
              </h4>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              {gameData.locationInfo.historicalSignificance}{" "}
              {/* Historical significance text */}
            </p>
          </div>
          {/* Cultural Significance Card */}
          <div className="bg-gray-50 p-4 rounded-xl">
            <div className="flex items-center space-x-2 mb-3">
              <Info className="text-gray-600" size={20} /> {/* Info icon */}
              <h4 className="font-semibold text-gray-800">
                Cultural Significance
              </h4>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              {gameData.locationInfo.culturalSignificance}{" "}
              {/* Cultural significance text */}
            </p>
          </div>
        </div>
      )}
      {/* Fun Facts Section */}
      {gameData.locationInfo?.facts &&
        gameData.locationInfo.facts.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center space-x-2 mb-3">
              <div className="bg-purple-50 p-2 rounded-lg">
                <Info className="text-purple-500" size={20} />{" "}
                {/* Fun facts icon */}
              </div>
              <h4 className="font-semibold text-gray-800">Fun Facts</h4>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {gameData.locationInfo.facts.map((fact, index) => (
                <li
                  key={index}
                  className="flex items-start space-x-2 text-sm text-gray-600"
                >
                  <span className="text-purple-500 mt-1">•</span>
                  <span>{fact}</span> {/* Display each fun fact */}
                </li>
              ))}
            </ul>
          </div>
        )}
      {/* Preview Timer Section */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <p className="text-center text-sm text-gray-500">
          Preview ends in <span className="font-semibold">30 seconds</span>{" "}
          {/* Countdown message */}
        </p>
      </div>
    </div>
  );
};
export default LocationPreview;
