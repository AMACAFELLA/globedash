import { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useBeforeUnload,
} from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import Home from './components/Home';
import Game from './components/Game';
import MultiplayerGame from './components/MultiplayerGame';
import Leaderboard from './components/Leaderboard';
import Profile from './components/Profile';
import Login from './components/Login';
import Register from './components/Register';
import LoadingSpinner from './components/LoadingSpinner';
import PrivateRoute from './components/PrivateRoute';
import Settings from './components/Settings';
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster } from 'react-hot-toast';

function AppRoutes() {
  useBeforeUnload((event) => {
    const message = 'Are you sure you want to leave? Your progress will be lost.';
    event.returnValue = message;
    return message;
  });

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/game"
        element={
          <PrivateRoute>
            <Game />
          </PrivateRoute>
        }
      />
      <Route
        path="/multiplayer/:sessionId"
        element={
          <PrivateRoute>
            <MultiplayerGame />
          </PrivateRoute>
        }
      />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <Settings />
          </PrivateRoute>
        }
      />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <SettingsProvider>
          <Router>
            <div className="min-h-screen bg-gray-100">
              <AppRoutes />
              <Toaster position="top-center" />
            </div>
          </Router>
        </SettingsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;