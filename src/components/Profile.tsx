import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateUsernameInLeaderboard } from '../utils/firebaseUtils';
import { updateProfile } from 'firebase/auth';
import { db } from '../utils/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import {
  Trophy,
  Mail,
  Calendar,
  Edit2,
  Save,
  X,
  AlertCircle,
  ArrowLeft,
  Award,
  Star,
  Target
} from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Achievement } from '../utils/gameLogic';

interface GameStats {
  classic: {
    easy: number;
    normal: number;
    hard: number;
  };
  hiddenGems: {
    easy: number;
    normal: number;
    hard: number;
  };
  continent: {
    easy: number;
    normal: number;
    hard: number;
  };
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [gameStats, setGameStats] = useState<GameStats>({
    classic: { easy: 0, normal: 0, hard: 0 },
    hiddenGems: { easy: 0, normal: 0, hard: 0 },
    continent: { easy: 0, normal: 0, hard: 0 }
  });
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
  const fetchUserData = async () => {
    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();

        if (userData) {
          // Get stats directly from user document
          const stats: GameStats = {
            classic: { 
              easy: userData.stats?.classic?.easy || 0,
              normal: userData.stats?.classic?.normal || 0,
              hard: userData.stats?.classic?.hard || 0
            },
            hiddenGems: {
              easy: userData.stats?.hiddenGems?.easy || 0,
              normal: userData.stats?.hiddenGems?.normal || 0,
              hard: userData.stats?.hiddenGems?.hard || 0
            },
            continent: {
              easy: userData.stats?.continent?.easy || 0,
              normal: userData.stats?.continent?.normal || 0,
              hard: userData.stats?.continent?.hard || 0
            }
          };

          setGameStats(stats);
          setNewUsername(user.displayName || '');
          
          // Set achievements from user document
          if (userData.achievements) {
            setAchievements(userData.achievements);
          }
        }

        await setDoc(
          userRef,
          {
            username: user.displayName?.toLowerCase() || '',
            displayName: user.displayName || '',
            email: user.email,
            createdAt: user.metadata.creationTime,
          },
          { merge: true }
        );
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    }
  };

  fetchUserData();
}, [user]);

  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    if (!username.trim() || !user) return false;

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username.toLowerCase()));
    const querySnapshot = await getDocs(q);

    return querySnapshot.empty || querySnapshot.docs[0].id === user.uid;
  };

  const handleUsernameUpdate = async () => {
    if (!user || !newUsername.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (newUsername.length < 3 || newUsername.length > 20) {
        throw new Error('Username must be between 3 and 20 characters');
      }

      if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
        throw new Error('Username can only contain letters, numbers, and underscores');
      }

      const isAvailable = await checkUsernameAvailability(newUsername);
      if (!isAvailable) {
        throw new Error('Username is already taken');
      }

      await updateProfile(user, {
        displayName: newUsername,
      });

      const userRef = doc(db, 'users', user.uid);
      await setDoc(
        userRef,
        {
          username: newUsername.toLowerCase(),
          displayName: newUsername,
        },
        { merge: true }
      );

      await updateUsernameInLeaderboard(user.uid, newUsername);

      setIsEditing(false);
      toast.success('Username updated successfully!');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update username');
      toast.error(error instanceof Error ? error.message : 'Failed to update username');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderScoreCard = (type: keyof GameStats, icon: React.ReactNode, title: string) => (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex items-center space-x-3 mb-4">
        {icon}
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
          <span className="text-green-700">Easy</span>
          <span className="font-bold text-green-800">{gameStats[type].easy}</span>
        </div>
        <div className="flex items-center justify-between bg-yellow-50 p-3 rounded-lg">
          <span className="text-yellow-700">Normal</span>
          <span className="font-bold text-yellow-800">{gameStats[type].normal}</span>
        </div>
        <div className="flex items-center justify-between bg-red-50 p-3 rounded-lg">
          <span className="text-red-700">Hard</span>
          <span className="font-bold text-red-800">{gameStats[type].hard}</span>
        </div>
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please log in to view your profile</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-white hover:text-blue-100 transition-colors"
        >
          <ArrowLeft className="mr-2" size={24} />
          <span>Back</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="relative h-32 bg-gradient-to-r from-blue-600 to-blue-700">
                <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
                  <div className="w-32 h-32 bg-white rounded-full p-2">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <span className="text-4xl font-bold text-white">
                        {user.displayName?.[0].toUpperCase() || 'U'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-20 pb-8 px-8">
                <div className="text-center mb-8">
                  {isEditing ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="w-full border-2 border-blue-500 rounded-lg px-4 py-2 focus:outline-none"
                        placeholder="Enter new username"
                        disabled={isSubmitting}
                      />
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={handleUsernameUpdate}
                          disabled={isSubmitting}
                          className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600"
                        >
                          <Save size={20} />
                        </button>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setNewUsername(user.displayName || '');
                            setError(null);
                          }}
                          className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <h2 className="text-2xl font-bold">{user.displayName}</h2>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-blue-500 hover:text-blue-600"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-500">Joined</p>
                      <p className="font-medium">
                        {user.metadata.creationTime
                          ? new Date(user.metadata.creationTime).toLocaleDateString(
                              undefined,
                              {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              }
                            )
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {renderScoreCard('classic', <Trophy className="text-yellow-500" size={24} />, 'Classic Mode')}
              {renderScoreCard('hiddenGems', <Star className="text-purple-500" size={24} />, 'Hidden Gems')}
              {renderScoreCard('continent', <Target className="text-green-500" size={24} />, 'Continent Mode')}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Award className="text-blue-500" size={24} />
                <h3 className="text-xl font-bold text-gray-800">Achievements</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{achievement.icon}</span>
                      <div>
                        <h4 className="font-bold text-yellow-900">{achievement.name}</h4>
                        <p className="text-sm text-yellow-700">{achievement.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {achievements.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    <Trophy className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                    <p>Start playing to earn achievements!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;