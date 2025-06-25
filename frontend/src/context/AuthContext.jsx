// src/context/AuthContext.jsx

import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios"; // Make sure axios is installed: npm install axios

// Create the Auth Context
export const AuthContext = createContext(null);

// Create a custom hook for easy access to the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null); // To store user details like _id, role, etc.
  const [loading, setLoading] = useState(true); // To indicate initial auth check is in progress

  // Function to perform login operations and update state
  const login = (userData) => {
    localStorage.setItem("authToken", userData.token);
    localStorage.setItem("userId", userData._id);
    localStorage.setItem("userRole", userData.role);
    setIsLoggedIn(true);
    setUser(userData); // Store the full user data received from login API
  };

  // Function to perform logout operations and update state
  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    setIsLoggedIn(false);
    setUser(null);
  };

  // Effect to check authentication status on component mount
  useEffect(() => {
    const checkInitialAuth = async () => {
      const token = localStorage.getItem("authToken");
      const userId = localStorage.getItem("userId");
      const userRole = localStorage.getItem("userRole"); // Get stored role as well

      if (token && userId && userRole) {
        try {
          // Verify token with backend
          // It's good to hit /api/auth/me to ensure the token is still valid
          const response = await axios.get(
            "http://localhost:5000/api/auth/me",
            {
              headers: {
                Authorization: `Bearer ${token}`, // Send the token in Authorization header
              },
            }
          );

          if (response.status === 200 && response.data) {
            setIsLoggedIn(true);
            // Use data from /me endpoint, which is the most current and validated
            setUser(response.data);
          } else {
            // Token invalid or expired based on backend response
            logout(); // Clear invalid data
          }
        } catch (error) {
          console.error("Initial authentication check failed:", error);
          logout(); // Clear data if API call fails
        }
      }
      setLoading(false); // Auth check complete
    };

    checkInitialAuth();
  }, []); // Run only once on component mount

  // Provide the auth state and functions to children components
  const authContextValue = {
    isLoggedIn,
    user, // The user object containing _id, fullName, email, role
    login,
    logout,
    loading, // Expose loading state so consumers can wait for auth check
  };

  // Optionally, show a global loading spinner while authentication is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="w-8 h-8 border-4 border-purple-500 border-dotted rounded-full animate-spin"></div>
        <p className="ml-3">Loading application...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
