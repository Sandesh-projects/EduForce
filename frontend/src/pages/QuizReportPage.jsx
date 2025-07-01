// frontend/src/pages/QuizReportPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../axios";
import { toast } from "react-toastify";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  ListChecks,
  Loader,
  ChevronLeft,
  Download,
  Award,
  BookOpen,
  Clock,
  Target,
  User,
  Shield, // For proctoring status
  Star, // For strengths
  MessageSquare, // For AI feedback section
  Frown, // Added for "No report available" state
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import jsPDF from "jspdf"; // Keep this import for now, as it's used directly
import "jspdf-autotable"; // Ensure this is imported if you're using it

const QuizReportPage = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn, loading: authLoading } = useAuth();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Memoized function to fetch report data
  const fetchReport = useCallback(async () => {
    // Only fetch if authentication is ready and user data is available
    if (authLoading || !user) {
      if (!authLoading) {
        // If auth loading is done but user is null
        setError("Unauthorized: User role not recognized or not logged in.");
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let apiUrl = "";

      // Determine API URL based on user role
      if (user?.role === "student") {
        apiUrl = `/api/student/quizzes/attempts/${attemptId}`;
      } else if (user?.role === "teacher") {
        apiUrl = `/api/quizzes/teacher/attempts/${attemptId}`;
      } else {
        setError("Unauthorized: User role not recognized.");
        setLoading(false);
        return;
      }

      const response = await axios.get(apiUrl);
      setReport(response.data);
    } catch (err) {
      console.error(
        "Error fetching quiz report:",
        err.response?.data || err.message
      );
      setError(
        err.response?.data?.message ||
          "Failed to load quiz report. Please check the ID or your permissions."
      );
      toast.error(err.response?.data?.message || "Failed to load quiz report.");
    } finally {
      setLoading(false);
    }
  }, [attemptId, user, authLoading]);

  // Effect hook to call fetchReport on component mount or dependency change
  useEffect(() => {
    if (attemptId) {
      fetchReport();
    } else {
      setError("No quiz attempt ID provided.");
      setLoading(false);
    }
  }, [attemptId, fetchReport]);

  // Handle back button navigation dynamically based on user role
  const handleBack = useCallback(() => {
    if (user?.role === "teacher") {
      // Teachers would typically come from a quiz-specific attempts list
      // If `report.quiz._id` is available, use it. Otherwise, go to general teacher quizzes.
      if (report?.quiz?._id) {
        // Navigate back to the specific quiz's attempts list
        navigate(`/teacher/quizzes/${report.quiz._id}/attempts`);
      } else {
        // Fallback to general teacher quizzes if quiz ID is not available
        navigate("/teacher/quizzes");
      }
    } else if (user?.role === "student") {
      navigate("/student/quizzes/inventory");
    } else {
      navigate("/"); // Fallback for unauthenticated or unknown role
    }
  }, [navigate, user, report]); // Added report to dependencies for handleBack

  // Helper to find original question details including correct answer
  const getQuestionDetails = useCallback(
    (questionId) => {
      // This assumes `report.quiz` is populated correctly from the backend on the attempt object.
      return report?.quiz?.questions.find((q) => q.id === questionId);
    },
    [report]
  );

  // Handle PDF generation and download
  const generatePDF = async () => {
    if (!report) {
      toast.error("No report data available to generate PDF.");
      return;
    }
    setIsGeneratingPDF(true);

    try {
      const doc = new jsPDF("p", "mm", "a4"); // 'p' for portrait, 'mm' for millimeters, 'a4' for size
      let y = 20; // Initial Y position
      const margin = 20;
      const lineHeight = 7;
      const sectionSpacing = 10;
      const pageHeight = doc.internal.pageSize.height;
      const contentWidth = doc.internal.pageSize.width - 2 * margin;

      // Set font properties
      doc.setFont("helvetica", "normal");
      doc.setTextColor(33, 33, 33); // Dark gray for text

      // Function to add a new page if content exceeds current page height
      const addPageIfNeeded = (requiredSpace) => {
        if (y + requiredSpace > pageHeight - margin) {
          doc.addPage();
          y = margin;
          doc.setFontSize(10);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Page ${doc.internal.getNumberOfPages()}`,
            doc.internal.pageSize.width - margin - 10,
            10
          );
          doc.setTextColor(33, 33, 33); // Reset text color
          doc.setFontSize(12); // Reset font size
        }
      };

      // --- Title Section ---
      addPageIfNeeded(30);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("Quiz Attempt Report", margin, y);
      y += 10;
      doc.setFontSize(16);
      doc.text(`${report.quizTitle || "N/A"}`, margin, y);
      y += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Subject: ${report.quizSubject || "N/A"} | Topic: ${
          report.quizTopic || "N/A"
        }`,
        margin,
        y
      );
      y += 5;
      doc.text(
        `Submitted On: ${
          report.submittedAt
            ? new Date(report.submittedAt).toLocaleString()
            : "N/A"
        }`,
        margin,
        y
      );
      y += 5;
      if (isTeacher) {
        doc.text(
          `Student: ${report.student?.fullName || "Unknown Student"}`,
          margin,
          y
        );
        y += 5;
      }
      y += sectionSpacing;

      // --- Performance Summary ---
      addPageIfNeeded(40);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Overall Performance", margin, y);
      y += lineHeight;
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Score: ${report.score || 0} / ${report.totalQuestions || 0}`,
        margin,
        y
      );
      y += lineHeight;
      doc.text(
        `Percentage: ${
          report.percentage !== undefined ? report.percentage.toFixed(2) : "N/A"
        }%`,
        margin,
        y
      );
      y += lineHeight;
      doc.text(
        `Suspicious Activity: ${report.isSuspicious ? "Detected" : "None"}`,
        margin,
        y
      );
      y += sectionSpacing;

      // --- AI-Powered Feedback (Gemini Analytics) ---
      const geminiAnalytics = report.geminiAnalytics || {};
      const overallSummary = geminiAnalytics.overallSummary || {};
      const strengths = geminiAnalytics.strengths || [];
      const areasForImprovement = geminiAnalytics.areasForImprovement || [];
      const questionFeedback = geminiAnalytics.questionFeedback || [];
      const proctoringStatus = geminiAnalytics.proctoringStatus || {
        isSuspicious: report.isSuspicious,
        feedback: report.isSuspicious
          ? "Suspicious activity was flagged for this attempt."
          : "No suspicious activity detected.",
      };

      if (
        overallSummary.message ||
        strengths.length > 0 ||
        areasForImprovement.length > 0 ||
        questionFeedback.length > 0 ||
        proctoringStatus.feedback
      ) {
        addPageIfNeeded(30);
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text("AI-Powered Feedback", margin, y);
        y += sectionSpacing;

        // Overall Summary
        if (overallSummary.message) {
          addPageIfNeeded(lineHeight * 3);
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.text("Overall Summary:", margin + 5, y);
          y += lineHeight;
          doc.setFontSize(12);
          doc.setFont("helvetica", "normal");
          const splitSummary = doc.splitTextToSize(
            overallSummary.message,
            contentWidth - 10
          );
          doc.text(splitSummary, margin + 5, y);
          y += splitSummary.length * lineHeight + sectionSpacing / 2;
        }

        // Proctoring Status (if detailed feedback is available from AI)
        if (
          proctoringStatus.feedback &&
          proctoringStatus.feedback !==
            (report.isSuspicious
              ? "Suspicious activity was flagged for this attempt."
              : "No suspicious activity detected.")
        ) {
          addPageIfNeeded(lineHeight * 3);
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.text("Proctoring Feedback:", margin + 5, y);
          y += lineHeight;
          doc.setFontSize(12);
          doc.setFont("helvetica", "normal");
          const splitProctoring = doc.splitTextToSize(
            proctoringStatus.feedback,
            contentWidth - 10
          );
          doc.text(splitProctoring, margin + 5, y);
          y += splitProctoring.length * lineHeight + sectionSpacing / 2;
        }

        // Strengths
        if (strengths.length > 0) {
          addPageIfNeeded(lineHeight * strengths.length + 15);
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.text("Strengths:", margin + 5, y);
          y += lineHeight;
          doc.setFontSize(12);
          doc.setFont("helvetica", "normal");
          strengths.forEach((s) => {
            // ASSUMPTION: s is a string, not an object {topic, performance}
            const strengthText = `• ${s}`; // Directly use the string `s`
            const splitText = doc.splitTextToSize(
              strengthText,
              contentWidth - 15
            );
            doc.text(splitText, margin + 10, y);
            y += splitText.length * lineHeight;
          });
          y += sectionSpacing / 2;
        }

        // Areas for Improvement
        if (areasForImprovement.length > 0) {
          addPageIfNeeded(lineHeight * areasForImprovement.length + 15);
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.text("Areas for Improvement:", margin + 5, y);
          y += lineHeight;
          doc.setFontSize(12);
          doc.setFont("helvetica", "normal");
          areasForImprovement.forEach((a) => {
            // ASSUMPTION: a is a string, not an object {topic, suggestion}
            const improvementText = `• ${a}`; // Directly use the string `a`
            const splitText = doc.splitTextToSize(
              improvementText,
              contentWidth - 15
            );
            doc.text(splitText, margin + 10, y);
            y += splitText.length * lineHeight;
          });
          y += sectionSpacing / 2;
        }

        // Question-by-Question Feedback
        if (questionFeedback.length > 0) {
          addPageIfNeeded(lineHeight * 2 + 15); // Initial space for heading
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.text("Question-by-Question Feedback:", margin + 5, y);
          y += lineHeight + 5;

          questionFeedback.forEach((qf, index) => {
            addPageIfNeeded(lineHeight * 6); // Estimate space for each question feedback

            const originalQuestion = getQuestionDetails(qf.questionId);
            const selectedAnswerText =
              originalQuestion?.options?.find(
                (opt) => opt.id === qf.selectedOptionId
              )?.text ||
              qf.selectedAnswer ||
              "N/A"; // Added N/A fallback

            const correctAnswerText =
              originalQuestion?.options?.find(
                (opt) => opt.id === originalQuestion?.correctAnswerId
              )?.text ||
              qf.correctAnswer ||
              "N/A"; // Added N/A fallback

            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            const qText = `Q${index + 1}: ${
              originalQuestion?.questionText || qf.questionText || "N/A"
            }`;
            const splitQText = doc.splitTextToSize(qText, contentWidth - 10);
            doc.text(splitQText, margin + 10, y);
            y += splitQText.length * lineHeight;

            doc.setFont("helvetica", "normal");
            doc.setTextColor(50, 50, 50); // Slightly lighter for answers

            const selectedAns = `Selected Answer: ${selectedAnswerText} ${
              qf.isCorrect ? "(Correct)" : "(Incorrect)"
            }`;
            const splitSelectedAns = doc.splitTextToSize(
              selectedAns,
              contentWidth - 15
            );
            doc.text(splitSelectedAns, margin + 15, y);
            y += splitSelectedAns.length * lineHeight;

            if (!qf.isCorrect) {
              const correctAns = `Correct Answer: ${correctAnswerText}`;
              const splitCorrectAns = doc.splitTextToSize(
                correctAns,
                contentWidth - 15
              );
              doc.text(splitCorrectAns, margin + 15, y);
              y += splitCorrectAns.length * lineHeight;
            }

            const explanation = `Explanation: ${qf.explanation || "N/A"}`;
            const splitExplanation = doc.splitTextToSize(
              explanation,
              contentWidth - 15
            );
            doc.text(splitExplanation, margin + 15, y);
            y += splitExplanation.length * lineHeight;

            doc.setTextColor(100, 100, 100); // For meta info
            doc.setFontSize(9);
            doc.text(
              `Topic: ${qf.topic || "N/A"} | Difficulty: ${
                qf.difficulty || "N/A"
              }`,
              margin + 15,
              y
            );
            y += lineHeight + sectionSpacing / 2; // Add extra spacing after each question
            doc.setTextColor(33, 33, 33); // Reset text color
            doc.setFontSize(12); // Reset font size
          });
        }
      }

      // Final save
      const studentNameForFilename =
        isTeacher && report.student?.fullName
          ? report.student.fullName.replace(/[^a-zA-Z0-9]/g, "_")
          : "Student";
      const quizTitleForFilename = report.quizTitle
        ? report.quizTitle.replace(/[^a-zA-Z0-9]/g, "_")
        : "Quiz";

      doc.save(
        `EduForce_QuizReport_${quizTitleForFilename}_${studentNameForFilename}_${
          new Date().toISOString().split("T")[0]
        }.pdf`
      );
      toast.success("PDF report downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF report: " + error.message);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Determine user role for dynamic text
  const isTeacher = user?.role === "teacher";
  const performanceHeading = isTeacher
    ? "Student Performance"
    : "Your Performance";
  const strengthsHeading = isTeacher ? "Student's Strengths" : "Your Strengths";
  const answerLabel = isTeacher ? "Student's Answer" : "Your Answer";
  const backButtonText = isTeacher
    ? "Back to Quiz Attempts Overview"
    : "Back to My Quiz Attempts";

  // Dynamic colors based on percentage score
  const getScoreColorClass = (percentage) => {
    if (percentage >= 80) return "text-green-400";
    if (percentage >= 60) return "text-yellow-400";
    return "text-red-400";
  };
  const getCardBgColorClass = (percentage) => {
    if (percentage >= 80) return "bg-green-800/30 border-green-500/30";
    if (percentage >= 60) return "bg-yellow-800/30 border-yellow-500/30";
    return "bg-red-800/30 border-red-500/30";
  };

  const percentage = report?.percentage; // Ensure this is available from report object

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col items-center justify-center p-8">
        <Loader className="w-12 h-12 animate-spin text-purple-400 mb-4" />
        <p className="text-xl font-semibold">Loading your quiz report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center p-8">
        <div className="text-center p-8 bg-gray-800/70 rounded-2xl shadow-2xl border border-gray-700 max-w-md">
          <AlertTriangle className="w-20 h-20 text-red-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-red-400 mb-4">
            Error Loading Report
          </h2>
          <p className="text-gray-300 mb-8 text-lg">{error}</p>
          <button
            onClick={handleBack}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-white font-semibold transition-all duration-300 flex items-center mx-auto shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <ChevronLeft className="w-5 h-5 mr-2" /> Back
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col items-center justify-center p-8">
        <Frown className="w-16 h-16 text-gray-400 mb-6" />
        <h2 className="text-2xl font-bold mb-4">Report Not Found</h2>
        <p className="text-lg text-gray-300 text-center">
          No data available for this quiz attempt.
        </p>
        <button
          onClick={handleBack}
          className="mt-8 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors duration-200 shadow-lg"
        >
          <ChevronLeft className="w-5 h-5 mr-2" /> Back
        </button>
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
    feedback: report.isSuspicious
      ? "Suspicious activity was flagged for this attempt."
      : "No suspicious activity detected.",
  };

  const studentName = report.student?.fullName || "Unknown Student";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-inter flex flex-col">
      {/* Background overlay for subtle effect */}
      <div
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at top left, #8B5CF6, transparent 50%), radial-gradient(circle at bottom right, #EC4899, transparent 50%)",
        }}
      ></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 w-full flex-grow">
        {/* Quiz & Student Overview Section */}
        <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-xl mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h2 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mb-2">
                {report.quizTitle}
              </h2>
              {isTeacher && (
                <p className="text-xl text-gray-300 flex items-center mb-2">
                  <User className="w-6 h-6 mr-2 text-blue-400" />
                  <span className="font-semibold">{studentName}</span>
                </p>
              )}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-lg text-gray-300 mt-2">
                <span className="flex items-center">
                  <BookOpen className="w-5 h-5 text-purple-400 mr-2" />
                  {report.quizSubject}
                </span>
                <span className="flex items-center">
                  <Target className="w-5 h-5 text-purple-400 mr-2" />
                  {report.quizTopic}
                </span>
                <span className="flex items-center">
                  <Clock className="w-5 h-5 text-purple-400 mr-2" />
                  {new Date(report.submittedAt).toLocaleString()}
                </span>
              </div>
            </div>
            {/* Download PDF Button */}
            <button
              onClick={generatePDF}
              disabled={isGeneratingPDF}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-full text-white font-semibold transition-all duration-300 shadow-lg flex items-center space-x-2 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader className="w-5 h-5 animate-spin mr-2" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  <span>Download PDF Report</span>
                </>
              )}
            </button>
          </div>

          {/* Score & Status Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center mt-6">
            <div
              className={`bg-gray-700/70 p-6 rounded-xl shadow-md flex flex-col items-center justify-center border ${getCardBgColorClass(
                percentage
              )}`}
            >
              <Award
                className={`w-10 h-10 ${getScoreColorClass(percentage)} mb-3`}
              />
              <span className="text-3xl font-bold">
                {report.score} / {report.totalQuestions}
              </span>
              <p className="text-gray-300 mt-1">Your Score</p>
            </div>
            <div
              className={`bg-gray-700/70 p-6 rounded-xl shadow-md flex flex-col items-center justify-center border ${getCardBgColorClass(
                percentage
              )}`}
            >
              {percentage >= 60 ? (
                <CheckCircle2 className="w-10 h-10 text-green-400 mb-3" />
              ) : (
                <XCircle className="w-10 h-10 text-red-400 mb-3" />
              )}
              <span className="text-3xl font-bold">
                {percentage !== undefined ? `${percentage.toFixed(2)}%` : "N/A"}
              </span>
              <p className="text-gray-300 mt-1">Overall Percentage</p>
            </div>
            <div
              className={`bg-gray-700/70 p-6 rounded-xl shadow-md flex flex-col items-center justify-center border ${
                proctoringStatus.isSuspicious
                  ? "border-orange-500/30 bg-orange-800/30"
                  : "border-blue-500/30 bg-blue-800/30"
              }`}
            >
              {proctoringStatus.isSuspicious ? (
                <AlertTriangle className="w-10 h-10 text-orange-400 mb-3" />
              ) : (
                <Shield className="w-10 h-10 text-blue-400 mb-3" />
              )}
              <span className="text-3xl font-bold">
                {proctoringStatus.isSuspicious ? "Detected" : "None"}
              </span>
              <p className="text-gray-300 mt-1">Suspicious Activity</p>
            </div>
          </div>
        </div>

        {/* Gemini Analytics Section */}
        {Object.keys(geminiAnalytics).length > 0 && ( // Only show if geminiAnalytics has content
          <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-xl mb-8">
            <h2 className="text-3xl font-bold text-purple-300 mb-6 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 mr-3" />
              AI-Powered Feedback
            </h2>

            {/* Overall Summary */}
            {overallSummary.message && (
              <div className="bg-gray-700/70 p-6 rounded-xl mb-6 border border-purple-500/30">
                <h3 className="text-2xl font-semibold text-purple-200 mb-3 flex items-center">
                  <ListChecks className="w-6 h-6 mr-2" /> Overall Performance
                  Summary
                </h3>
                <p className="text-lg text-gray-200">
                  {overallSummary.message}
                </p>
              </div>
            )}

            {/* Strengths and Areas for Improvement - Two Columns on larger screens */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {strengths.length > 0 && (
                <div className="bg-green-800/30 p-6 rounded-xl border border-green-500/30">
                  <h3 className="text-2xl font-semibold text-green-300 mb-3 flex items-center">
                    <CheckCircle2 className="w-6 h-6 mr-2" /> Strengths
                  </h3>
                  <ul className="list-disc list-inside text-lg text-green-200 space-y-1">
                    {strengths.map((s, index) => (
                      <li key={index}>
                        {/* Directly render the string 's' */}
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {areasForImprovement.length > 0 && (
                <div className="bg-red-800/30 p-6 rounded-xl border border-red-500/30">
                  <h3 className="text-2xl font-semibold text-red-300 mb-3 flex items-center">
                    <XCircle className="w-6 h-6 mr-2" /> Areas for Improvement
                  </h3>
                  <ul className="list-disc list-inside text-lg text-red-200 space-y-1">
                    {areasForImprovement.map((a, index) => (
                      <li key={index}>
                        {/* Directly render the string 'a' */}
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Question-Specific Feedback */}
            {questionFeedback.length > 0 && (
              <div className="bg-gray-700/70 p-6 rounded-xl border border-gray-600">
                <h3 className="text-2xl font-semibold text-purple-200 mb-4 flex items-center">
                  <Lightbulb className="w-6 h-6 mr-2" /> Question-by-Question
                  Feedback
                </h3>
                <div className="space-y-6">
                  {questionFeedback.map((qf, index) => {
                    const originalQuestion = getQuestionDetails(qf.questionId);
                    const selectedAnswerText =
                      originalQuestion?.options?.find(
                        (opt) => opt.id === qf.selectedOptionId
                      )?.text || qf.selectedAnswer;

                    const correctAnswerText =
                      originalQuestion?.options?.find(
                        (opt) => opt.id === originalQuestion?.correctAnswerId
                      )?.text || qf.correctAnswer;

                    return (
                      <div
                        key={qf.questionId || index}
                        className={`p-5 rounded-lg shadow-md ${
                          qf.isCorrect
                            ? "bg-green-800/30 border-green-500"
                            : "bg-red-800/30 border-red-500"
                        } border-l-4`}
                      >
                        <p className="text-lg font-medium text-gray-100 mb-2">
                          <span className="font-bold">
                            Question {index + 1}:
                          </span>{" "}
                          {originalQuestion?.questionText || qf.questionText}
                        </p>
                        <p className="text-md text-gray-200 mb-1 flex items-center">
                          Selected Answer:{" "}
                          <span className="font-semibold ml-1">
                            {selectedAnswerText}
                          </span>
                          {qf.isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-green-400 ml-2" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-400 ml-2" />
                          )}
                        </p>
                        {!qf.isCorrect && (
                          <p className="text-md text-gray-200 mb-1">
                            Correct Answer:{" "}
                            <span className="font-semibold text-green-300">
                              {correctAnswerText}
                            </span>
                          </p>
                        )}
                        <p className="text-md text-gray-200">
                          Explanation:{" "}
                          <span className="text-gray-300">
                            {qf.explanation}
                          </span>
                        </p>
                        {qf.topic && (
                          <p className="text-sm text-gray-300 mt-2">
                            Topic:{" "}
                            <span className="font-medium">{qf.topic}</span>
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-center mt-10">
          <button
            onClick={handleBack}
            className="px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-xl text-white font-bold text-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center mx-auto"
          >
            <ChevronLeft className="w-5 h-5 mr-2" /> {backButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizReportPage;
