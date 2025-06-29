import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import axios from "../axios"; // Axios instance configured for your backend

// Create the Auth Context
export const AuthContext = createContext(null);

// Hook to easily access authentication context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Authentication Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Stores user data (_id, role, etc.)
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Authentication status
  const [loading, setLoading] = useState(true); // True during initial auth check

  // Updates user data in context (e.g., after profile edit)
  const updateUser = useCallback((newUserData) => {
    setUser((prevUser) => ({
      ...prevUser,
      ...newUserData,
    }));
    // Update token if it changes (e.g., on email update)
    if (newUserData.token) {
      localStorage.setItem("authToken", newUserData.token);
      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${newUserData.token}`;
    }
  }, []);

  // Logs in a user, stores token, and updates state
  const login = useCallback((userData) => {
    localStorage.setItem("authToken", userData.token);
    localStorage.setItem("userId", userData._id);
    localStorage.setItem("userRole", userData.role);
    setIsLoggedIn(true);
    setUser(userData); // Store full user data
    axios.defaults.headers.common["Authorization"] = `Bearer ${userData.token}`; // Set global auth header
  }, []);

  // Logs out a user, clears local storage and state
  const logout = useCallback(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    setIsLoggedIn(false);
    setUser(null);
    delete axios.defaults.headers.common["Authorization"]; // Clear global auth header
  }, []);

  // Effect to check authentication on component mount
  useEffect(() => {
    const checkInitialAuth = async () => {
      const token = localStorage.getItem("authToken");
      const userId = localStorage.getItem("userId");
      const userRole = localStorage.getItem("userRole");

      if (token && userId && userRole) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`; // Set header for API calls
        try {
          // Verify token with backend and get fresh user data
          const response = await axios.get("/api/auth/profile");
          if (response.status === 200 && response.data) {
            setIsLoggedIn(true);
            setUser(response.data); // Update with fresh profile data
          } else {
            console.warn("Token verification failed, logging out.");
            logout(); // Clear invalid data
          }
        } catch (error) {
          console.error("Initial authentication check failed:", error);
          logout(); // Clear data if API call fails
        }
      } else {
        setIsLoggedIn(false);
        setUser(null);
        delete axios.defaults.headers.common["Authorization"]; // Ensure no stale header
      }
      setLoading(false); // Auth check complete
    };

    checkInitialAuth();
  }, [logout]); // `logout` is a stable function due to useCallback

  // Auth context value provided to children
  const authContextValue = {
    isLoggedIn,
    user, // User object (e.g., _id, fullName, email, role)
    login,
    logout,
    loading, // Initial auth check status
    updateUser, // Function to update user data
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
