import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "./LoadingSpinner";
// Props interface for PrivateRoute component
interface PrivateRouteProps {
  children: React.ReactNode; // Children components to render if user is authenticated
}
// PrivateRoute functional component
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user, loading } = useAuth(); // Get user and loading state from auth context
  const location = useLocation(); // Get current location for redirecting
  if (loading) {
    return <LoadingSpinner />; // Show loading spinner while checking authentication
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />; // Redirect to login if not authenticated
  }
  return <>{children}</>; // Render children if authenticated
};
export default PrivateRoute;
