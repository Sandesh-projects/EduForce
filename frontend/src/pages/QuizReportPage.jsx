// frontend/src/pages/QuizReportPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../axios"; // Corrected import path for axios
import { toast } from "react-toastify";
import {
  CheckCircle2,
  XCircle,
  BarChart,
  AlertTriangle,
  Lightbulb,
  ListChecks,
} from "lucide-react";

const QuizReportPage = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      try {
        // API call already includes /api
        const response = await axios.get(
          `/api/quizzes/student/attempts/${attemptId}`
        );
        setReport(response.data);
      } catch (err) {
        console.error("Error fetching quiz report:", err);
        setError(
          "Failed to load quiz report. Please check the ID or your permissions."
        );
        toast.error("Failed to load quiz report.");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
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
          onClick={() => navigate("/student/quizzes/inventory")}
          className="mt-6 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-all"
        >
          Back to Attempts
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
  const proctoringStatus = geminiAnalytics.proctoringStatus || {
    isSuspicious: report.isSuspicious,
    feedback: "No specific feedback from AI.",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-bold mb-6 text-center bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent flex items-center justify-center">
          <BarChart className="w-10 h-10 mr-4" />
          Quiz Report: {report.quizTitle}
        </h1>
        <p className="text-xl text-gray-300 mb-8 text-center">
          Submitted on: {new Date(report.submittedAt).toLocaleDateString()} at{" "}
          {new Date(report.submittedAt).toLocaleTimeString()}
        </p>

        {/* Overall Summary */}
        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl mb-8">
          <h2 className="text-3xl font-semibold mb-4 text-purple-400 flex items-center">
            <CheckCircle2 className="w-7 h-7 mr-3 text-green-400" />
            Overall Performance
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
          <h2 className="text-3xl font-semibold mb-4 flex items-center ${proctoringStatus.isSuspicious ? 'text-red-400' : 'text-green-400'}">
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
              Your Strengths
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
                  Your Answer:{" "}
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
            onClick={() => navigate("/student/quizzes/inventory")}
            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-lg font-semibold transition-colors duration-200"
          >
            Back to All Attempts
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizReportPage;
