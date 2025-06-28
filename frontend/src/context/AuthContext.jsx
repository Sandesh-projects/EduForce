// frontend/src/context/AuthContext.jsx

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import axios from "../axios"; // Make sure axios is configured to your backend URL

// Create the Auth Context
export const AuthContext = createContext(null);

// Create a custom hook for easy access to the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // To store user details like _id, role, etc.
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true); // To indicate initial auth check is in progress

  // Function to update user data in context (used after profile updates)
  const updateUser = useCallback((newUserData) => {
    setUser((prevUser) => ({
      ...prevUser,
      ...newUserData,
    }));
    // If the token might change (e.g., email update sometimes prompts new token), update it
    if (newUserData.token) {
      localStorage.setItem("authToken", newUserData.token);
      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${newUserData.token}`;
    }
  }, []);

  // Function to perform login operations and update state
  const login = useCallback((userData) => {
    localStorage.setItem("authToken", userData.token);
    localStorage.setItem("userId", userData._id);
    localStorage.setItem("userRole", userData.role);
    setIsLoggedIn(true);
    setUser(userData); // Store the full user data received from login API
    axios.defaults.headers.common["Authorization"] = `Bearer ${userData.token}`; // Set global auth header
  }, []);

  // Function to perform logout operations and update state
  const logout = useCallback(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    setIsLoggedIn(false);
    setUser(null);
    delete axios.defaults.headers.common["Authorization"]; // Clear global auth header
  }, []);

  // Effect to check authentication status on component mount
  useEffect(() => {
    const checkInitialAuth = async () => {
      const token = localStorage.getItem("authToken");
      const userId = localStorage.getItem("userId");
      const userRole = localStorage.getItem("userRole"); // Get stored role as well

      if (token && userId && userRole) {
        // Set the Authorization header globally for all axios requests
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        try {
          // Verify token with backend and get up-to-date user data
          const response = await axios.get("/api/auth/profile"); // Use the /profile endpoint
          if (response.status === 200 && response.data) {
            setIsLoggedIn(true);
            setUser(response.data); // Use data from /profile endpoint
          } else {
            // Token invalid or expired based on backend response
            console.warn("Initial token verification failed, logging out.");
            logout(); // Clear invalid data
          }
        } catch (error) {
          console.error("Initial authentication check failed:", error);
          logout(); // Clear data if API call fails (e.g., network error, 401)
        }
      } else {
        // No token found, ensure logged out state
        setIsLoggedIn(false);
        setUser(null);
        delete axios.defaults.headers.common["Authorization"]; // Ensure no stale header
      }
      setLoading(false); // Auth check complete
    };

    checkInitialAuth();
  }, [logout]); // logout is a dependency, but useCallback prevents infinite loop

  // Provide the auth state and functions to children components
  const authContextValue = {
    isLoggedIn,
    user, // The user object containing _id, fullName, email, role
    login,
    logout,
    loading, // Expose loading state so consumers can wait for auth check
    updateUser, // Expose updateUser for profile updates
  };

  // The loading spinner during initial authentication check is handled by the PrivateRoute itself.
  // The AuthProvider just ensures `loading` is exposed.
  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
