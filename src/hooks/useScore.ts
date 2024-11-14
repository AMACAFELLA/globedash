import { useState, useCallback, useEffect } from 'react';
import {
  addScoreToLeaderboard,
  getUserHighScore,
} from '../utils/firebaseUtils';
import { useAuth } from '../contexts/AuthContext';

export const useScore = (
  gameType: 'classic' | 'hiddenGems' | 'continent' = 'classic',
  difficulty: 'easy' | 'normal' | 'hard' = 'easy'
) => {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    const fetchHighScore = async () => {
      if (user?.uid) {
        try {
          const userHighScore = await getUserHighScore(user.uid, gameType, difficulty);
          setHighScore(userHighScore);
        } catch (error) {
          console.error('Error fetching high score:', error);
        }
      }
    };

    fetchHighScore();
  }, [user, gameType, difficulty]);

  const updateScore = useCallback(
    async (points: number) => {
      if (!user?.uid || !user?.displayName) return;

      try {
        const newScore = score + points;
        setScore(newScore);

        // Only update leaderboard if the new score is higher than the current high score
        if (newScore > highScore) {
          await addScoreToLeaderboard(
            user.uid,
            newScore,
            user.displayName,
            gameType,
            difficulty
          );
          setHighScore(newScore);
        }
      } catch (error) {
        console.error('Error updating score:', error);
      }
    },
    [score, highScore, user, gameType, difficulty]
  );

  return { score, highScore, updateScore };
};