import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useScore } from "../hooks/useScore";
import { useSettings } from "../contexts/SettingsContext";
import {
  getGameDataByType,
  calculateScore,
  checkWinCondition,
  GameData,
  GameType,
  checkAchievements,
  Achievement,
} from "../utils/gameLogic";
import GameInstructions from "./GameInstructions";
import DifficultyModal from "./DifficultyModal";
import GameTypeModal from "./GameTypeModal";
import {
  playBackgroundMusic,
  playSoundEffect,
  stopBackgroundMusic,
} from "../utils/audio";
import ErrorBoundary from "./ErrorBoundary";
import logger from "../utils/logger";
import UserAvatar from "./UserAvatar";
import { Trophy, Info } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";
import QuitGameModal from "./QuitGameModal";
import toast from "react-hot-toast";
import {
  doc,
  updateDoc,
  setDoc,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "../utils/firebase";
import GameEndModal from "./GameEndModal";
import GameStatus from "./GameStatus";
import LocationPreview from "./LocationPreview";
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
const Game: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useSettings();
  const { score, updateScore, saveCurrentScore } = useScore();
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [gameState, setGameState] = useState<
    | "loading"
    | "selectGameType"
    | "selectDifficulty"
    | "showInstructions"
    | "preview"
    | "playing"
    | "round_end"
    | "game_end"
  >("loading");
  const mapRef = useRef<Map3DElement | null>(null);
  const polygonRef = useRef<Polygon3DElement | null>(null);
  const [timeLeft, setTimeLeft] = useState(90);
  const [roundScore, setRoundScore] = useState(0);
  const playerPositionRef = useRef<google.maps.LatLngLiteral | null>(null);
  const currentTimeout = useRef<NodeJS.Timeout | null>(null);
  const [polygonCoordinates, setPolygonCoordinates] = useState<
    google.maps.LatLngLiteral[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<"easy" | "normal" | "hard">(
    "easy",
  );
  const [gameType, setGameType] = useState<GameType>("classic");
  const [hasSelectedDifficulty, setHasSelectedDifficulty] = useState(false);
  const markerRef = useRef<HTMLElement | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [isQuitting, setIsQuitting] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const getDifficultySettings = (
    diff: "easy" | "normal" | "hard",
    isPreview: boolean = false,
  ) => {
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
    return settings[diff];
  };
  const createPolygonAroundTarget = useCallback(
    (targetLocation: { lat: number; lng: number }) => {
      if (polygonRef.current) {
        const offset = 0.001;
        const coordinates = [
          {
            lat: targetLocation.lat + offset,
            lng: targetLocation.lng - offset,
            altitude: 300,
          },
          {
            lat: targetLocation.lat - offset,
            lng: targetLocation.lng - offset,
            altitude: 300,
          },
          {
            lat: targetLocation.lat - offset,
            lng: targetLocation.lng + offset,
            altitude: 300,
          },
          {
            lat: targetLocation.lat + offset,
            lng: targetLocation.lng + offset,
            altitude: 300,
          },
          {
            lat: targetLocation.lat + offset,
            lng: targetLocation.lng - offset,
            altitude: 300,
          },
        ];
        polygonRef.current.outerCoordinates = coordinates;
        setPolygonCoordinates(coordinates);
        // Initially hide polygon for normal and hard modes
        if (difficulty === "hard" || difficulty === "normal") {
          polygonRef.current.style.display = "none";
        } else {
          polygonRef.current.style.display = "block";
        }
      }
    },
    [difficulty],
  );
  const add3DMarker = useCallback(
    (location: { lat: number; lng: number }) => {
      if (mapRef.current) {
        if (!markerRef.current) {
          const newMarker = document.createElement("gmp-model-3d");
          newMarker.setAttribute("src", "/models/pin.glb");
          newMarker.setAttribute("altitude-mode", "relative-to-ground");
          newMarker.setAttribute("scale", "50");
          newMarker.setAttribute("orientation", "0,270,0");
          mapRef.current.appendChild(newMarker);
          markerRef.current = newMarker;
        }
        if (markerRef.current) {
          markerRef.current.setAttribute(
            "position",
            `${location.lat},${location.lng},400`,
          );
          // Hide marker for normal and hard modes initially
          markerRef.current.style.display =
            difficulty === "easy" ? "block" : "none";
          markerRef.current.classList.remove("marker-animate");
        }
      }
    },
    [difficulty],
  );
  const handleQuit = async () => {
    setIsQuitting(true);
    try {
      await saveCurrentScore();
      navigate("/");
    } catch (error) {
      console.error("Error saving score:", error);
      toast.error("Failed to save score");
    } finally {
      setIsQuitting(false);
    }
  };
  const handleGameTypeSelect = (selectedGameType: GameType) => {
    setGameType(selectedGameType);
    setTotalScore(0);
    setGameState("selectDifficulty");
  };
  const handleDifficultySelect = (
    selectedDifficulty: "easy" | "normal" | "hard",
  ) => {
    setDifficulty(selectedDifficulty);
    setTotalScore(0);
    setHasSelectedDifficulty(true);
    setGameState("showInstructions"); // Directly go to instructions
    if (mapRef.current) {
      mapRef.current.defaultLabelsDisabled = selectedDifficulty === "hard";
    }
  };
  const handleInstructionsClose = () => {
    setGameState("preview");
    startNewRound();
  };
  const handleGameEnd = useCallback(async () => {
    await saveCurrentScore();
    if (!user) return;
    setGameState("game_end");
    try {
      const finalScore = totalScore + roundScore;
      const userRef = doc(db, "users", user.uid);
      const newAchievements = checkAchievements(
        finalScore,
        gamesPlayed + 1,
        100, // accuracy
        timeLeft,
        [], // continentsExplored
        gameType === "hiddenGems" ? gamesPlayed + 1 : 0,
      );
      // Save achievements to user document
      await updateDoc(userRef, {
        gamesPlayed: increment(1),
        totalScore: increment(finalScore),
        bestTime: bestTime
          ? bestTime > timeLeft
            ? timeLeft
            : bestTime
          : timeLeft,
        achievements: newAchievements, // Save achievements array
        [`stats.${gameType}.${difficulty}`]: finalScore,
        lastUpdated: serverTimestamp(),
      });
      setAchievements(newAchievements);
      newAchievements.forEach((achievement) => {
        toast.success(
          <div>
            <Trophy className="inline-block mr-2" size={20} />
            New Achievement: {achievement.name}
          </div>,
          { duration: 5000 },
        );
      });
      // Use consistent document ID format
      const docId = `${gameType}_${difficulty}_${user.uid}`;
      const leaderboardRef = doc(db, "leaderboard", docId);
      await setDoc(
        leaderboardRef,
        {
          userId: user.uid,
          username: user.displayName,
          score: finalScore,
          gameType,
          difficulty,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      toast.success(`Game Over! Final Score: ${finalScore}`, {
        duration: 5000,
        icon: "🏆",
      });
    } catch (error) {
      console.error("Error handling game end:", error);
      toast.error("Failed to save game results");
    }
  }, [
    totalScore,
    roundScore,
    bestTime,
    timeLeft,
    gamesPlayed,
    user,
    gameType,
    difficulty,
    saveCurrentScore,
  ]);
  const handleRoundEnd = useCallback(
    (currentRoundScore: number) => {
      if (user) {
        const docId = `${gameType}_${difficulty}_${user.uid}`;
        const leaderboardRef = doc(db, "leaderboard", docId);
        setDoc(leaderboardRef, {
          userId: user.uid,
          username: user.displayName,
          score: currentRoundScore,
          gameType,
          difficulty,
          updatedAt: serverTimestamp(),
        })
          .then(() => {
            const userRef = doc(db, "users", user.uid);
            return updateDoc(userRef, {
              [`stats.${gameType}.${difficulty}`]: currentRoundScore,
              totalScore: increment(currentRoundScore),
            });
          })
          .catch((error) => {
            console.error("Error saving score:", error);
          });
      }
      setTotalScore((prevTotal) => {
        const newTotal = prevTotal + currentRoundScore;
        return newTotal;
      });
      if (bestTime === null || timeLeft > bestTime) {
        setBestTime(timeLeft);
      }
      setGameState("round_end");
      if (gamesPlayed >= 10) {
        handleGameEnd();
      }
    },
    [
      user,
      gameType,
      difficulty,
      timeLeft,
      bestTime,
      gamesPlayed,
      handleGameEnd,
    ],
  );
  const startNewRound = useCallback(async () => {
    setIsLoadingLocation(true);
    if (currentTimeout.current) {
      clearTimeout(currentTimeout.current);
    }
    if (!user?.uid) {
      setError("User  not authenticated");
      setIsLoadingLocation(false);
      return;
    }
    try {
      const data = await getGameDataByType(user.uid, gameType);
      setGameData(data);
      setGameState("preview");
      const previewSettings = getDifficultySettings(difficulty, true);
      const gameplaySettings = getDifficultySettings(difficulty, false);
      setTimeLeft(gameplaySettings.time);
      setRoundScore(0);
      if (data.targetLocation && mapRef.current) {
        mapRef.current.center = {
          lat: data.targetLocation.lat,
          lng: data.targetLocation.lng,
          altitude: previewSettings.altitude,
        };
        mapRef.current.heading = 0;
        mapRef.current.tilt = previewSettings.tilt;
        mapRef.current.range = previewSettings.range;
        createPolygonAroundTarget(data.targetLocation);
        add3DMarker(data.targetLocation);
        const flyCamera = () => {
          mapRef.current?.flyCameraAround({
            camera: {
              center: {
                lat: data.targetLocation.lat,
                lng: data.targetLocation.lng,
                altitude: previewSettings.altitude,
              },
              heading: 0,
              tilt: previewSettings.tilt,
              range: previewSettings.range,
            },
            durationMillis: 30000,
            rounds: 1,
          });
        };
        setTimeout(flyCamera, 100);
        currentTimeout.current = setTimeout(() => {
          setGameState("playing");
          if (mapRef.current) {
            mapRef.current.flyCameraTo({
              endCamera: {
                center: {
                  lat: data.startLocation.lat,
                  lng: data.startLocation.lng,
                  altitude: gameplaySettings.altitude,
                },
                heading: 0,
                tilt: gameplaySettings.tilt,
                range: gameplaySettings.range,
              },
              durationMillis: 3000,
            });
          }
          if (data.countryBounds && mapRef.current) {
            mapRef.current.bounds = data.countryBounds;
          }
        }, 30000);
      }
      setGamesPlayed((prev) => {
        const newGamesPlayed = prev + 1;
        if (newGamesPlayed >= 10) {
          handleGameEnd();
        }
        return newGamesPlayed;
      });
    } catch (error) {
      logger.error("Failed to start new round", error);
      setError("Failed to start new round. Please try again.");
    } finally {
      setTimeout(() => {
        setIsLoadingLocation(false);
      }, 500);
    }
  }, [
    difficulty,
    gameType,
    user,
    handleGameEnd,
    createPolygonAroundTarget,
    add3DMarker,
  ]);
  const checkPlayerPosition = useCallback(() => {
    if (
      gameState === "playing" &&
      mapRef.current &&
      polygonCoordinates.length > 0 &&
      gameData
    ) {
      const currentPosition = {
        lat: mapRef.current.center.lat,
        lng: mapRef.current.center.lng,
      };
      const targetPosition = new google.maps.LatLng(
        gameData.targetLocation.lat,
        gameData.targetLocation.lng,
      );

      if (checkWinCondition(currentPosition, polygonCoordinates)) {
        const distance = google.maps.geometry.spherical.computeDistanceBetween(
          new google.maps.LatLng(currentPosition.lat, currentPosition.lng),
          targetPosition,
        );

        const newRoundScore = calculateScore(distance, timeLeft);
        setRoundScore(newRoundScore);
        updateScore(newRoundScore);

        if (markerRef.current) {
          markerRef.current.style.display = "block";
        }
        playSoundEffect("success", settings);
        handleRoundEnd(newRoundScore);
      }
    }
  }, [
    gameState,
    polygonCoordinates,
    gameData,
    timeLeft,
    updateScore,
    settings,
    handleRoundEnd,
  ]);

  const handleMapClick = useCallback(
    (event: Event) => {
      const mapEvent = event as unknown as google.maps.MapMouseEvent;
      if (gameState === "playing" && mapEvent.latLng) {
        const clickedLat = mapEvent.latLng.lat();
        const clickedLng = mapEvent.latLng.lng();
        playerPositionRef.current = { lat: clickedLat, lng: clickedLng };
        checkPlayerPosition();
      }
    },
    [gameState, checkPlayerPosition],
  );
  // Handle browser refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (gameState === "playing" || gameState === "preview") {
        e.preventDefault();
        e.returnValue = "";
        setShowQuitModal(true);
        return "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [gameState]);
  // Handle browser back button
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (gameState === "playing" || gameState === "preview") {
        e.preventDefault();
        setShowQuitModal(true);
        // Push a new entry to prevent immediate navigation
        window.history.pushState(null, "", location.pathname);
      }
    };
    // Push an initial entry to the history stack
    window.history.pushState(null, "", location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [gameState, location.pathname]);
  useEffect(() => {
    if (window.google && window.google.maps) {
      initMap();
      if (!hasSelectedDifficulty) {
        setGameState("selectGameType");
      }
    } else {
      const checkGoogleMapsLoaded = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkGoogleMapsLoaded);
          initMap();
          if (!hasSelectedDifficulty) {
            setGameState("selectGameType");
          }
        }
      }, 100);
      return () => clearInterval(checkGoogleMapsLoaded);
    }
  }, [hasSelectedDifficulty]);
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.addEventListener("click", handleMapClick);
    }
    return () => {
      if (mapRef.current) {
        mapRef.current.removeEventListener("click", handleMapClick);
      }
    };
  }, [handleMapClick]);
  useEffect(() => {
    if (gameState === "playing") {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleRoundEnd(0); // Time's up, player gets 0 points
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState, handleRoundEnd]);
  useEffect(() => {
    if (gameState === "playing") {
      const interval = setInterval(checkPlayerPosition, 100);
      return () => clearInterval(interval);
    }
  }, [checkPlayerPosition, gameState]);
  useEffect(() => {
    if (gameState === "preview" || gameState === "playing") {
      playBackgroundMusic(settings);
    }
    return () => {
      if (gameState === "game_end" || gameState === "round_end") {
        stopBackgroundMusic();
      }
    };
  }, [gameState, settings]);
  useEffect(() => {
    return () => {
      if (markerRef.current && mapRef.current) {
        mapRef.current.removeChild(markerRef.current);
      }
    };
  }, []);
  // Update altitude restrictions based on game state
  useEffect(() => {
    if (mapRef.current) {
      if (
        gameState === "playing" &&
        (difficulty === "normal" || difficulty === "hard")
      ) {
        mapRef.current.setAttribute("max-altitude", "100");
        mapRef.current.setAttribute("min-altitude", "0");
      } else {
        mapRef.current.setAttribute("max-altitude", "1000");
        mapRef.current.setAttribute("min-altitude", "0");
      }
    }
  }, [gameState, difficulty]);
  const initMap = useCallback(() => {
    if (mapRef.current && window.google) {
      customElements.whenDefined("gmp-map-3d").then(() => {
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
        }
      });
    }
  }, [difficulty]);
  if (!user) {
    navigate("/login");
    return null;
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
  return (
    <ErrorBoundary>
      <div className="relative h-screen">
        {isLoadingLocation && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-xl">
              <LoadingSpinner />
              <p className="mt-4 text-center text-gray-700">
                Loading next location...
              </p>
            </div>
          </div>
        )}
        <UserAvatar onQuit={() => setShowQuitModal(true)} />
        {showQuitModal && (
          <QuitGameModal
            onConfirm={handleQuit}
            onCancel={() => {
              setShowQuitModal(false);
              // Push a new entry to prevent immediate navigation
              window.history.pushState(null, "", location.pathname);
            }}
            onBeforeQuit={saveCurrentScore}
          />
        )}
        <GameStatus user={user} score={score} timeLeft={timeLeft} />
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
        {gameState === "selectGameType" && (
          <GameTypeModal onSelect={handleGameTypeSelect} />
        )}
        {gameState === "selectDifficulty" && !hasSelectedDifficulty && (
          <DifficultyModal onSelect={handleDifficultySelect} />
        )}
        {gameState === "showInstructions" && (
          <GameInstructions
            difficulty={difficulty}
            onClose={handleInstructionsClose}
          />
        )}
        {gameState === "preview" && gameData && (
          <LocationPreview gameData={gameData} timeLimit={timeLeft} />
        )}
        {gameState === "playing" && gameData?.locationInfo && (
          <button
            onClick={() =>
              toast.success(
                <div className="space-y-2">
                  <p>
                    <strong>Historical:</strong>{" "}
                    {gameData.locationInfo?.historicalSignificance ||
                      "Not available"}
                  </p>
                  <p>
                    <strong>Cultural:</strong>{" "}
                    {gameData.locationInfo?.culturalSignificance ||
                      "Not available"}
                  </p>
                </div>,
                { duration: 5000 },
              )
            }
            className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md"
          >
            <Info size={24} />
          </button>
        )}
        {(gameState === "round_end" || gameState === "game_end") && (
          <GameEndModal
            gameState={gameState}
            roundScore={roundScore}
            totalScore={totalScore}
            bestTime={bestTime}
            gamesPlayed={gamesPlayed}
            achievements={achievements}
            onNextRound={startNewRound}
            onNewGame={() => setGameState("selectGameType")}
            onHome={() => navigate("/")}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};
export default Game;
