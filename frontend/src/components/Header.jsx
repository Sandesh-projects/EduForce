import { Brain, User } from "lucide-react";
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify"; // For displaying notifications

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, logout, user } = useAuth(); // Get user status and data from AuthContext

  // Check if the current page is login or register
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";

  // Handle user logout
  const handleLogout = () => {
    logout(); // Clears user session
    toast.success("Logged out successfully!");
    navigate("/"); // Redirect to landing page
  };

  return (
    <nav className="relative z-50 px-6 py-4 bg-black bg-opacity-30">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo and App Name - Click to navigate */}
        <div
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => {
            // Navigate to user's specific home page if logged in, else to landing
            if (isLoggedIn) {
              if (user?.role === "student") {
                navigate("/student/home");
              } else if (user?.role === "teacher") {
                navigate("/teacher/home");
              }
            } else {
              navigate("/"); // Go to landing page if not logged in
            }
          }}
        >
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">EduForce</span>
        </div>

        {/* Navigation Links and Buttons */}
        <div className="hidden md:flex items-center space-x-8">
          {/* Show Features/How it Works links only if not on auth pages and not logged in */}
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

          {/* Conditional rendering for Profile/Logout vs. Sign In */}
          {isLoggedIn ? (
            <>
              {/* Profile button for logged-in users */}
              <button
                className="text-gray-300 hover:text-white transition-colors flex items-center"
                onClick={() => navigate("/profile")}
              >
                <User className="w-5 h-5 mr-1" /> Profile
              </button>
              {/* Logout button for logged-in users */}
              <button
                className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-2 rounded-full hover:from-red-700 hover:to-orange-700 transition-all duration-300 transform hover:scale-105"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            // Show Sign In button only if not on auth pages
            !isAuthPage && (
              <button
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105"
                onClick={() => navigate("/login")}
              >
                Sign In
              </button>
            )
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
