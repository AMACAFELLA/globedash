import React, { createContext, useContext, useState, useEffect } from "react"; // Import necessary React hooks
import { auth } from "../utils/firebase"; // Import the Firebase authentication instance
import { User } from "firebase/auth"; // Import the User type from Firebase authentication
// Define the shape of the authentication context
interface AuthContextType {
  user: User | null; // The authenticated user or null if not logged in
  loading: boolean; // A loading state to indicate if authentication is being checked
}
// Create the authentication context with default values
const AuthContext = createContext<AuthContextType>({
  user: null, // Default value for user
  loading: true, // Default loading state
});
// Custom hook to use the AuthContext
export const useAuth = () => useContext(AuthContext); // Returns the current context value
// AuthProvider component to wrap the application and provide authentication context
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children, // Children components that will have access to this context
}) => {
  // State to hold the authenticated user
  const [user, setUser] = useState<User | null>(null); // Initially set to null
  // State to indicate if the authentication check is still loading
  const [loading, setLoading] = useState(true); // Initially set to true
  // Effect to subscribe to authentication state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user); // Update user state when authentication state changes
      setLoading(false); // Set loading to false once the user state is determined
    });
    return unsubscribe; // Cleanup subscription on component unmount
  }, []); // Empty dependency array means this runs once on mount
  // Render the provider with the current user and loading state
  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children} {/* Render children components within the provider */}
    </AuthContext.Provider>
  );
};
