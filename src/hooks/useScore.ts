import { useState, useCallback, useEffect } from "react";
import {
  addScoreToLeaderboard,
  getUserHighScore,
} from "../utils/firebaseUtils";
import { useAuth } from "../contexts/AuthContext";

export const useScore = (
  gameType: "classic" | "hiddenGems" | "continent" = "classic",
  difficulty: "easy" | "normal" | "hard" = "easy",
) => {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const { user } = useAuth();

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

  const updateScore = useCallback(
    async (points: number) => {
      if (!user?.uid || !user?.displayName) return;

      // Always update the current game score
      setScore(points);

      try {
        // Update leaderboard if new score exceeds high score
        if (points > highScore) {
          await addScoreToLeaderboard(
            user.uid,
            points,
            user.displayName,
            gameType,
            difficulty,
          );
          setHighScore(points);
        }
      } catch (error) {
        console.error("Error updating score:", error);
      }
    },
    [highScore, user, gameType, difficulty],
  );

  // New method to force update leaderboard
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
