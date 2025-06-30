import { Brain, User, Menu, X } from "lucide-react"; // Import Menu and X icons
import React, { useState } from "react"; // Import useState
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, logout, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State for mobile menu visibility

  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully!");
    navigate("/");
    setIsMobileMenuOpen(false); // Close mobile menu on logout
  };

  const handleNavLinkClick = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false); // Close mobile menu when a navigation link is clicked
  };

  return (
    <nav className="relative z-50 px-6 py-4 bg-black bg-opacity-30">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo and App Name - Click to navigate */}
        <div
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => {
            if (isLoggedIn) {
              if (user?.role === "student") {
                handleNavLinkClick("/student/home");
              } else if (user?.role === "teacher") {
                handleNavLinkClick("/teacher/home");
              }
            } else {
              handleNavLinkClick("/");
            }
          }}
        >
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">EduForce</span>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white focus:outline-none"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-8 h-8" />
            ) : (
              <Menu className="w-8 h-8" />
            )}
          </button>
        </div>

        {/* Desktop Navigation Links and Buttons */}
        <div className="hidden md:flex items-center space-x-8">
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

          {isLoggedIn ? (
            <>
              <button
                className="text-gray-300 hover:text-white transition-colors flex items-center"
                onClick={() => handleNavLinkClick("/profile")}
              >
                <User className="w-5 h-5 mr-1" /> Profile
              </button>
              <button
                className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-2 rounded-full hover:from-red-700 hover:to-orange-700 transition-all duration-300 transform hover:scale-105"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            !isAuthPage && (
              <button
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105"
                onClick={() => handleNavLinkClick("/login")}
              >
                Sign In
              </button>
            )
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-black bg-opacity-90 py-4 shadow-lg">
          <div className="flex flex-col items-center space-y-4">
            {!isAuthPage && !isLoggedIn && (
              <>
                <a
                  href="#features"
                  className="text-gray-300 hover:text-white transition-colors text-lg"
                  onClick={() => setIsMobileMenuOpen(false)} // Close menu on click
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="text-gray-300 hover:text-white transition-colors text-lg"
                  onClick={() => setIsMobileMenuOpen(false)} // Close menu on click
                >
                  How it Works
                </a>
              </>
            )}

            {isLoggedIn ? (
              <>
                <button
                  className="text-gray-300 hover:text-white transition-colors flex items-center text-lg"
                  onClick={() => handleNavLinkClick("/profile")}
                >
                  <User className="w-6 h-6 mr-2" /> Profile
                </button>
                <button
                  className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-8 py-3 rounded-full text-lg hover:from-red-700 hover:to-orange-700 transition-all duration-300 transform hover:scale-105 w-auto"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              !isAuthPage && (
                <button
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 w-auto"
                  onClick={() => handleNavLinkClick("/login")}
                >
                  Sign In
                </button>
              )
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Header;
