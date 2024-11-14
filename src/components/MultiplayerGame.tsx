import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import {
  subscribeToGameSession,
  updateGameSessionState,
  setPlayerReady,
  updatePlayerPosition,
  GameSession,
} from '../utils/firebaseUtils';
import { getGameDataByType, calculateScore, GameType, checkWinCondition, checkAchievements, Achievement } from '../utils/gameLogic';
import LoadingSpinner from './LoadingSpinner';
import UserAvatar from './UserAvatar';
import WaitingRoom from './WaitingRoom';
import DifficultyModal from './DifficultyModal';
import GameInstructions from './GameInstructions';
import QuitGameModal from './QuitGameModal';
import GameEndModal from './GameEndModal';
import GameStatus from './GameStatus';
import { Trophy, MapPin, AlertTriangle } from 'lucide-react';
import { playSoundEffect, playBackgroundMusic, stopBackgroundMusic } from '../utils/audio';
import seedrandom from 'seedrandom';

interface Map3DElement extends HTMLElement {
  center: { lat: number; lng: number; altitude: number };
  heading: number;
  tilt: number;
  range: number;
  bounds: { north: number; south: number; east: number; west: number };
  flyCameraTo: (options: any) => void;
  flyCameraAround: (options: any) => void;
  defaultLabelsDisabled: boolean;
}

interface Polygon3DElement extends HTMLElement {
  outerCoordinates: { lat: number; lng: number; altitude: number }[];
}

type GameState = 
  | 'waiting'
  | 'selectGameType'
  | 'selectDifficulty'
  | 'showInstructions'
  | 'preview'
  | 'playing'
  | 'round_end'
  | 'game_end';

