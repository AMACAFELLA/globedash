import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  updateDoc,
  doc,
  getDoc,
  serverTimestamp,
  writeBatch,
  Timestamp,
  setDoc,
  increment,
} from "firebase/firestore";
import { db } from "./firebase";
import logger from "./logger";

export interface Player {
  id: string;
  username: string;
  ready: boolean;
  score: number;
  lastActive: Timestamp;
  joinedAt: Timestamp;
  position?: {
    lat: number;
    lng: number;
  };
  lastGuess?: {
    position: {
      lat: number;
      lng: number;
    };
    score: number;
    distance: number;
  };
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  gameType: "classic" | "hiddenGems" | "continent";
  difficulty: "easy" | "normal" | "hard";
  updatedAt?: Timestamp;
}

export const getLeaderboard = async (
  gameType: "classic" | "hiddenGems" | "continent",
  difficulty: "easy" | "normal" | "hard",
): Promise<LeaderboardEntry[]> => {
  try {
    const leaderboardRef = collection(db, "leaderboard");
    const q = query(
      leaderboardRef,
      where("gameType", "==", gameType),
      where("difficulty", "==", difficulty),
      where("score", ">", 0),
      orderBy("score", "desc"),
      limit(10),
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      userId: doc.data().userId,
      username: doc.data().username,
      score: doc.data().score,
      gameType: doc.data().gameType,
      difficulty: doc.data().difficulty,
      updatedAt: doc.data().updatedAt,
    }));
  } catch (error) {
    logger.error("Failed to get leaderboard:", error);
    return [];
  }
};

// export const addScoreToLeaderboard = async (
//   userId: string,
//   score: number,
//   username: string,
//   gameType: "classic" | "hiddenGems" | "continent",
//   difficulty: "easy" | "normal" | "hard",
// ): Promise<void> => {
//   try {
//     const docId = `${gameType}_${difficulty}_${userId}`;
//     const docRef = doc(db, "leaderboard", docId);

//     const docSnap = await getDoc(docRef);

//     if (!docSnap.exists()) {
//       await setDoc(docRef, {
//         userId,
//         username,
//         score,
//         gameType,
//         difficulty,
//         createdAt: serverTimestamp(),
//         updatedAt: serverTimestamp(),
//       });
//     } else {
//       const currentScore = docSnap.data().score || 0;
//       if (score > currentScore) {
//         await updateDoc(docRef, {
//           score,
//           username,
//           updatedAt: serverTimestamp(),
//         });
//       }
//     }

//     const userRef = doc(db, "users", userId);
//     await updateDoc(userRef, {
//       [`stats.${gameType}.${difficulty}`]: score,
//       totalScore: increment(score),
//       lastPlayed: serverTimestamp(),
//     });
//   } catch (error) {
//     logger.error("Failed to add score to leaderboard:", error);
//     throw error;
//   }
// };

export const addScoreToLeaderboard = async (
  userId: string,
  score: number,
  username: string,
  gameType: "classic" | "hiddenGems" | "continent",
  difficulty: "easy" | "normal" | "hard",
): Promise<void> => {
  try {
    const docId = `${gameType}_${difficulty}_${userId}`;
    const docRef = doc(db, "leaderboard", docId);

    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      await setDoc(docRef, {
        userId,
        username,
        score,
        gameType,
        difficulty,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const currentScore = docSnap.data().score || 0;
      if (score > currentScore) {
        await updateDoc(docRef, {
          score,
          username,
          updatedAt: serverTimestamp(),
        });
      }
    }

    // Update user's stats with the new score
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      [`stats.${gameType}.${difficulty}`]: score,
      lastPlayed: serverTimestamp(),
    });
  } catch (error) {
    logger.error("Failed to add score to leaderboard:", error);
    throw error;
  }
};

// export const getUserHighScore = async (
//   userId: string,
//   gameType: "classic" | "hiddenGems" | "continent",
//   difficulty: "easy" | "normal" | "hard",
// ): Promise<number> => {
//   if (!userId || !gameType || !difficulty) {
//     logger.error("Invalid parameters in getUserHighScore");
//     return 0;
//   }

