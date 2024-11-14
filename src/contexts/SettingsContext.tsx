import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeAudio, updateAudioSettings } from '../utils/audio';

interface Settings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  highContrastMode: boolean;
  colorblindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
  volume: number;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  soundEnabled: true,
  musicEnabled: true,
  highContrastMode: false,
  colorblindMode: 'none',
  volume: 0.7,
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<Settings>(() => {
    const savedSettings = localStorage.getItem('gameSettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('gameSettings', JSON.stringify(settings));

    // Initialize audio system with current settings
    initializeAudio(settings);

    // Apply accessibility classes to root element
    const root = document.documentElement;
    
    // Handle high contrast mode
    if (settings.highContrastMode) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Handle colorblind modes
    root.classList.remove('protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia');
    if (settings.colorblindMode !== 'none') {
      root.classList.add(settings.colorblindMode);
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => {
      const updatedSettings = { ...prev, ...newSettings };
      
      if (
        'volume' in newSettings ||
        'soundEnabled' in newSettings ||
        'musicEnabled' in newSettings
      ) {
        updateAudioSettings(updatedSettings);
      }

      return updatedSettings;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};