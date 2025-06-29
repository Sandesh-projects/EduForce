import React, { useState } from "react";
import { User, Mail, Lock, Brain, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "../axios"; // Axios for API calls

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "student", // Default role
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // API error message

  // Handles changes to form input fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handles user registration form submission
  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage(""); // Clear previous errors

    // Basic form validation
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.password ||
      !formData.role
    ) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    setIsLoading(true); // Start loading

    try {
      const response = await axios.post("/api/auth/register", formData);
      alert("Registration successful! You can now log in."); // Success message
      setFormData({ fullName: "", email: "", password: "", role: "student" }); // Reset form
      navigate("/login"); // Redirect to login
    } catch (error) {
      console.error("Error during registration:", error);
      // Display specific error message from backend or generic error
      if (error.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else if (error.request) {
        setErrorMessage("No response from server. Please try again later.");
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-6 py-8">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Header section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-white">EduForce</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-2">Join EduForce</h2>
          <p className="text-gray-300">
            Create your account and start your learning journey
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleRegister} className="space-y-5">
            {/* Error message display */}
            {errorMessage && (
              <div className="bg-red-500 bg-opacity-20 text-red-300 border border-red-400 rounded-md p-3 text-sm text-center">
                {errorMessage}
              </div>
            )}

            {/* Role Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Register as
              </label>
              <div className="flex space-x-4 mt-1">
                <label
                  className={`flex items-center px-4 py-2 rounded-xl border transition-all duration-200 cursor-pointer
                    ${
                      formData.role === "student"
                        ? "bg-purple-600/20 border-purple-500 text-purple-200 shadow-md"
                        : "bg-gray-800/40 border-gray-600 text-gray-300 hover:border-purple-400"
                    }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="student"
                    checked={formData.role === "student"}
                    onChange={handleInputChange}
                    className="form-radio h-4 w-4 text-purple-600 bg-gray-800/50 border-gray-600 focus:ring-purple-500 accent-purple-600"
                  />
                  <span className="ml-2 font-semibold">Student</span>
                </label>
                <label
                  className={`flex items-center px-4 py-2 rounded-xl border transition-all duration-200 cursor-pointer
                    ${
                      formData.role === "teacher"
                        ? "bg-pink-600/20 border-pink-500 text-pink-200 shadow-md"
                        : "bg-gray-800/40 border-gray-600 text-gray-300 hover:border-pink-400"
                    }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="teacher"
                    checked={formData.role === "teacher"}
                    onChange={handleInputChange}
                    className="form-radio h-4 w-4 text-pink-600 bg-gray-800/50 border-gray-600 focus:ring-pink-500 accent-pink-600"
                  />
                  <span className="ml-2 font-semibold">Teacher</span>
                </label>
              </div>
            </div>

            {/* Full Name Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="fullName"
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 pl-12 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 pl-12 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a password"
                  className="w-full px-4 py-3 pl-12 pr-12 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="text-center mt-6">
            <p className="text-gray-400">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
