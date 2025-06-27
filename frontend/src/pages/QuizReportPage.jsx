// frontend/src/pages/QuizReportPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../axios";
import { toast } from "react-toastify";
import {
  CheckCircle2,
  XCircle,
  BarChart,
  AlertTriangle,
  Lightbulb,
  ListChecks,
  Loader, // Added Loader icon
  ChevronLeft, // Added ChevronLeft icon for back button
} from "lucide-react";
import { useAuth } from "../context/AuthContext"; // Import useAuth to get user role

const QuizReportPage = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn, loading: authLoading } = useAuth(); // Get user and loading state from AuthContext

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      // Don't fetch if auth is still loading or user is not available
      if (authLoading || !user) {
        setLoading(false); // Set loading to false if auth isn't ready
        return;
      }

      setLoading(true);
      setError(null);
      try {
        let apiUrl = "";

        console.log("[QuizReportPage] Current User Role:", user?.role); // Debugging log
        console.log("[QuizReportPage] Attempt ID:", attemptId); // Debugging log

        if (user?.role === "student") {
          apiUrl = `/api/quizzes/student/attempts/${attemptId}`;
        } else if (user?.role === "teacher") {
          apiUrl = `/api/quizzes/teacher/attempts/${attemptId}`; // Use teacher-specific route for teacher
        } else {
          setError("Unauthorized: User role not recognized or not logged in.");
          setLoading(false);
          return;
        }

        console.log("[QuizReportPage] Fetching report from URL:", apiUrl); // Debugging log

        const response = await axios.get(apiUrl);
        setReport(response.data);
      } catch (err) {
        console.error(
          "Error fetching quiz report:",
          err.response?.data || err.message
        ); // Log full error response
        setError(
          err.response?.data?.message ||
            "Failed to load quiz report. Please check the ID or your permissions."
        );
        toast.error(
          err.response?.data?.message || "Failed to load quiz report."
        );
      } finally {
        setLoading(false);
      }
    };

    if (attemptId) {
      // Only fetch if attemptId is present and authentication is ready
      fetchReport();
    } else {
      setError("No quiz attempt ID provided.");
      setLoading(false);
    }
  }, [attemptId, user, authLoading]); // Added user and authLoading to dependencies

  // Handle back button navigation dynamically
  const handleBack = () => {
    if (user?.role === "teacher") {
      // Teachers would typically come from a quiz-specific attempts list
      // We need the quiz ID to go back to the correct list.
      // If `report.quiz._id` is available, use it. Otherwise, go to general teacher quizzes.
      if (report?.quiz?._id) {
        navigate(`/teacher/quizzes/${report.quiz._id}/attempts`);
      } else {
        navigate("/teacher/quizzes"); // Fallback
      }
    } else if (user?.role === "student") {
      navigate("/student/quizzes/inventory");
    } else {
      navigate("/"); // Fallback for unauthenticated or unknown role
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <Loader className="w-10 h-10 animate-spin mr-3 text-purple-400" />
        <p className="text-xl">Loading report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col items-center justify-center p-8">
        <XCircle className="w-20 h-20 text-red-500 mb-4" />
        <p className="text-2xl text-red-400 font-semibold">{error}</p>
        <button
          onClick={handleBack}
          className="mt-6 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-all flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 mr-2" /> Back
        </button>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <p className="text-xl">No report data available.</p>
      </div>
    );
  }

  const geminiAnalytics = report.geminiAnalytics || {};
  const overallSummary = geminiAnalytics.overallSummary || {};
  const strengths = geminiAnalytics.strengths || [];
  const areasForImprovement = geminiAnalytics.areasForImprovement || [];
  const questionFeedback = geminiAnalytics.questionFeedback || [];
  // Ensure proctoringStatus pulls from attempt.isSuspicious if geminiAnalytics.proctoringStatus is missing
  const proctoringStatus = geminiAnalytics.proctoringStatus || {
    isSuspicious: report.isSuspicious,
    feedback: report.isSuspicious
      ? "Suspicious activity was flagged for this attempt."
      : "No suspicious activity detected.",
  };

  // Access student's name for teacher's view
  const studentName = report.student?.fullName || "Unknown Student"; // Assuming 'student' is populated from backend

  // Dynamic titles and labels
  const isTeacher = user?.role === "teacher";
  const performanceHeading = isTeacher
    ? "Student Performance"
    : "Your Performance";
  const strengthsHeading = isTeacher ? "Student's Strengths" : "Your Strengths";
  const answerLabel = isTeacher ? "Student's Answer" : "Your Answer";
  const backButtonText = isTeacher
    ? "Back to Quiz Attempts Overview"
    : "Back to All Attempts";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={handleBack}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-full mb-8 inline-flex items-center transition-colors duration-300"
        >
          <ChevronLeft className="w-5 h-5 mr-2" /> Back
        </button>

        <h1 className="text-5xl font-bold mb-6 text-center bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent flex items-center justify-center">
          <BarChart className="w-10 h-10 mr-4" />
          Quiz Report: {report.quizTitle}
        </h1>
        {isTeacher && (
          <p className="text-xl text-gray-300 mb-2 text-center">
            Student: <span className="font-bold">{studentName}</span>
          </p>
        )}
        <p className="text-xl text-gray-300 mb-8 text-center">
          Submitted on: {new Date(report.submittedAt).toLocaleDateString()} at{" "}
          {new Date(report.submittedAt).toLocaleTimeString()}
        </p>

        {/* Overall Summary */}
        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl mb-8">
          <h2 className="text-3xl font-semibold mb-4 text-purple-400 flex items-center">
            <CheckCircle2 className="w-7 h-7 mr-3 text-green-400" />
            {performanceHeading}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-lg">
            <p>
              Score:{" "}
              <span className="font-bold text-white">
                {overallSummary.score || report.score} /{" "}
                {overallSummary.totalQuestions || report.totalQuestions}
              </span>
            </p>
            <p>
              Percentage:{" "}
              <span className="font-bold text-white">
                {overallSummary.percentage
                  ? overallSummary.percentage.toFixed(2)
                  : report.percentage.toFixed(2)}
                %
              </span>
            </p>
            <p className="col-span-1 md:col-span-3 text-gray-300">
              Message:{" "}
              <span className="italic text-white">
                {overallSummary.message || "No specific message from AI."}
              </span>
            </p>
          </div>
        </div>

        {/* Proctoring Status */}
        <div
          className={`bg-gray-800/30 backdrop-blur-sm border ${
            proctoringStatus.isSuspicious
              ? "border-red-700"
              : "border-green-700"
          } rounded-2xl p-6 shadow-xl mb-8`}
        >
          <h2
            className={`text-3xl font-semibold mb-4 flex items-center ${
              proctoringStatus.isSuspicious ? "text-red-400" : "text-green-400"
            }`}
          >
            {proctoringStatus.isSuspicious ? (
              <AlertTriangle className="w-7 h-7 mr-3" />
            ) : (
              <CheckCircle2 className="w-7 h-7 mr-3" />
            )}
            Proctoring Status
          </h2>
          <p
            className={`text-lg ${
              proctoringStatus.isSuspicious ? "text-red-300" : "text-green-300"
            }`}
          >
            {proctoringStatus.feedback ||
              "No specific proctoring feedback available."}
          </p>
        </div>

        {/* Strengths */}
        {strengths.length > 0 && (
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl mb-8">
            <h2 className="text-3xl font-semibold mb-4 text-green-400 flex items-center">
              <Lightbulb className="w-7 h-7 mr-3" />
              {strengthsHeading}
            </h2>
            <ul className="list-disc list-inside text-lg text-gray-300 space-y-2">
              {strengths.map((s, index) => (
                <li key={index}>
                  <span className="font-semibold text-white">{s.topic}</span>:{" "}
                  {s.performance}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Areas for Improvement */}
        {areasForImprovement.length > 0 && (
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl mb-8">
            <h2 className="text-3xl font-semibold mb-4 text-orange-400 flex items-center">
              <XCircle className="w-7 h-7 mr-3" />
              Areas for Improvement
            </h2>
            <ul className="list-disc list-inside text-lg text-gray-300 space-y-2">
              {areasForImprovement.map((a, index) => (
                <li key={index}>
                  <span className="font-semibold text-white">{a.topic}</span>:{" "}
                  {a.suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Question-level Feedback */}
        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl mb-8">
          <h2 className="text-3xl font-semibold mb-4 text-blue-400 flex items-center">
            <ListChecks className="w-7 h-7 mr-3" />
            Detailed Question Feedback
          </h2>
          <div className="space-y-6">
            {questionFeedback.map((qf, index) => (
              <div
                key={qf.questionId}
                className="p-4 rounded-lg bg-gray-700/50 border border-gray-600"
              >
                <p className="text-xl font-semibold mb-2 text-white">
                  Q{index + 1}: {qf.questionText}
                </p>
                <p className="text-lg mb-1">
                  {answerLabel}:{" "}
                  <span
                    className={`${
                      qf.isCorrect ? "text-green-400" : "text-red-400"
                    } font-semibold`}
                  >
                    {qf.selectedAnswer}
                  </span>
                </p>
                {!qf.isCorrect && (
                  <p className="text-lg mb-1">
                    Correct Answer:{" "}
                    <span className="text-green-400 font-semibold">
                      {qf.correctAnswer}
                    </span>
                  </p>
                )}
                <p className="text-md text-gray-300 mb-2">
                  Topic: <span className="font-medium">{qf.topic}</span> |
                  Difficulty:{" "}
                  <span className="font-medium">{qf.difficulty}</span>
                </p>
                <p className="text-md italic text-gray-400">
                  Explanation: {qf.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={handleBack}
            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-lg font-semibold transition-colors duration-200"
          >
            {backButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizReportPage;
