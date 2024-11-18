import { useState, useCallback, useEffect } from "react";
import {
  addScoreToLeaderboard,
  getUserHighScore,
} from "../utils/firebaseUtils";
import { useAuth } from "../contexts/AuthContext";
/**
 * Custom hook for managing game scores
 * Handles score tracking, updates, and high score management
 */
export const useScore = (
  gameType: "classic" | "hiddenGems" | "continent" = "classic",
  difficulty: "easy" | "normal" | "hard" = "easy",
) => {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const { user } = useAuth();
  // Fetch user's high score on component mount
  useEffect(() => {
    const fetchHighScore = async () => {
      if (user?.uid) {
        try {
          const userHighScore = await getUserHighScore(
            user.uid,
            gameType,
            difficulty,
          );
          setHighScore(userHighScore);
        } catch (error) {
          console.error("Error fetching high score:", error);
        }
      }
    };
    fetchHighScore();
  }, [user, gameType, difficulty]);
  // Update score and check for new high score
  const updateScore = useCallback(
    async (points: number) => {
      if (!user?.uid || !user?.displayName) return;

      // Add new points to existing score
      setScore((prevScore) => {
        const newTotalScore = prevScore + points;

        // Update leaderboard if new total score exceeds high score
        if (newTotalScore > highScore) {
          addScoreToLeaderboard(
            user.uid,
            newTotalScore,
            user.displayName || "Anonymous",
            gameType,
            difficulty,
          ).catch((error) => {
            console.error("Error updating leaderboard:", error);
          });
          setHighScore(newTotalScore);
        }

        return newTotalScore;
      });
    },
    [highScore, user, gameType, difficulty],
  );
  // Save current score to leaderboard
  const saveCurrentScore = useCallback(async () => {
    if (!user?.uid || !user?.displayName || score === 0) return;

    try {
      await addScoreToLeaderboard(
        user.uid,
        score,
        user.displayName,
        gameType,
        difficulty,
      );
      if (score > highScore) {
        setHighScore(score);
      }
    } catch (error) {
      console.error("Error saving current score:", error);
    }
  }, [score, highScore, user, gameType, difficulty]);

  return { score, highScore, updateScore, saveCurrentScore };
};
