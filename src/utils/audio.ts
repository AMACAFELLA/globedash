import { Howl } from 'howler';

let backgroundMusic: Howl | null = null;
let soundEffects: { [key: string]: Howl } = {};
let currentSettings = {
  volume: 0.7,
  soundEnabled: true,
  musicEnabled: true,
};

// Keep track of currently playing sounds
let activeSoundEffects: { [key: string]: Howl } = {};

// Sound URLs - using src/sounds directory
const SOUND_URLS = {
  success: '/src/sounds/success.mp3',
  wrong: '/src/sounds/error.mp3',
  click: '/src/sounds/click.mp3',
  timeUp: '/src/sounds/timer-end.mp3',
  backgroundMusic: '/src/sounds/background-music.mp3',
};

// Helper function to handle audio loading errors
const handleAudioError = (name: string, error: any) => {
  console.error(`Error loading ${name}:`, error);
  // Try alternative loading method
  const audio = new Audio(SOUND_URLS[name as keyof typeof SOUND_URLS]);
  audio.addEventListener('error', (e) => {
    console.error(`Alternative loading failed for ${name}:`, e);
  });
};

let audioInitialized = false;

export const initializeAudio = (settings: {
  volume: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
}) => {
  if (audioInitialized) return;

  const initAudio = () => {
    currentSettings = settings;

    // Stop and unload any existing sounds
    if (backgroundMusic) {
      backgroundMusic.stop();
      backgroundMusic.unload();
    }

    Object.values(soundEffects).forEach((sound) => {
      sound.stop();
      sound.unload();
    });

    // Clear existing sound effects
    soundEffects = {};
    activeSoundEffects = {};

    // Initialize new background music with better error handling
    backgroundMusic = new Howl({
      src: [SOUND_URLS.backgroundMusic],
      loop: true,
      volume: settings.volume * (settings.musicEnabled ? 1 : 0),
      html5: true, // Changed to true for better compatibility
      preload: true,
      format: ['mp3'],
      onload: () => {
        console.log('Background music loaded successfully');
      },
      onloaderror: (_id, error) => {
        handleAudioError('backgroundMusic', error);
      },
      onplay: () => {
        console.log('Background music started playing');
      },
      onstop: () => {
        console.log('Background music stopped');
      },
    });

    // Initialize new sound effects
    const effects = ['success', 'wrong', 'click', 'timeUp'] as const;
    effects.forEach((effect) => {
      soundEffects[effect] = new Howl({
        src: [SOUND_URLS[effect]],
        volume: settings.volume * (settings.soundEnabled ? 1 : 0),
        html5: true, // Changed to true for better compatibility
        preload: true,
        format: ['mp3'],
        onload: () => {
          console.log(`${effect} sound loaded successfully`);
        },
        onloaderror: (_id, error) => {
          handleAudioError(effect, error);
        },
        onplay: () => {
          console.log(`${effect} sound started playing`);
        },
        onend: () => {
          console.log(`${effect} sound finished playing`);
        },
      });
    });

    // Verify audio files exist
    Object.entries(SOUND_URLS).forEach(([name, path]) => {
      fetch(path)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          console.log(`${name} file exists and is accessible`);
        })
        .catch((error) => {
          console.error(`Cannot access ${name} file:`, error);
        });
    });

    audioInitialized = true;
  };

  // Initialize audio only after user interaction
  if (document.readyState !== 'loading') {
    document.body.addEventListener('click', initAudio, { once: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.addEventListener('click', initAudio, { once: true });
    });
  }
};

export const updateAudioSettings = (settings: {
  volume: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
}) => {
  currentSettings = settings;

  if (backgroundMusic) {
    const musicVolume = settings.volume * (settings.musicEnabled ? 1 : 0);
    backgroundMusic.volume(musicVolume);
    console.log('Updated background music volume:', musicVolume);
  }

  Object.entries(soundEffects).forEach(([name, sound]) => {
    const effectVolume = settings.volume * (settings.soundEnabled ? 1 : 0);
    sound.volume(effectVolume);
    console.log(`Updated ${name} sound volume:`, effectVolume);
  });
};

export const playBackgroundMusic = (settings?: {
  volume: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
}) => {
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
        console.log('Playing background music with volume:', volume);
      }
    } else {
      stopBackgroundMusic();
    }
  }
};

export const stopBackgroundMusic = () => {
  if (backgroundMusic) {
    backgroundMusic.stop();
    console.log('Stopped background music');
  }
};

export const playSoundEffect = (
  effect: keyof typeof soundEffects,
  settings?: {
    volume: number;
    soundEnabled: boolean;
    musicEnabled: boolean;
  }
) => {
  if (settings) {
    currentSettings = settings;
  }

  if (!audioInitialized) {
    initializeAudio(currentSettings);
    return null; // Return early as audio isn't ready yet
  }

  if (currentSettings.soundEnabled) {
    // Stop the previous instance of this sound effect if it's playing
    if (activeSoundEffects[effect]) {
      activeSoundEffects[effect].stop();
    }

    // Play the new sound effect
    const sound = soundEffects[effect];
    const effectVolume = Math.min(currentSettings.volume * 1.5, 1);
    sound.volume(effectVolume);
    console.log(`Playing ${effect} sound with volume:`, effectVolume);
    const soundId = sound.play();

    // Store the playing instance
    activeSoundEffects[effect] = sound;

    // Remove from active sounds when finished
    sound.once('end', () => {
      delete activeSoundEffects[effect];
      console.log(`${effect} sound finished playing`);
    });

    return soundId;
  }

  return null;
};

export const stopAllSounds = () => {
  // Stop background music
  if (backgroundMusic) {
    backgroundMusic.stop();
  }

  // Stop all active sound effects
  Object.entries(activeSoundEffects).forEach(([name, sound]) => {
    sound.stop();
    console.log(`Stopped ${name} sound`);
  });
  activeSoundEffects = {};
};

export const stopSoundEffect = (effect: keyof typeof soundEffects) => {
  if (activeSoundEffects[effect]) {
    activeSoundEffects[effect].stop();
    delete activeSoundEffects[effect];
    console.log(`Stopped ${effect} sound`);
  }
};

export const isSoundLoaded = (effect: keyof typeof soundEffects): boolean => {
  return soundEffects[effect]?.state() === 'loaded' || false;
};

export const isBackgroundMusicLoaded = (): boolean => {
  return backgroundMusic?.state() === 'loaded' || false;
};

export const getCurrentVolumes = () => {
  return {
    backgroundMusic: backgroundMusic?.volume() || 0,
    soundEffects: Object.fromEntries(
      Object.entries(soundEffects).map(([name, sound]) => [
        name,
        sound.volume(),
      ])
    ),
  };
};