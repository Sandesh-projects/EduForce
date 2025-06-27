// frontend/src/pages/StudentQuizAttemptReportPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../axios"; // Adjust import path as needed
import { toast } from "react-toastify";
import {
  Award,
  CheckCircle,
  XCircle,
  Loader,
  Frown,
  Lightbulb,
  Target,
  BookOpen,
  Clock,
  AlertTriangle,
  MessageSquare,
  ClipboardCheck,
  ClipboardX,
} from "lucide-react"; // Icons from lucide-react

const StudentQuizAttemptReportPage = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attemptData, setAttemptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAttemptReport = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch the detailed quiz attempt report for the student
        // This route is now accessible by teachers as well, if needed for testing
        const response = await axios.get(
          `/api/quizzes/student/attempts/${attemptId}`
        );
        setAttemptData(response.data);
      } catch (err) {
        console.error("Error fetching quiz attempt report:", err);
        setError(
          "Failed to load quiz attempt report. " +
            (err.response?.data?.message || err.message)
        );
        toast.error("Failed to load quiz attempt report.");
      } finally {
        setLoading(false);
      }
    };

    if (attemptId) {
      fetchAttemptReport();
    } else {
      setError("No attempt ID provided.");
      setLoading(false);
    }
  }, [attemptId]); // Re-fetch if attemptId changes

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col items-center justify-center p-8">
        <Loader className="w-12 h-12 animate-spin text-purple-400 mb-4" />
        <p className="text-xl">Loading your quiz report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col items-center justify-center p-8">
        <Frown className="w-16 h-16 text-red-400 mb-6" />
        <h2 className="text-2xl font-bold mb-4">Error Loading Report</h2>
        <p className="text-lg text-red-300 text-center">{error}</p>
        <button
          onClick={() => navigate("/student/quizzes/inventory")}
          className="mt-8 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors duration-200 shadow-lg"
        >
          Go to Attempts Inventory
        </button>
      </div>
    );
  }

  if (!attemptData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col items-center justify-center p-8">
        <Frown className="w-16 h-16 text-gray-400 mb-6" />
        <h2 className="text-2xl font-bold mb-4">Report Not Found</h2>
        <p className="text-lg text-gray-300 text-center">
          No data available for this quiz attempt.
        </p>
        <button
          onClick={() => navigate("/student/quizzes/inventory")}
          className="mt-8 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors duration-200 shadow-lg"
        >
          Go to Attempts Inventory
        </button>
      </div>
    );
  }

  const {
    quizTitle,
    quizSubject,
    quizTopic,
    score,
    totalQuestions,
    percentage,
    submittedAt,
    isSuspicious,
    answers: studentAnswers,
    geminiAnalytics,
    quiz: originalQuiz, // Populated quiz from the attempt
  } = attemptData;

  // Helper to find original question details including correct answer
  const getQuestionDetails = (questionId) => {
    return originalQuiz?.questions.find((q) => q.id === questionId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-xl p-8">
        <h1 className="text-4xl font-bold mb-6 text-center bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent flex items-center justify-center">
          <ClipboardCheck className="w-10 h-10 mr-3" />
          Quiz Attempt Report
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-lg">
          <div className="flex items-center bg-gray-700/70 p-4 rounded-lg shadow-md">
            <BookOpen className="w-7 h-7 text-purple-400 mr-3" />
            <strong>Quiz Title:</strong> {quizTitle}
          </div>
          <div className="flex items-center bg-gray-700/70 p-4 rounded-lg shadow-md">
            <Target className="w-7 h-7 text-purple-400 mr-3" />
            <strong>Subject:</strong> {quizSubject}
          </div>
          <div className="flex items-center bg-gray-700/70 p-4 rounded-lg shadow-md">
            <Lightbulb className="w-7 h-7 text-purple-400 mr-3" />
            <strong>Topic:</strong> {quizTopic}
          </div>
          <div className="flex items-center bg-gray-700/70 p-4 rounded-lg shadow-md">
            <Clock className="w-7 h-7 text-purple-400 mr-3" />
            <strong>Date Submitted:</strong>{" "}
            {new Date(submittedAt).toLocaleString()}
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-around items-center bg-gray-700/70 p-6 rounded-2xl shadow-xl mb-10 text-center">
          <div className="flex flex-col items-center p-4">
            <Award className="w-12 h-12 text-yellow-400 mb-2" />
            <span className="text-2xl font-bold">
              Score: {score} / {totalQuestions}
            </span>
          </div>
          <div className="flex flex-col items-center p-4">
            {percentage >= 70 ? (
              <CheckCircle className="w-12 h-12 text-green-400 mb-2" />
            ) : (
              <XCircle className="w-12 h-12 text-red-400 mb-2" />
            )}
            <span className="text-2xl font-bold">
              Percentage: {percentage.toFixed(2)}%
            </span>
          </div>
          <div className="flex flex-col items-center p-4">
            {isSuspicious ? (
              <AlertTriangle className="w-12 h-12 text-orange-400 mb-2" />
            ) : (
              <ClipboardCheck className="w-12 h-12 text-blue-400 mb-2" />
            )}
            <span className="text-2xl font-bold">
              Suspicious Activity: {isSuspicious ? "Yes" : "No"}
            </span>
          </div>
        </div>

        {/* Gemini Analytics Section */}
        {geminiAnalytics && (
          <div className="bg-gray-700/70 p-8 rounded-2xl shadow-xl mb-10">
            <h2 className="text-3xl font-bold text-purple-300 mb-6 text-center">
              <MessageSquare className="inline-block w-8 h-8 mr-2" />
              AI-Powered Feedback
            </h2>

            {/* Overall Summary */}
            <div className="bg-gray-600/50 p-6 rounded-xl mb-6 border border-purple-500/30">
              <h3 className="text-2xl font-semibold text-purple-200 mb-3 flex items-center">
                <ClipboardCheck className="w-6 h-6 mr-2" /> Overall Performance
                Summary
              </h3>
              <p className="text-lg text-gray-200">
                {geminiAnalytics.overallSummary?.message ||
                  "No overall summary provided."}
              </p>
            </div>

            {/* Strengths */}
            {geminiAnalytics.strengths &&
              geminiAnalytics.strengths.length > 0 && (
                <div className="bg-green-800/30 p-6 rounded-xl mb-6 border border-green-500/30">
                  <h3 className="text-2xl font-semibold text-green-300 mb-3 flex items-center">
                    <CheckCircle className="w-6 h-6 mr-2" /> Strengths
                  </h3>
                  <ul className="list-disc list-inside text-lg text-green-200">
                    {geminiAnalytics.strengths.map((strength, index) => (
                      <li key={index} className="mb-1">
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {/* Areas for Improvement */}
            {geminiAnalytics.areasForImprovement &&
              geminiAnalytics.areasForImprovement.length > 0 && (
                <div className="bg-red-800/30 p-6 rounded-xl mb-6 border border-red-500/30">
                  <h3 className="text-2xl font-semibold text-red-300 mb-3 flex items-center">
                    <XCircle className="w-6 h-6 mr-2" /> Areas for Improvement
                  </h3>
                  <ul className="list-disc list-inside text-lg text-red-200">
                    {geminiAnalytics.areasForImprovement.map((area, index) => (
                      <li key={index} className="mb-1">
                        <strong>{area.topic}:</strong> {area.suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {/* Question-Specific Feedback */}
            {geminiAnalytics.questionFeedback &&
              geminiAnalytics.questionFeedback.length > 0 && (
                <div className="bg-gray-600/50 p-6 rounded-xl border border-gray-500/30">
                  <h3 className="text-2xl font-semibold text-purple-200 mb-4 flex items-center">
                    <Lightbulb className="w-6 h-6 mr-2" /> Question-by-Question
                    Feedback
                  </h3>
                  {geminiAnalytics.questionFeedback.map((feedback, index) => {
                    // Get original question details from the populated quiz object
                    const originalQuestion = getQuestionDetails(
                      feedback.questionId
                    );
                    const selectedOptionText =
                      originalQuestion?.options.find(
                        (opt) => opt.id === feedback.selectedOptionId
                      )?.text || feedback.selectedAnswer;
                    const correctAnswerText =
                      originalQuestion?.options.find(
                        (opt) => opt.id === originalQuestion?.correctAnswerId
                      )?.text || feedback.correctAnswer;

                    return (
                      <div
                        key={feedback.questionId || index}
                        className={`mb-6 p-4 rounded-lg shadow-md ${
                          feedback.isCorrect
                            ? "bg-green-700/30 border-green-500"
                            : "bg-red-700/30 border-red-500"
                        } border-l-4`}
                      >
                        <p className="text-lg font-medium text-gray-100 mb-2">
                          <span className="font-bold">
                            Question {index + 1}:
                          </span>{" "}
                          {originalQuestion?.questionText ||
                            feedback.questionText}
                        </p>
                        <p className="text-md text-gray-200 mb-1 flex items-center">
                          Selected Answer: {selectedOptionText}
                          {feedback.isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-green-400 ml-2" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-400 ml-2" />
                          )}
                        </p>
                        <p className="text-md text-gray-200 mb-1">
                          Correct Answer:{" "}
                          <span className="font-semibold">
                            {correctAnswerText}
                          </span>
                        </p>
                        <p className="text-md text-gray-200">
                          Explanation: {feedback.explanation}
                        </p>
                        {feedback.topic && (
                          <p className="text-sm text-gray-300 mt-2">
                            Topic: {feedback.topic}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
          </div>
        )}

        <div className="text-center mt-10">
          <button
            onClick={() => navigate("/student/quizzes/inventory")}
            className="px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-xl text-white font-bold text-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Back to My Quiz Attempts
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentQuizAttemptReportPage;
