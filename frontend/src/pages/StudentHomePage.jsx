// frontend/src/pages/StudentHomePage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { BookOpen, Award, ListChecks, Search, BarChart3 } from "lucide-react";

const StudentHomePage = () => {
  const [subject, setSubject] = useState("");
  const [quizCode, setQuizCode] = useState("");
  const navigate = useNavigate();

  const handleTakeTest = () => {
    if (!subject || !quizCode) {
      toast.error("Please enter both Subject Name and Quiz Code.");
      return;
    }
    // Navigate to the quiz taking page. The quizCode will be part of the URL.
    navigate(`/student/take-quiz/${quizCode}`);
  };

  const handleViewPreviousQuizzes = () => {
    navigate("/student/quizzes/inventory");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col items-center p-8">
      <div className="max-w-4xl w-full text-center py-12">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Welcome, Student!
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Your personalized learning dashboard. Get ready to test your
          knowledge!
        </p>
      </div>

      <div className="w-full max-w-2xl bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-xl mb-12">
        <h2 className="text-3xl font-semibold mb-6 text-white flex items-center justify-center">
          <BookOpen className="w-8 h-8 mr-3 text-purple-400" />
          Take a New Quiz
        </h2>
        <div className="space-y-6">
          <div>
            <label
              htmlFor="subjectName"
              className="block text-gray-300 text-lg font-medium mb-2"
            >
              Subject Name
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
          <div>
            <label
              htmlFor="quizCode"
              className="block text-gray-300 text-lg font-medium mb-2"
            >
              Quiz Code
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
          <button
            onClick={handleTakeTest}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-full text-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
          >
            <Award className="w-5 h-5 mr-2" />
            Start Quiz
          </button>
        </div>
      </div>

      <div className="w-full max-w-2xl bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-xl">
        <h2 className="text-3xl font-semibold mb-6 text-white flex items-center justify-center">
          <ListChecks className="w-8 h-8 mr-3 text-pink-400" />
          Review Your Progress
        </h2>
        <p className="text-gray-300 text-lg mb-6 text-center">
          Access your past quiz attempts and detailed performance reports.
        </p>
        <button
          onClick={handleViewPreviousQuizzes}
          className="w-full bg-gradient-to-r from-teal-500 to-blue-500 text-white px-6 py-3 rounded-full text-lg font-semibold hover:from-teal-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
        >
          <BarChart3 className="w-5 h-5 mr-2" />
          View My Quiz Reports
        </button>
      </div>
    </div>
  );
};

export default StudentHomePage;
