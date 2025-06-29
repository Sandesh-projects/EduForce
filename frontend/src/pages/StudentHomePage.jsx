// frontend/src/pages/StudentHomePage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "../axios";
import { BookOpen, Award, ListChecks, BarChart3 } from "lucide-react";

const StudentHomePage = () => {
  // State for subject name (optional) and quiz code
  const [subject, setSubject] = useState("");
  const [quizCode, setQuizCode] = useState("");
  // Hook for navigation
  const navigate = useNavigate();

  // Handler for taking a new quiz
  const handleTakeTest = async () => {
    // Validate if quiz code is entered
    if (!quizCode) {
      toast.error("Please enter the Quiz Code.");
      return;
    }
    try {
      // Check if the student has already attempted this quiz
      const { data } = await axios.get(
        `/api/student/quizzes/check-attempt/${quizCode.toUpperCase()}`
      );
      // Prevent re-attempt if already completed
      if (data.hasAttempted) {
        toast.warn(
          "You have already completed this quiz. You cannot re-attempt it."
        );
        return;
      }
      // Navigate to the quiz taking page
      navigate(`/student/take-quiz/${quizCode.toUpperCase()}`);
    } catch (error) {
      // Log and display error if API call fails
      console.error("Error checking quiz attempt status:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to check quiz status. Please try again."
      );
    }
  };

  // Handler for viewing previous quizzes
  const handleViewPreviousQuizzes = () => {
    // Navigate to the quiz inventory page
    navigate("/student/quizzes/inventory");
  };

  return (
    // Main container with gradient background and styling
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col items-center p-8">
      {/* Header section */}
      <div className="max-w-4xl w-full text-center py-12">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Welcome, Student!
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Your personalized learning dashboard. Get ready to test your
          knowledge!
        </p>
      </div>

      {/* Cards container for quiz actions */}
      <div className="w-full max-w-5xl flex flex-col md:flex-row gap-8">
        {/* Take a New Quiz Card */}
        <div className="w-full md:w-1/2 bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-xl">
          <h2 className="text-3xl font-semibold mb-6 text-white flex items-center justify-center">
            <BookOpen className="w-8 h-8 mr-3 text-purple-400" />
            Take a New Quiz
          </h2>
          <div className="space-y-6">
            {/* Subject Name Input */}
            <div>
              <label
                htmlFor="subjectName"
                className="block text-gray-300 text-lg font-medium mb-2"
              >
                Subject Name (Optional)
              </label>
              <input
                type="text"
                id="subjectName"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Ethical Hacking"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            {/* Quiz Code Input */}
            <div>
              <label
                htmlFor="quizCode"
                className="block text-gray-300 text-lg font-medium mb-2"
              >
                Quiz Code <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="quizCode"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., ABCDEFG"
                value={quizCode}
                onChange={(e) => setQuizCode(e.target.value)}
              />
            </div>
            {/* Start Quiz Button */}
            <button
              onClick={handleTakeTest}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-full text-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
            >
              <Award className="w-5 h-5 mr-2" />
              Start Quiz
            </button>
          </div>
        </div>

        {/* Review Your Progress Card */}
        <div className="w-full md:w-1/2 bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-xl">
          <h2 className="text-3xl font-semibold mb-6 text-white flex items-center justify-center">
            <ListChecks className="w-8 h-8 mr-3 text-pink-400" />
            Review Your Progress
          </h2>
          <p className="text-gray-300 text-lg mb-6 text-center">
            Access your past quiz attempts and detailed performance reports.
          </p>
          {/* View Quiz Reports Button */}
          <button
            onClick={handleViewPreviousQuizzes}
            className="w-full bg-gradient-to-r from-teal-500 to-blue-500 text-white px-6 py-3 rounded-full text-lg font-semibold hover:from-teal-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
          >
            <BarChart3 className="w-5 h-5 mr-2" />
            View My Quiz Reports
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentHomePage;
