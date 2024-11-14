import React, { useEffect, useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useNavigate } from 'react-router-dom';
import {
  Volume2,
  Music,
  Eye,
  ArrowLeft,
  Palette,
  Globe,
  Play,
  Square,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  playSoundEffect,
  playBackgroundMusic,
  stopBackgroundMusic,
  getCurrentVolumes,
  isSoundLoaded,
  isBackgroundMusicLoaded,
} from '../utils/audio';

const colorblindOptions = [
  { value: 'none', label: 'None' },
  { value: 'protanopia', label: 'Protanopia (Red-Blind)' },
  { value: 'deuteranopia', label: 'Deuteranopia (Green-Blind)' },
  { value: 'tritanopia', label: 'Tritanopia (Blue-Blind)' },
  { value: 'achromatopsia', label: 'Achromatopsia (Total Color Blindness)' },
] as const;

const Settings: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const navigate = useNavigate();
  const [isTestingMusic, setIsTestingMusic] = useState(false);
  const [volumes, setVolumes] = useState(getCurrentVolumes());

  // Play test sound when opening settings
  useEffect(() => {
    if (settings.soundEnabled) {
      playSoundEffect('click', settings);
    }
    return () => {
      stopBackgroundMusic();
      setIsTestingMusic(false);
    };
  }, []);

  // Update volume display periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setVolumes(getCurrentVolumes());
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleVolumeChange = (value: number) => {
    const newSettings = { ...settings, volume: value };
    updateSettings(newSettings);
  };

  const toggleSetting = (key: keyof typeof settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    updateSettings(newSettings);

    if (key === 'soundEnabled' && newSettings.soundEnabled) {
      playSoundEffect('success', newSettings);
    } else if (key === 'musicEnabled') {
      if (newSettings.musicEnabled) {
        setIsTestingMusic(true);
        playBackgroundMusic(newSettings);
      } else {
        setIsTestingMusic(false);
        stopBackgroundMusic();
      }
    }

    toast.success(
      `${key
        .replace(/([A-Z])/g, ' $1')
        .toLowerCase()
        .trim()} ${settings[key] ? 'disabled' : 'enabled'}`
    );
  };

  const toggleBooleanSetting = (key: 'soundEnabled' | 'musicEnabled' | 'highContrastMode') => {
    const newSettings = { ...settings, [key]: !settings[key] };
    updateSettings(newSettings);

    if (key === 'soundEnabled' && newSettings.soundEnabled) {
      playSoundEffect('success', newSettings);
    } else if (key === 'musicEnabled') {
      if (newSettings.musicEnabled) {
        setIsTestingMusic(true);
        playBackgroundMusic(newSettings);
      } else {
        setIsTestingMusic(false);
        stopBackgroundMusic();
      }
    }

    toast.success(
      `${key
        .replace(/([A-Z])/g, ' $1')
        .toLowerCase()
        .trim()} ${settings[key] ? 'disabled' : 'enabled'}`
    );
  };

  const handleColorblindChange = (mode: typeof settings.colorblindMode) => {
    updateSettings({ colorblindMode: mode });
    toast.success(`Color blind mode changed to ${mode}`);
  };

  const toggleTestMusic = () => {
    if (isTestingMusic) {
      stopBackgroundMusic();
      setIsTestingMusic(false);
    } else {
      playBackgroundMusic(settings);
      setIsTestingMusic(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-blue-600">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center mb-8">
          <Globe className="h-16 w-16 text-white mb-4" />
          <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
          <p className="text-blue-100">Customize your gaming experience</p>
        </div>

        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>
          </div>

          <div className="p-6 space-y-8">
            {/* Sound Settings */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Volume2 className="mr-2 text-blue-500" />
                Sound Settings
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Volume2 className="text-blue-500" />
                    <div>
                      <span className="block">Sound Effects</span>
                      <span className="text-sm text-gray-500">
                        Game sounds and alerts
                      </span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.soundEnabled}
                      onChange={() => toggleSetting('soundEnabled')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Music className="text-blue-500" />
                    <div>
                      <span className="block">Background Music</span>
                      <span className="text-sm text-gray-500">
                        Game background music
                      </span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.musicEnabled}
                      onChange={() => toggleSetting('musicEnabled')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Master Volume
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={settings.volume}
                      onChange={(e) =>
                        handleVolumeChange(parseFloat(e.target.value))
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>0%</span>
                      <span>{Math.round(settings.volume * 100)}%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      Current Volumes:
                    </p>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        Background Music:{' '}
                        {Math.round(volumes.backgroundMusic * 100)}%
                      </p>
                      {Object.entries(volumes.soundEffects).map(
                        ([name, volume]) => (
                          <p key={name}>
                            {name}: {Math.round(volume * 100)}%
                          </p>
                        )
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => playSoundEffect('click', settings)}
                        className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold py-2 px-4 rounded transition-colors"
                        disabled={!isSoundLoaded('click')}
                      >
                        Test Sound
                      </button>
                      <button
                        onClick={toggleTestMusic}
                        className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold py-2 px-4 rounded transition-colors flex items-center justify-center space-x-2"
                        disabled={!isBackgroundMusicLoaded()}
                      >
                        {isTestingMusic ? (
                          <>
                            <Square size={16} />
                            <span>Stop Music</span>
                          </>
                        ) : (
                          <>
                            <Play size={16} />
                            <span>Test Music</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="text-sm text-gray-500">
                      {!isSoundLoaded('click') && (
                        <p>Loading sound effects...</p>
                      )}
                      {!isBackgroundMusicLoaded() && (
                        <p>Loading background music...</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Accessibility Settings */}
            <div className="p-6 space-y-8">
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Eye className="mr-2 text-blue-500" />
                Accessibility
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Eye className="text-blue-500" />
                    <div>
                      <span className="block">High Contrast Mode</span>
                      <span className="text-sm text-gray-500">
                        Enhanced visual clarity with stronger contrasts
                      </span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.highContrastMode}
                      onChange={() => toggleBooleanSetting('highContrastMode')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3 mb-4">
                    <Palette className="text-blue-500" />
                    <div>
                      <span className="block">Color Blind Mode</span>
                      <span className="text-sm text-gray-500">
                        Choose a color vision deficiency filter
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {colorblindOptions.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center space-x-3 p-2 rounded hover:bg-gray-100 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="colorblind"
                          value={option.value}
                          checked={settings.colorblindMode === option.value}
                          onChange={() => handleColorblindChange(option.value)}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;