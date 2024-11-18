import { Howl } from "howler";
// Audio state management
let backgroundMusic: Howl | null = null;
let soundEffects: { [key: string]: Howl } = {};
let currentSettings = {
  volume: 0.7,
  soundEnabled: true,
  musicEnabled: true,
};

let activeSoundEffects: { [key: string]: Howl } = {};
let currentTrackIndex = 0;
let isPlaying = false;
// Sound effect file paths
const SOUND_URLS = {
  success: "/sounds/success.mp3",
  wrong: "/sounds/error.mp3",
  click: "/sounds/click.mp3",
  timeUp: "/sounds/timer-end.mp3",
};

// Background music playlist
export const MUSIC_PLAYLIST = [
  {
    url: "/sounds/background-music.mp3",
    title: "Adventure Awaits",
  },
];
// Utility functions for audio state
export const getCurrentTrack = () => MUSIC_PLAYLIST[currentTrackIndex];
export const isAudioPlaying = () => isPlaying;
// Error handling for audio loading
const handleAudioError = (name: string, error: any) => {
  console.error(`Error loading ${name}:`, error);
};

let audioInitialized = false;
// Play next track in playlist
const playNextTrack = () => {
  try {
    if (backgroundMusic) {
      backgroundMusic.unload();
    }

    currentTrackIndex = (currentTrackIndex + 1) % MUSIC_PLAYLIST.length;
    const track = MUSIC_PLAYLIST[currentTrackIndex];

    backgroundMusic = new Howl({
      src: [track.url],
      loop: false,
      volume: currentSettings.volume * (currentSettings.musicEnabled ? 1 : 0),
      html5: true,
      preload: true,
      onend: () => {
        playNextTrack();
      },
      onloaderror: () => {
        console.error("Error loading background music");
        playNextTrack(); // Try next track on error
      },
    });

    if (isPlaying) {
      backgroundMusic.play();
    }
  } catch (error) {
    console.error("Error in playNextTrack:", error);
  }
};
// Toggle background music playback
export const toggleBackgroundMusic = () => {
  try {
    if (backgroundMusic) {
      if (isPlaying) {
        backgroundMusic.pause();
      } else {
        backgroundMusic.play();
      }
      isPlaying = !isPlaying;
    }
  } catch (error) {
    console.error("Error toggling background music:", error);
  }
};
// Initialize audio system
export const initializeAudio = (settings: {
  volume: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
}) => {
  if (audioInitialized) return;

  try {
    currentSettings = settings;
    soundEffects = {};
    activeSoundEffects = {};

    const track = MUSIC_PLAYLIST[currentTrackIndex];
    backgroundMusic = new Howl({
      src: [track.url],
      loop: false,
      volume: settings.volume * (settings.musicEnabled ? 1 : 0),
      html5: true,
      preload: true,
      onend: () => {
        playNextTrack();
      },
      onloaderror: () => {
        console.error("Error loading initial background music");
      },
    });
    // Initialize sound effects
    const effects = ["success", "wrong", "click", "timeUp"] as const;
    effects.forEach((effect) => {
      soundEffects[effect] = new Howl({
        src: [SOUND_URLS[effect]],
        volume: settings.volume * (settings.soundEnabled ? 1 : 0),
        html5: true,
        preload: true,
        format: ["mp3"],
        onloaderror: (_id, error) => {
          handleAudioError(effect, error);
        },
      });
    });

    audioInitialized = true;
  } catch (error) {
    console.error("Error initializing audio:", error);
  }
};
// Update audio settings
export const updateAudioSettings = (settings: {
  volume: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
}) => {
  try {
    currentSettings = settings;

    if (backgroundMusic) {
      const musicVolume = settings.volume * (settings.musicEnabled ? 1 : 0);
      backgroundMusic.volume(musicVolume);
    }

    Object.entries(soundEffects).forEach(([_, sound]) => {
      const effectVolume = settings.volume * (settings.soundEnabled ? 1 : 0);
      sound.volume(effectVolume);
    });
  } catch (error) {
    console.error("Error updating audio settings:", error);
  }
};
// Play background music
export const playBackgroundMusic = (settings?: {
  volume: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
}) => {
  try {
    if (settings) {
      currentSettings = settings;
    }

    if (!audioInitialized) {
      initializeAudio(currentSettings);
    }

    if (backgroundMusic) {
      if (currentSettings.musicEnabled) {
        const volume = currentSettings.volume;
        backgroundMusic.volume(volume);
        if (!backgroundMusic.playing()) {
          backgroundMusic.play();
          isPlaying = true;
        }
      } else {
        stopBackgroundMusic();
      }
    }
  } catch (error) {
    console.error("Error playing background music:", error);
  }
};
// Stop background music
export const stopBackgroundMusic = () => {
  try {
    if (backgroundMusic) {
      backgroundMusic.pause();
      isPlaying = false;
    }
  } catch (error) {
    console.error("Error stopping background music:", error);
  }
};

export const playSoundEffect = (
  effect: keyof typeof soundEffects,
  settings?: {
    volume: number;
    soundEnabled: boolean;
    musicEnabled: boolean;
  },
) => {
  try {
    if (settings) {
      currentSettings = settings;
    }

    if (!audioInitialized) {
      initializeAudio(currentSettings);
      return null;
    }

    if (currentSettings.soundEnabled) {
      if (activeSoundEffects[effect]) {
        activeSoundEffects[effect].stop();
      }

      const sound = soundEffects[effect];
      const effectVolume = Math.min(currentSettings.volume * 1.5, 1);
      sound.volume(effectVolume);
      const soundId = sound.play();

      activeSoundEffects[effect] = sound;

      sound.once("end", () => {
        delete activeSoundEffects[effect];
      });

      return soundId;
    }
  } catch (error) {
    console.error("Error playing sound effect:", error);
  }

  return null;
};

export const stopAllSounds = () => {
  try {
    if (backgroundMusic) {
      backgroundMusic.stop();
      isPlaying = false;
    }

    Object.entries(activeSoundEffects).forEach(([_, sound]) => {
      sound.stop();
    });
    activeSoundEffects = {};
  } catch (error) {
    console.error("Error stopping all sounds:", error);
  }
};

export const stopSoundEffect = (effect: keyof typeof soundEffects) => {
  try {
    if (activeSoundEffects[effect]) {
      activeSoundEffects[effect].stop();
      delete activeSoundEffects[effect];
    }
  } catch (error) {
    console.error("Error stopping sound effect:", error);
  }
};

export const isSoundLoaded = (effect: keyof typeof soundEffects): boolean => {
  try {
    return soundEffects[effect]?.state() === "loaded" || false;
  } catch (error) {
    console.error("Error checking if sound is loaded:", error);
    return false;
  }
};

export const isBackgroundMusicLoaded = (): boolean => {
  try {
    return backgroundMusic?.state() === "loaded" || false;
  } catch (error) {
    console.error("Error checking if background music is loaded:", error);
    return false;
  }
};

export const getCurrentVolumes = () => {
  try {
    return {
      backgroundMusic: backgroundMusic?.volume() || 0,
      soundEffects: Object.fromEntries(
        Object.entries(soundEffects).map(([name, sound]) => [
          name,
          sound.volume(),
        ]),
      ),
    };
  } catch (error) {
    console.error("Error getting current volumes:", error);
    return {
      backgroundMusic: 0,
      soundEffects: {},
    };
  }
};
