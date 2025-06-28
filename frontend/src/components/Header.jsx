// src/components/Header.jsx

import { Brain, User } from "lucide-react"; // Import User icon
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify"; // Import toast for notifications

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, logout, user } = useAuth(); // Get user object from AuthContext

  // Determine if the current path is /login or /register
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";

  // handleLogout function now simply calls the context's logout
  const handleLogout = () => {
    logout(); // This clears localStorage and updates isLoggedIn state in AuthContext
    toast.success("Logged out successfully!"); // Replaced alert with toast
    navigate("/"); // Redirect to the landing page
  };

  return (
    <>
      <nav className="relative z-50 px-6 py-4 bg-black bg-opacity-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => {
              if (isLoggedIn) {
                // If logged in, navigate to respective home page
                if (user?.role === "student") {
                  navigate("/student/home");
                } else if (user?.role === "teacher") {
                  navigate("/teacher/home");
                }
              } else {
                // If not logged in, navigate to landing page
                navigate("/");
              }
            }}
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

            {/* Conditionally render Profile and Logout button */}
            {isLoggedIn ? (
              <>
                <button
                  className="text-gray-300 hover:text-white transition-colors flex items-center"
                  onClick={() => navigate("/profile")} // Navigate to profile page
                >
                  <User className="w-5 h-5 mr-1" /> Profile
                </button>
                <button
                  className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-2 rounded-full hover:from-red-700 hover:to-orange-700 transition-all duration-300 transform hover:scale-105"
                  onClick={handleLogout} // Call logout function
                >
                  Logout
                </button>
              </>
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
