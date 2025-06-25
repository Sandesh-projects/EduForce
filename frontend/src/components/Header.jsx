// src/components/Header.jsx

import { Brain } from "lucide-react";
import React from "react"; // Removed useState and useEffect as AuthContext handles login status
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Import useAuth hook

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, logout } = useAuth(); // Get isLoggedIn state and logout function from AuthContext

  // Determine if the current path is /login or /register
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";

  // handleLogout function now simply calls the context's logout
  const handleLogout = () => {
    logout(); // This clears localStorage and updates isLoggedIn state in AuthContext
    alert("Logged out successfully!");
    navigate("/"); // Redirect to the landing page
  };

  return (
    <>
      <nav className="relative z-50 px-6 py-4 bg-black bg-opacity-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate("/")} // Make logo clickable to go home
          >
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">EduForce</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            {/* Conditionally render Features and How it Works links */}
            {/* Show only if not on auth pages AND not logged in */}
            {!isAuthPage && !isLoggedIn && (
              <>
                <a
                  href="#features"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  How it Works
                </a>
              </>
            )}

            {/* Conditionally render Sign In or Logout button */}
            {isLoggedIn ? (
              <button
                className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-2 rounded-full hover:from-red-700 hover:to-orange-700 transition-all duration-300 transform hover:scale-105"
                onClick={handleLogout} // Call logout function
              >
                Logout
              </button>
            ) : (
              // Only show Sign In if not on auth pages
              !isAuthPage && (
                <button
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105"
                  onClick={() => {
                    navigate("/login");
                  }}
                >
                  Sign In
                </button>
              )
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Header;