//   try {
//     const userRef = doc(db, "users", userId);
//     const userDoc = await getDoc(userRef);

//     if (userDoc.exists()) {
//       const userData = userDoc.data();
//       const score = userData?.stats?.[gameType]?.[difficulty] || 0;
//       return score;
//     }

//     const docId = `${gameType}_${difficulty}_${userId}`;
//     const docRef = doc(db, "leaderboard", docId);
//     const docSnap = await getDoc(docRef);

//     if (docSnap.exists()) {
//       return docSnap.data().score || 0;
//     }

//     return 0;
//   } catch (error) {
//     logger.error("Failed to get user high score:", error);
//     return 0;
//   }
// };

export const getUserHighScore = async (
  userId: string,
  gameType: "classic" | "hiddenGems" | "continent",
  difficulty: "easy" | "normal" | "hard",
): Promise<number> => {
  if (!userId || !gameType || !difficulty) {
    logger.error("Invalid parameters in getUserHighScore");
    return 0;
  }

  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const score = userData?.stats?.[gameType]?.[difficulty] || 0;
      return score;
    }

    const docId = `${gameType}_${difficulty}_${userId}`;
    const docRef = doc(db, "leaderboard", docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().score || 0;
    }

    return 0;
  } catch (error) {
    logger.error("Failed to get user high score:", error);
    return 0;
  }
};

export const updateUsernameInLeaderboard = async (
  userId: string,
  newUsername: string,
): Promise<void> => {
  try {
    const leaderboardRef = collection(db, "leaderboard");
    const userScoreQuery = query(leaderboardRef, where("userId", "==", userId));
    const userScoreSnapshot = await getDocs(userScoreQuery);

    const batch = writeBatch(db);
    userScoreSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        username: newUsername,
        updatedAt: serverTimestamp(),
      });
    });

    if (!userScoreSnapshot.empty) {
      await batch.commit();
    }
  } catch (error) {
    logger.error("Failed to update username in leaderboard:", error);
    throw error;
  }
};

export const updateUserStats = async (
  userId: string,
  gameType: "classic" | "hiddenGems" | "continent",
  difficulty: "easy" | "normal" | "hard",
  score: number,
  timeTaken: number,
): Promise<void> => {
  try {
    const userStatsRef = doc(db, "users", userId);
    const updates: Record<string, any> = {
      [`stats.${gameType}.${difficulty}`]: score,
      [`stats.${gameType}.gamesPlayed`]: increment(1),
      [`stats.${gameType}.totalTimePlayed`]: increment(timeTaken),
      lastUpdated: serverTimestamp(),
    };

    const userDoc = await getDoc(userStatsRef);
    if (userDoc.exists()) {
      const currentBestTime =
        userDoc.data()?.stats?.[gameType]?.bestTime || Infinity;
      if (timeTaken < currentBestTime) {
        updates[`stats.${gameType}.bestTime`] = timeTaken;
      }
    } else {
      updates[`stats.${gameType}.bestTime`] = timeTaken;
    }

    await setDoc(userStatsRef, updates, { merge: true });
  } catch (error) {
    logger.error("Failed to update user stats:", error);
    throw error;
  }
};

export const getUserStats = async (userId: string): Promise<any> => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return (
        userDoc.data().stats || {
          classic: { easy: 0, normal: 0, hard: 0 },
          hiddenGems: { easy: 0, normal: 0, hard: 0 },
          continent: { easy: 0, normal: 0, hard: 0 },
        }
      );
    }

    return {
      classic: { easy: 0, normal: 0, hard: 0 },
      hiddenGems: { easy: 0, normal: 0, hard: 0 },
      continent: { easy: 0, normal: 0, hard: 0 },
    };
  } catch (error) {
    logger.error("Failed to get user stats:", error);
    throw error;
  }
};
