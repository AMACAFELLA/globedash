import React, { createContext, useContext, useState, useEffect } from "react";
import { initializeAudio, updateAudioSettings } from "../utils/audio"; // Audio utilities
// Define settings structure
interface Settings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  highContrastMode: boolean;
  colorblindMode:
    | "none"
    | "protanopia"
    | "deuteranopia"
    | "tritanopia"
    | "achromatopsia";
  volume: number;
}
// Context type for settings
interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}
// Default settings configuration
const defaultSettings: Settings = {
  soundEnabled: true,
  musicEnabled: true,
  highContrastMode: false,
  colorblindMode: "none",
  volume: 0.7,
};
// Create settings context
const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
});
// Custom hook to access settings
export const useSettings = () => useContext(SettingsContext);
// Settings provider component
export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Initialize settings from localStorage or use defaults
  const [settings, setSettings] = useState<Settings>(() => {
    const savedSettings = localStorage.getItem("gameSettings");
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });
  // Effect to save settings and apply accessibility features
  useEffect(() => {
    localStorage.setItem("gameSettings", JSON.stringify(settings));
    initializeAudio(settings); // Initialize audio system
    const root = document.documentElement;

    // Toggle high contrast mode
    if (settings.highContrastMode) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }
    // Apply colorblind mode
    root.classList.remove(
      "protanopia",
      "deuteranopia",
      "tritanopia",
      "achromatopsia",
    );
    if (settings.colorblindMode !== "none") {
      root.classList.add(settings.colorblindMode);
    }
  }, [settings]);
  // Function to update settings
  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => {
      const updatedSettings = { ...prev, ...newSettings };

      // Update audio settings if relevant properties change
      if (
        "volume" in newSettings ||
        "soundEnabled" in newSettings ||
        "musicEnabled" in newSettings
      ) {
        updateAudioSettings(updatedSettings);
      }
      return updatedSettings;
    });
  };
  // Provide settings context to children
  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