const MultiplayerGame: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const mapRef = useRef<Map3DElement | null>(null);
  const polygonRef = useRef<Polygon3DElement | null>(null);
  const markerRef = useRef<HTMLElement | null>(null);
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [playerGuessed, setPlayerGuessed] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const [gameType, setGameType] = useState<GameType>('classic');
  const [hasSelectedDifficulty, setHasSelectedDifficulty] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [playerLeft, setPlayerLeft] = useState<string | null>(null);
  const [showPlayerLeftMessage, setShowPlayerLeftMessage] = useState(false);
  const [polygonCoordinates, setPolygonCoordinates] = useState<google.maps.LatLngLiteral[]>([]);
   const [roundScore, setRoundScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const getDifficultySettings = useCallback((diff: string, isPreview: boolean = false) => {
    if (isPreview) {
      return {
        time: 90,
        altitude: 1000,
        tilt: 45,
        range: 2000,
      };
    }

    const settings = {
      easy: { time: 90, altitude: 1000, tilt: 45, range: 2000 },
      normal: { time: 60, altitude: 100, tilt: 95, range: 50 },
      hard: { time: 45, altitude: 100, tilt: 95, range: 30 },
    };
    return settings[diff as keyof typeof settings] || settings.normal;
  }, []);

  const createPolygonAroundTarget = useCallback(
    (targetLocation: { lat: number; lng: number }) => {
      if (polygonRef.current) {
        const offset = 0.001;
        const coordinates = [
          {
            lat: targetLocation.lat + offset,
            lng: targetLocation.lng - offset,
            altitude: 100,
          },
          {
            lat: targetLocation.lat - offset,
            lng: targetLocation.lng - offset,
            altitude: 100,
          },
          {
            lat: targetLocation.lat - offset,
            lng: targetLocation.lng + offset,
            altitude: 100,
          },
          {
            lat: targetLocation.lat + offset,
            lng: targetLocation.lng + offset,
            altitude: 100,
          },
          {
            lat: targetLocation.lat + offset,
            lng: targetLocation.lng - offset,
            altitude: 100,
          },
        ];
        polygonRef.current.outerCoordinates = coordinates;
        setPolygonCoordinates(coordinates);
      }
    },
    []
  );

  const add3DMarker = useCallback((location: { lat: number; lng: number }) => {
    if (mapRef.current) {
      if (!markerRef.current) {
        const newMarker = document.createElement('gmp-model-3d');
        newMarker.setAttribute('src', '/models/pin.glb');
        newMarker.setAttribute('altitude-mode', 'relative-to-ground');
        newMarker.setAttribute('scale', '50');
        newMarker.setAttribute('orientation', '0,270,0');
        mapRef.current.appendChild(newMarker);
        markerRef.current = newMarker;
      }
      if (markerRef.current) {
        markerRef.current.setAttribute('position', `${location.lat},${location.lng},150`);
      }
    }
  }, []);

  const initMap = useCallback(() => {
    if (mapRef.current && window.google) {
      customElements.whenDefined('gmp-map-3d').then(() => {
        if (mapRef.current) {
          const settings = getDifficultySettings(difficulty, true);
          mapRef.current.center = {
            lat: 0,
            lng: 0,
            altitude: settings.altitude,
          };
          mapRef.current.heading = 0;
          mapRef.current.tilt = settings.tilt;
          mapRef.current.range = settings.range;
          mapRef.current.defaultLabelsDisabled = difficulty === 'hard';
        }
      });
    }
  }, [difficulty, getDifficultySettings]);

  const handleDifficultySelect = async (selectedDifficulty: 'easy' | 'normal' | 'hard') => {
    if (!sessionId || !isHost) return;
    
    setDifficulty(selectedDifficulty);
    setHasSelectedDifficulty(true);
    
    await updateGameSessionState(sessionId, {
      difficulty: selectedDifficulty,
    });
    
    setGameState('showInstructions');
    playSoundEffect('success', settings);
  };

  const handleInstructionsClose = () => {
    setGameState('waiting');
    playSoundEffect('click', settings);
  };

  const startNewRound = useCallback(async () => {
  if (!sessionId || !user?.uid || !gameSession) return;

  try {
    const gameData = await getGameDataByType(user.uid, gameType);
    const difficultySettings = getDifficultySettings(gameSession.difficulty || difficulty);

    // Show loading state for all players
    await updateGameSessionState(sessionId, {
      status: 'in_progress',
      currentRound: (gameSession.currentRound || 0) + 1,
      targetLocation: gameData.targetLocation,
      roundStartTime: Date.now(),
      gameState: 'preview',
      previewStartTime: Date.now(),
      isLoading: true // Add loading state
    });

    // Set up preview for all players
    if (mapRef.current && gameData.targetLocation) {
      createPolygonAroundTarget(gameData.targetLocation);
      add3DMarker(gameData.targetLocation);

      // Center map on target location for preview for all players
      mapRef.current.center = {
        lat: gameData.targetLocation.lat,
        lng: gameData.targetLocation.lng,
        altitude: 1000,
      };
      mapRef.current.tilt = 45;
      mapRef.current.heading = 0;

      // Synchronized camera animation for all players
      mapRef.current.flyCameraAround({
        camera: {
          center: {
            lat: gameData.targetLocation.lat,
            lng: gameData.targetLocation.lng,
            altitude: 1000,
          },
          heading: 0,
          tilt: 45,
          range: 2000,
        },
        durationMillis: 30000,
        rounds: 1,
      });

      // After preview, transition to playing state
      setTimeout(async () => {
        if (mapRef.current && gameData.targetLocation) {
          const seed = Date.now();
          const random = seedrandom(seed.toString());
          
          const startLat = gameData.targetLocation.lat + (random() * 20 - 10);
          const startLng = gameData.targetLocation.lng + (random() * 20 - 10);

          // Move camera to starting position
          mapRef.current.flyCameraTo({
            endCamera: {
              center: {
                lat: startLat,
                lng: startLng,
                altitude: difficultySettings.altitude,
              },
              heading: 0,
              tilt: difficultySettings.tilt,
              range: difficultySettings.range,
            },
            durationMillis: 3000,
          });

          // Update game state to playing and remove loading state
          await updateGameSessionState(sessionId, {
            gameState: 'playing',
            roundStartTime: Date.now(),
            startPosition: { lat: startLat, lng: startLng },
            isLoading: false
          });
        }
      }, 30000);
    }

    playBackgroundMusic(settings);
  } catch (error) {
    console.error('Error starting new round:', error);
    setError('Failed to start new round');
  }
}, [sessionId, user, gameSession, gameType, difficulty, settings, getDifficultySettings, createPolygonAroundTarget, add3DMarker]);

  const handleMapClick = useCallback(async (event: any) => {
  if (!sessionId || !user?.uid || !gameSession?.targetLocation || gameState !== 'playing' || playerGuessed) {
    return;
  }

  const clickedPosition = {
    lat: event.latLng.lat(),
    lng: event.latLng.lng(),
  };

  if (checkWinCondition(clickedPosition, polygonCoordinates)) {
    await updatePlayerPosition(sessionId, user.uid, clickedPosition);
    setPlayerGuessed(true);
    playSoundEffect('click', settings);

    const distance = google.maps.geometry.spherical.computeDistanceBetween(
      new google.maps.LatLng(clickedPosition),
      new google.maps.LatLng(gameSession.targetLocation.lat, gameSession.targetLocation.lng)
    );

    const newRoundScore = calculateScore(distance, timeLeft);
    setRoundScore(newRoundScore);
    setTotalScore(prev => prev + newRoundScore);

    await updateGameSessionState(sessionId, {
      [`players.${user.uid}.score`]: (gameSession.players[user.uid].score || 0) + newRoundScore,
      [`players.${user.uid}.lastGuess`]: {
        position: clickedPosition,
        score: newRoundScore,
        distance,
      },
    });

    const allPlayersGuessed = Object.values(gameSession.players).every(
      (player) => player.lastGuess
    );

    if (allPlayersGuessed && isHost) {
      await handleRoundEnd();
    }
  }
}, [sessionId, user, gameSession, gameState, playerGuessed, timeLeft, isHost, settings, polygonCoordinates]);


  const handleRoundEnd = async () => {
  if (!sessionId || !gameSession || !isHost) return;

  await updateGameSessionState(sessionId, {
    gameState: 'round_end',
  });

  playSoundEffect('timeUp', settings);
  stopBackgroundMusic();

  // Update games played
  setGamesPlayed(prev => prev + 1);

  // Update best time if applicable
  if (timeLeft > (bestTime || 0)) {
    setBestTime(timeLeft);
  }

  await new Promise((resolve) => setTimeout(resolve, 5000));

  if (gameSession.currentRound >= (gameSession.totalRounds || 5)) {
    await handleGameEnd();
  } else {
    await updateGameSessionState(sessionId, {
      ...Object.fromEntries(
        Object.keys(gameSession.players).map((playerId) => [
          `players.${playerId}.lastGuess`,
          null,
        ])
      ),
      ...Object.fromEntries(
        Object.keys(gameSession.players).map((playerId) => [
          `players.${playerId}.ready`,
          true,
        ])
      ),
    });
    
    await startNewRound();
  }
};

  const handleGameEnd = async () => {
if (!sessionId || !isHost) return;

// Check for achievements
const newAchievements = checkAchievements(
totalScore,
gamesPlayed + 1,
100, // accuracy (you might want to calculate this)
timeLeft,
[], // continentsExplored (if you're tracking this)
0 // hiddenGemsFound (if you're tracking this)
);

setAchievements(newAchievements);

await updateGameSessionState(sessionId, {
status: 'completed',
gameState: 'game_end',
});

playSoundEffect('success', settings);
stopBackgroundMusic();
};

  const handleStartGame = async () => {
    if (!sessionId || !isHost) return;
    
    if (!hasSelectedDifficulty) {
      setGameState('selectDifficulty');
    } else {
      await startNewRound();
    }
  };

  const handleReadyToggle = useCallback(async () => {
    if (!sessionId || !user?.uid || !gameSession) return;
    const currentReadyState = gameSession.players[user.uid]?.ready || false;
    await setPlayerReady(sessionId, user.uid, !currentReadyState);
    playSoundEffect('click', settings);
  }, [sessionId, user, gameSession, settings]);

  const handlePlayerLeave = useCallback(async () => {
    if (!sessionId || !user?.uid || !gameSession) return;
    try {
      const remainingPlayers = Object.values(gameSession.players).filter(
        (p) => p.id !== user.uid
      );
      const bonusPoints = 500;
      const updates: Record<string, any> = {
        status: remainingPlayers.length < 2 ? 'completed' : gameSession.status,
        playerLeft: user.uid,
      };
      
      updates[`players.${user.uid}`] = null;
      
      remainingPlayers.forEach((player) => {
        if (player.id) {
          updates[`players.${player.id}.score`] = (player.score || 0) + bonusPoints;
        }
      });

      await updateGameSessionState(sessionId, updates);
      navigate('/');
    } catch (error) {
      console.error('Error handling player leave:', error);
    }
  }, [sessionId, user, gameSession, navigate]);

  useEffect(() => {
    if (!sessionId || !user) {
      navigate('/');
      return;
    }

    const unsubscribe = subscribeToGameSession(sessionId, (session) => {
      if (session) {
        setGameSession(session);
        setIsLoading(false);
        setIsHost(session.host === user.uid);

        if (session.gameState && session.gameState !== gameState) {
          setGameState(session.gameState as GameState);
        }


        if (session.difficulty && !hasSelectedDifficulty) {
          setDifficulty(session.difficulty);
          setHasSelectedDifficulty(true);
          if (!isHost) {
            setGameState('showInstructions');
          }
        }

        if (session.gameState === 'playing') {
          setPlayerGuessed(!!session.players[user.uid]?.lastGuess);
          
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }

          const currentTime = Date.now();
          const elapsedTime = session.roundStartTime 
            ? Math.floor((currentTime - session.roundStartTime) / 1000)
            : 0;
          const settings = getDifficultySettings(session.difficulty || difficulty);
          const initialTimeLeft = Math.max(0, settings.time - elapsedTime);
          
          setTimeLeft(initialTimeLeft);

          timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
              if (prev <= 1) {
                if (timerRef.current) {
                  clearInterval(timerRef.current);
                }
                if (isHost) {
                  handleRoundEnd();
                }
                return 0;
              }
              return prev - 1;
            });
          }, 1000);

          if (mapRef.current && session.targetLocation) {
            const difficultySettings = getDifficultySettings(session.difficulty || difficulty);
            mapRef.current.center = {
              lat: session.targetLocation.lat,
              lng: session.targetLocation.lng,
              altitude: difficultySettings.altitude,
            };
            mapRef.current.tilt = difficultySettings.tilt;
            mapRef.current.range = difficultySettings.range;
          }
        }

        if (session.playerLeft) {
          setPlayerLeft(session.playerLeft);
          setShowPlayerLeftMessage(true);
          setTimeout(() => setShowPlayerLeftMessage(false), 5000);
        }
      }
    });

    return () => {
      unsubscribe();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      stopBackgroundMusic();
    };
  }, [sessionId, user, navigate, difficulty, hasSelectedDifficulty, isHost, getDifficultySettings, gameState]);

  useEffect(() => {
    if (window.google && window.google.maps) {
      initMap();
    } else {
      const checkGoogleMapsLoaded = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkGoogleMapsLoaded);
          initMap();
        }
      }, 100);

      return () => clearInterval(checkGoogleMapsLoaded);
    }
  }, [initMap]);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.addEventListener('click', handleMapClick);
    }
    return () => {
      if (mapRef.current) {
        mapRef.current.removeEventListener('click', handleMapClick);
      }
    };
  }, [handleMapClick]);

  useEffect(() => {
    return () => {
      if (markerRef.current && mapRef.current) {
        mapRef.current.removeChild(markerRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      </div>
    );
  }

  if (!gameSession) {
    return null;
  }

  if (gameState === 'selectDifficulty') {
    return <DifficultyModal onSelect={handleDifficultySelect} />;
  }

  if (gameState === 'showInstructions') {
    return (
      <GameInstructions
        difficulty={difficulty}
        onClose={handleInstructionsClose}
        isMultiplayer={true}
      />
    );
  }

  if (gameState === 'waiting') {
    return (
      <WaitingRoom
        session={gameSession}
        isHost={isHost}
        onStartGame={handleStartGame}
        onReadyToggle={handleReadyToggle}
      />
    );
  }

  return (
    <div className="relative h-screen">
      <UserAvatar onQuit={() => setShowQuitModal(true)} />

      {showQuitModal && (
        <QuitGameModal
          onConfirm={handlePlayerLeave}
          onCancel={() => setShowQuitModal(false)}
          isMultiplayer={true}
        />
      )}

      {showPlayerLeftMessage && playerLeft && gameSession.players[playerLeft] && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50 animate-fade-in">
          <div className="flex items-center">
            <AlertTriangle className="mr-2" />
            <span>
              <strong>{gameSession.players[playerLeft]?.username || 'Unknown'}</strong> has
              left the game. You've received a 500 point bonus!
            </span>
          </div>
        </div>
      )}

      <div className="absolute top-4 left-4 z-10">
        <GameStatus
          players={gameSession.players}
          timeLeft={timeLeft}
          currentRound={gameSession.currentRound}
          totalRounds={gameSession.totalRounds}
        />
      </div>

      <gmp-map-3d
        ref={mapRef as React.RefObject<HTMLElement>}
        className="w-full h-full"
      >
        <gmp-polygon-3d
          ref={polygonRef as React.RefObject<HTMLElement>}
          altitude-mode="relative-to-ground"
          fill-color="rgba(255, 0, 0, 0.5)"
          stroke-color="#0000ff"
          stroke-width="8"
          extruded
        ></gmp-polygon-3d>
      </gmp-map-3d>

      {gameState === 'preview' && gameSession.targetLocation && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white p-6 rounded-xl shadow-xl">
          <div className="flex items-center space-x-3 mb-4">
            <MapPin className="text-red-500" size={24} />
            <h2 className="text-xl font-bold">Target Location:</h2>
          </div>
          <p className="text-lg font-medium mb-2">
            {gameSession.targetLocation.name}
          </p>
          <p className="text-gray-600">
            {gameSession.targetLocation.description}
          </p>
        </div>
      )}

      {(gameState === 'round_end' || gameState === 'game_end') && (
        <GameEndModal
          gameState={gameState}
          roundScore={roundScore}
          totalScore={totalScore}
          bestTime={bestTime}
          gamesPlayed={gamesPlayed}
          achievements={achievements}
          onNextRound={startNewRound}
          onNewGame={() => setGameState('selectGameType')}
          onHome={() => navigate('/')}
        />
      )}
    </div>
  );
};

export default MultiplayerGame;