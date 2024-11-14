import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  limit,
  where,
  updateDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  deleteDoc,
  runTransaction,
  Timestamp,
  setDoc,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';
import logger from './logger';

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

export interface GameSession {
  id: string;
  status: 'waiting' | 'in_progress' | 'completed';
  gameState?: 'selectDifficulty' | 'showInstructions' | 'waiting' | 'preview' | 'playing' | 'round_end' | 'game_end';
  players: {
    [key: string]: Player;
  };
  playerCount: number;
  maxPlayers: number;
  currentRound: number;
  totalRounds: number;
  targetLocation?: {
    lat: number;
    lng: number;
    name: string;
    description: string;
  };
  countryBounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  shareCode?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  difficulty?: 'easy' | 'normal' | 'hard';
  playerLeft?: string;
  roundStartTime?: number;
  host: string;
  country?: string;
  gameType?: 'classic' | 'hiddenGems' | 'continent';
  isQuickPlay?: boolean;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  gameType: 'classic' | 'hiddenGems' | 'continent';
  difficulty: 'easy' | 'normal' | 'hard';
  updatedAt?: Timestamp;
}

const generateShareCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const findGameByShareCode = async (shareCode: string): Promise<string | null> => {
  try {
    const q = query(
      collection(db, 'gameSessions'),
      where('shareCode', '==', shareCode.toUpperCase()),
      where('status', '==', 'waiting')
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return snapshot.docs[0].id;
  } catch (error) {
    logger.error('Failed to find game by share code:', error);
    return null;
  }
};

export const findAvailableSession = async (
  difficulty: string,
  gameType: string
): Promise<string | null> => {
  try {
    // Query for active quick play sessions that match criteria
    const q = query(
      collection(db, 'gameSessions'),
      where('status', '==', 'waiting'),
      where('difficulty', '==', difficulty),
      where('gameType', '==', gameType),
      where('isQuickPlay', '==', true),
      where('playerCount', '<', 2),
      orderBy('playerCount', 'desc'), // Prioritize sessions with players
      orderBy('createdAt', 'asc'), // Join oldest session first
      limit(5) // Get a few sessions to check
    );

    const snapshot = await getDocs(q);
    
    // Look for a valid session to join
    for (const doc of snapshot.docs) {
      const session = doc.data() as GameSession;
      
      // Count actual active players
      const activePlayers = Object.values(session.players || {}).filter(
        player => player !== null &&
        player.lastActive &&
        Date.now() - player.lastActive.toMillis() < 30000
      );

      // Only join if there's exactly one active player
      if (activePlayers.length === 1) {
        return doc.id;
      }
    }

    return null;
  } catch (error) {
    logger.error('Failed to find available session:', error);
    return null;
  }
};

export const createGameSession = async (
  userId: string,
  username: string,
  maxPlayers: number = 2,
  difficulty: 'easy' | 'normal' | 'hard',
  gameType: string,
  isQuickPlay: boolean = false
): Promise<{ sessionId: string; shareCode: string }> => {
  try {
    // For quick play, first try to find an existing session
    if (isQuickPlay) {
      const existingSessionId = await findAvailableSession(difficulty, gameType);
      if (existingSessionId) {
        await joinGameSession(existingSessionId, userId, username);
        return { sessionId: existingSessionId, shareCode: '' };
      }
    }

    const shareCode = isQuickPlay ? '' : generateShareCode();
    const timestamp = serverTimestamp();

    const gameSession = {
      status: 'waiting',
      gameState: 'waiting',
      players: {
        [userId]: {
          id: userId,
          username,
          ready: false,
          score: 0,
          lastActive: timestamp,
          joinedAt: timestamp,
        },
      },
      playerCount: 1,
      maxPlayers,
      currentRound: 0,
      totalRounds: 5,
      shareCode,
      difficulty,
      gameType,
      isQuickPlay,
      createdAt: timestamp,
      updatedAt: timestamp,
      host: userId,
    };

    const docRef = await addDoc(collection(db, 'gameSessions'), gameSession);

    // Clean up inactive sessions
    setTimeout(async () => {
      try {
        const sessionDoc = await getDoc(docRef);
        if (sessionDoc.exists()) {
          const currentSession = sessionDoc.data() as GameSession;
          const activePlayers = Object.values(currentSession.players || {}).filter(
            player => player !== null &&
            player.lastActive &&
            Date.now() - player.lastActive.toMillis() < 30000
          );

          if (activePlayers.length === 0 ||
            (currentSession.status === 'waiting' &&
              currentSession.createdAt &&
              Date.now() - currentSession.createdAt.toMillis() > 300000)) {
            await deleteDoc(docRef);
          }
        }
      } catch (error) {
        logger.error('Failed to clean up inactive session:', error);
      }
    }, 5 * 60 * 1000);

    return { sessionId: docRef.id, shareCode };
  } catch (error) {
    logger.error('Failed to create game session:', error);
    throw new Error('Failed to create game session');
  }
};

export const joinGameSession = async (
  sessionId: string,
  userId: string,
  username: string
): Promise<void> => {
  try {
    const sessionRef = doc(db, 'gameSessions', sessionId);
  
    await runTransaction(db, async (transaction) => {
      const sessionDoc = await transaction.get(sessionRef);
    
      if (!sessionDoc.exists()) {
        throw new Error('Game session not found');
      }

      const session = sessionDoc.data() as GameSession;
    
      if (session.status !== 'waiting') {
        throw new Error('Game session is no longer available');
      }

      const activePlayers = Object.values(session.players || {}).filter(
        player => player !== null &&
        player.lastActive &&
        Date.now() - player.lastActive.toMillis() < 30000
      );

      if (activePlayers.length >= session.maxPlayers) {
        throw new Error('Game session is full');
      }

      const timestamp = serverTimestamp();
    
      const updates = {
        [`players.${userId}`]: {
          id: userId,
          username,
          ready: true,
          score: 0,
          lastActive: timestamp,
          joinedAt: timestamp,
        },
        playerCount: activePlayers.length + 1,
        updatedAt: timestamp,
      };

      transaction.update(sessionRef, updates);
    });
  } catch (error) {
    logger.error('Failed to join game session:', error);
    throw error;
  }
};

export const setPlayerReady = async (
  sessionId: string,
  userId: string,
  ready: boolean
): Promise<void> => {
  try {
    const sessionRef = doc(db, 'gameSessions', sessionId);
    await updateDoc(sessionRef, {
      [`players.${userId}.ready`]: ready,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logger.error('Failed to set player ready status:', error);
    throw error;
  }
};

export const updatePlayerPosition = async (
  sessionId: string,
  userId: string,
  position: { lat: number; lng: number }
): Promise<void> => {
  try {
    const sessionRef = doc(db, 'gameSessions', sessionId);
    await updateDoc(sessionRef, {
      [`players.${userId}.position`]: position,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logger.error('Failed to update player position:', error);
    throw error;
  }
};

export const updatePlayerActivity = async (
  sessionId: string,
  userId: string
): Promise<void> => {
  try {
    const sessionRef = doc(db, 'gameSessions', sessionId);
    await updateDoc(sessionRef, {
      [`players.${userId}.lastActive`]: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logger.error('Failed to update player activity:', error);
  }
};

export const startPlayerHeartbeat = (
  sessionId: string,
  userId: string
): (() => void) => {
  const intervalId = setInterval(() => {
    updatePlayerActivity(sessionId, userId).catch(console.error);
  }, 10000);

  return () => clearInterval(intervalId);
};

export const handlePlayerDisconnect = async (
  sessionId: string,
  userId: string
): Promise<void> => {
  try {
    const sessionRef = doc(db, 'gameSessions', sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (!sessionDoc.exists()) return;

    const session = sessionDoc.data() as GameSession;
    const updatedPlayers = { ...session.players };
    delete updatedPlayers[userId];

    if (Object.keys(updatedPlayers).length === 0) {
      await deleteDoc(sessionRef);
    } else {
      await updateDoc(sessionRef, {
        players: updatedPlayers,
        playerCount: Object.keys(updatedPlayers).length,
        playerLeft: userId,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    logger.error('Failed to handle player disconnect:', error);
  }
};

export const updateGameSessionState = async (
  sessionId: string,
  updates: Record<string, any>
): Promise<void> => {
  try {
    const sessionRef = doc(db, 'gameSessions', sessionId);
    await updateDoc(sessionRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logger.error('Failed to update game session state:', error);
    throw error;
  }
};

export const subscribeToGameSession = (
  sessionId: string,
  callback: (session: GameSession) => void
): (() => void) => {
  const unsubscribe = onSnapshot(
    doc(db, 'gameSessions', sessionId),
    async (doc) => {
      if (doc.exists()) {
        const session = doc.data() as GameSession;
       
        const activePlayers = Object.fromEntries(
          Object.entries(session.players || {}).filter(([_, player]) =>
            player !== null &&
            player.lastActive &&
            Date.now() - player.lastActive.toMillis() < 30000
          )
        );

        if (Object.keys(activePlayers).length !== Object.keys(session.players).length) {
          await updateDoc(doc.ref, {
            players: activePlayers,
            playerCount: Object.keys(activePlayers).length,
            updatedAt: serverTimestamp(),
          });
        }

        callback({ ...session, id: doc.id, players: activePlayers });
      }
    },
    (error) => {
      logger.error('Error subscribing to game session:', error);
    }
  );

  return unsubscribe;
};

export const getLeaderboard = async (
  gameType: 'classic' | 'hiddenGems' | 'continent',
  difficulty: 'easy' | 'normal' | 'hard'
): Promise<LeaderboardEntry[]> => {
  try {
    const leaderboardRef = collection(db, 'leaderboard');
    const q = query(
      leaderboardRef,
      where('gameType', '==', gameType),
      where('difficulty', '==', difficulty),
      where('score', '>', 0),
      orderBy('score', 'desc'),
      limit(10)
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
    logger.error('Failed to get leaderboard:', error);
    return [];
  }
};

export const addScoreToLeaderboard = async (
  userId: string,
  score: number,
  username: string,
  gameType: 'classic' | 'hiddenGems' | 'continent',
  difficulty: 'easy' | 'normal' | 'hard'
): Promise<void> => {
  try {
    const docId = `${gameType}_${difficulty}_${userId}`;
    const docRef = doc(db, 'leaderboard', docId);

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

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      [`stats.${gameType}.${difficulty}`]: score,
      totalScore: increment(score),
      lastPlayed: serverTimestamp(),
    });
  } catch (error) {
    logger.error('Failed to add score to leaderboard:', error);
    throw error;
  }
};

export const getUserHighScore = async (
  userId: string,
  gameType: 'classic' | 'hiddenGems' | 'continent',
  difficulty: 'easy' | 'normal' | 'hard'
): Promise<number> => {
  if (!userId || !gameType || !difficulty) {
    logger.error('Invalid parameters in getUserHighScore');
    return 0;
  }
  
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const score = userData?.stats?.[gameType]?.[difficulty] || 0;
      return score;
    }

    const docId = `${gameType}_${difficulty}_${userId}`;
    const docRef = doc(db, 'leaderboard', docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().score || 0;
    }

    return 0;
  } catch (error) {
    logger.error('Failed to get user high score:', error);
    return 0;
  }
};

export const updateUsernameInLeaderboard = async (
  userId: string,
  newUsername: string
): Promise<void> => {
  try {
    const leaderboardRef = collection(db, 'leaderboard');
    const userScoreQuery = query(leaderboardRef, where('userId', '==', userId));
    const userScoreSnapshot = await getDocs(userScoreQuery);

    const batch = writeBatch(db);
    userScoreSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        username: newUsername,
        updatedAt: serverTimestamp()
      });
    });
    
    if (!userScoreSnapshot.empty) {
      await batch.commit();
    }
  } catch (error) {
    logger.error('Failed to update username in leaderboard:', error);
    throw error;
  }
};

export const updateUserStats = async (
  userId: string,
  gameType: 'classic' | 'hiddenGems' | 'continent',
  difficulty: 'easy' | 'normal' | 'hard',
  score: number,
  timeTaken: number
): Promise<void> => {
  try {
    const userStatsRef = doc(db, 'users', userId);
    const updates: Record<string, any> = {
      [`stats.${gameType}.${difficulty}`]: score,
      [`stats.${gameType}.gamesPlayed`]: increment(1),
      [`stats.${gameType}.totalTimePlayed`]: increment(timeTaken),
      lastUpdated: serverTimestamp(),
    };

    const userDoc = await getDoc(userStatsRef);
    if (userDoc.exists()) {
      const currentBestTime = userDoc.data()?.stats?.[gameType]?.bestTime || Infinity;
      if (timeTaken < currentBestTime) {
        updates[`stats.${gameType}.bestTime`] = timeTaken;
      }
    } else {
      updates[`stats.${gameType}.bestTime`] = timeTaken;
    }

    await setDoc(userStatsRef, updates, { merge: true });
  } catch (error) {
    logger.error('Failed to update user stats:', error);
    throw error;
  }
};

export const getUserStats = async (userId: string): Promise<any> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data().stats || {
        classic: { easy: 0, normal: 0, hard: 0 },
        hiddenGems: { easy: 0, normal: 0, hard: 0 },
        continent: { easy: 0, normal: 0, hard: 0 }
      };
    }
    
    return {
      classic: { easy: 0, normal: 0, hard: 0 },
      hiddenGems: { easy: 0, normal: 0, hard: 0 },
      continent: { easy: 0, normal: 0, hard: 0 }
    };
  } catch (error) {
    logger.error('Failed to get user stats:', error);
    throw error;
  }
};