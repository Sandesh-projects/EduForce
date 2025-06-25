// src/components/Header.jsx

import { Brain } from "lucide-react";
import React from "react";
import { useNavigate, useLocation } from "react-router-dom"; // Import useLocation

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Get the current location object

  // Determine if the current path is /login or /register
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";

  return (
    <>
      <nav className="relative z-50 px-6 py-4 bg-black bg-opacity-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">EduForce</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            {/* Conditionally render Features link */}
            {!isAuthPage && (
              <a
                href="#features"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Features
              </a>
            )}
            {/* Conditionally render How it Works link */}
            {!isAuthPage && (
              <a
                href="#how-it-works"
                className="text-gray-300 hover:text-white transition-colors"
              >
                How it Works
              </a>
            )}
            <button
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105"
              onClick={() => {
                navigate("/login");
              }}
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Header;
