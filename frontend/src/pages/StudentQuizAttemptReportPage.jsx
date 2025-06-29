// frontend/src/pages/StudentQuizAttemptReportPage.jsx
import React, { useState, useEffect, useCallback } from "react";
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
  Download,
  ArrowLeft,
  Star,
  TrendingUp,
  Brain,
  Trophy,
  Calendar,
  User,
  FileText,
  Shield, // Renamed from ClipboardCheck for clarity in UI for security
} from "lucide-react";

const StudentQuizAttemptReportPage = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attemptData, setAttemptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false); // State for PDF generation loading

  const fetchAttemptReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `/api/student/quizzes/attempts/${attemptId}`
      );
      setAttemptData(response.data);
    } catch (err) {
      console.error("Error fetching quiz attempt report:", err);
      const errorMessage = err.response?.data?.message || err.message;
      setError(
        `Failed to load quiz attempt report. ${errorMessage}. Please check your network and authorization.`
      );
      toast.error(`Failed to load quiz attempt report: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    if (attemptId) {
      fetchAttemptReport();
    } else {
      setError("No attempt ID provided.");
      setLoading(false);
    }
  }, [attemptId, fetchAttemptReport]);

  // Helper to find original question details including correct answer
  const getQuestionDetails = useCallback(
    (questionId) => {
      return attemptData?.quiz?.questions.find((q) => q.id === questionId);
    },
    [attemptData]
  );

  // Enhanced PDF generation with jsPDF
  const generateDetailedPDF = async () => {
    if (!attemptData) return;

    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF("p", "mm", "a4"); // 'p' for portrait, 'mm' for millimeters, 'a4' for size
      let yPosition = 20; // Initial Y position
      const margin = 20;
      const contentWidth = doc.internal.pageSize.width - 2 * margin;
      const lineHeight = 5; // Base line height for normal text
      const sectionSpacing = 12;
      const pageHeight = doc.internal.pageSize.height;

      // Set default font properties
      doc.setFont("helvetica", "normal");
      doc.setTextColor(33, 33, 33); // Dark gray for text

      // Helper function to add text with word wrapping and return new Y position
      const addWrappedText = (
        text,
        x,
        y,
        maxWidth,
        fontSize = 10,
        fontStyle = "normal",
        color = [33, 33, 33]
      ) => {
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", fontStyle);
        doc.setTextColor(...color);
        const splitText = doc.splitTextToSize(text, maxWidth);
        doc.text(splitText, x, y);
        return y + splitText.length * (fontSize * 0.45); // Adjust multiplier for better line spacing
      };

      // Helper function to check if we need a new page
      const checkPageBreak = (currentY, requiredSpace = 30) => {
        if (currentY + requiredSpace > pageHeight - margin) {
          doc.addPage();
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Page ${doc.internal.getNumberOfPages()}`,
            doc.internal.pageSize.width - margin - 10,
            10
          );
          return margin; // Reset yPosition to top margin
        }
        return currentY;
      };

      // Destructure attempt data for PDF content
      const {
        quizTitle,
        quizSubject,
        quizTopic,
        score,
        totalQuestions,
        percentage,
        submittedAt,
        isSuspicious,
        geminiAnalytics,
        student,
      } = attemptData;

      // --- Header Section (Top Banner) ---
      doc.setFillColor(99, 102, 241); // Indigo-500
      doc.rect(0, 0, doc.internal.pageSize.width, 30, "F");
      doc.setTextColor(255, 255, 255);
      yPosition = addWrappedText(
        "QUIZ PERFORMANCE REPORT",
        margin,
        20,
        contentWidth,
        18,
        "bold"
      );
      yPosition = 40; // Reset y for main content below header

      // --- Quiz Information Section ---
      yPosition = checkPageBreak(yPosition, 50);
      yPosition += 5; // Space after header
      doc.setTextColor(0, 0, 0); // Black text for this section
      doc.setFillColor(248, 250, 252); // Gray-50 like background
      doc.rect(margin, yPosition, contentWidth, 50, "F"); // Background rectangle
      doc.setDrawColor(200, 200, 200); // Light gray border
      doc.rect(margin, yPosition, contentWidth, 50, "S"); // Border

      let tempY = yPosition + 7;
      tempY = addWrappedText(
        `Quiz Title: ${quizTitle}`,
        margin + 5,
        tempY,
        contentWidth - 10,
        14,
        "bold"
      );
      tempY = addWrappedText(
        `Subject: ${quizSubject} | Topic: ${quizTopic}`,
        margin + 5,
        tempY + 3,
        contentWidth - 10,
        10
      );
      tempY = addWrappedText(
        `Submitted On: ${new Date(submittedAt).toLocaleString()}`,
        margin + 5,
        tempY + 3,
        contentWidth - 10,
        10
      );
      yPosition += 50 + sectionSpacing; // Update yPosition for next section

      // --- Performance Summary Section ---
      yPosition = checkPageBreak(yPosition, 70);
      doc.setFillColor(79, 70, 229); // Purple-600 for section header
      doc.rect(margin, yPosition, contentWidth, 8, "F");
      yPosition = addWrappedText(
        "PERFORMANCE SUMMARY",
        margin,
        yPosition + 5,
        contentWidth,
        12,
        "bold",
        [255, 255, 255]
      );
      yPosition += 8; // Space after section header

      doc.setTextColor(33, 33, 33);

      // Calculate widths for score boxes (3 boxes in a row)
      const scoreBoxPadding = 5;
      const scoreBoxWidth = (contentWidth - 2 * scoreBoxPadding) / 3;
      const scoreBoxHeight = 30; // Fixed height for score boxes

      // Box 1: Score
      doc.setFillColor(255, 235, 59); // Yellow for Score
      doc.rect(margin, yPosition, scoreBoxWidth, scoreBoxHeight, "F");
      doc.setDrawColor(0, 0, 0);
      doc.rect(margin, yPosition, scoreBoxWidth, scoreBoxHeight, "S");
      addWrappedText(
        "SCORE",
        margin + 2,
        yPosition + 8,
        scoreBoxWidth - 4,
        8,
        "bold"
      );
      addWrappedText(
        `${score}/${totalQuestions}`,
        margin + 2,
        yPosition + 18,
        scoreBoxWidth - 4,
        14,
        "bold"
      );

      // Box 2: Percentage
      doc.setFillColor(33, 150, 243); // Blue for Percentage
      doc.rect(
        margin + scoreBoxWidth + scoreBoxPadding,
        yPosition,
        scoreBoxWidth,
        scoreBoxHeight,
        "F"
      );
      doc.setDrawColor(0, 0, 0);
      doc.rect(
        margin + scoreBoxWidth + scoreBoxPadding,
        yPosition,
        scoreBoxWidth,
        scoreBoxHeight,
        "S"
      );
      addWrappedText(
        "PERCENTAGE",
        margin + scoreBoxWidth + scoreBoxPadding + 2,
        yPosition + 8,
        scoreBoxWidth - 4,
        8,
        "bold",
        [255, 255, 255]
      );
      addWrappedText(
        `${percentage?.toFixed(1)}%`,
        margin + scoreBoxWidth + scoreBoxPadding + 2,
        yPosition + 18,
        scoreBoxWidth - 4,
        14,
        "bold",
        [255, 255, 255]
      );

      // Box 3: Status
      const statusColor = percentage >= 60 ? [76, 175, 80] : [244, 67, 54]; // Green or Red
      doc.setFillColor(...statusColor);
      doc.rect(
        margin + 2 * (scoreBoxWidth + scoreBoxPadding),
        yPosition,
        scoreBoxWidth,
        scoreBoxHeight,
        "F"
      );
      doc.setDrawColor(0, 0, 0);
      doc.rect(
        margin + 2 * (scoreBoxWidth + scoreBoxPadding),
        yPosition,
        scoreBoxWidth,
        scoreBoxHeight,
        "S"
      );
      addWrappedText(
        "STATUS",
        margin + 2 * (scoreBoxWidth + scoreBoxPadding) + 2,
        yPosition + 8,
        scoreBoxWidth - 4,
        8,
        "bold",
        [255, 255, 255]
      );
      addWrappedText(
        percentage >= 60 ? "PASSED" : "FAILED",
        margin + 2 * (scoreBoxWidth + scoreBoxPadding) + 2,
        yPosition + 18,
        scoreBoxWidth - 4,
        14,
        "bold",
        [255, 255, 255]
      );

      yPosition += scoreBoxHeight + sectionSpacing; // Update yPosition after score boxes

      // Security Status
      yPosition = checkPageBreak(yPosition, 30);
      const securityBgColor = isSuspicious ? [255, 152, 0] : [76, 175, 80]; // Orange or Green
      doc.setFillColor(...securityBgColor);
      doc.rect(margin, yPosition, contentWidth, 8, "F");
      yPosition = addWrappedText(
        "SECURITY STATUS",
        margin,
        yPosition + 5,
        contentWidth,
        12,
        "bold",
        [255, 255, 255]
      );
      yPosition += 8;
      doc.setTextColor(33, 33, 33);
      yPosition = addWrappedText(
        `Status: ${
          isSuspicious
            ? "FLAGGED - Review Required"
            : "CLEAN - No Issues Detected"
        }`,
        margin,
        yPosition,
        contentWidth,
        10
      );
      yPosition += sectionSpacing;

      // --- AI Analytics Section ---
      if (geminiAnalytics) {
        yPosition = checkPageBreak(yPosition, 40);
        doc.setFillColor(156, 39, 176); // Purple-700
        doc.rect(margin, yPosition, contentWidth, 8, "F");
        yPosition = addWrappedText(
          "AI PERFORMANCE ANALYSIS",
          margin,
          yPosition + 5,
          contentWidth,
          12,
          "bold",
          [255, 255, 255]
        );
        yPosition += 8; // Space after section header

        // Overall Summary
        if (geminiAnalytics.overallSummary?.message) {
          yPosition = checkPageBreak(yPosition, 40);
          yPosition = addWrappedText(
            "Overall Summary:",
            margin,
            yPosition,
            contentWidth,
            12,
            "bold"
          );
          yPosition = addWrappedText(
            geminiAnalytics.overallSummary.message,
            margin,
            yPosition + 3,
            contentWidth,
            10
          );
          yPosition += sectionSpacing;
        }

        // Strengths
        if (geminiAnalytics.strengths && geminiAnalytics.strengths.length > 0) {
          yPosition = checkPageBreak(
            yPosition,
            lineHeight * geminiAnalytics.strengths.length * 2 + 20
          );
          yPosition = addWrappedText(
            "Strengths:",
            margin,
            yPosition,
            contentWidth,
            12,
            "bold"
          );
          geminiAnalytics.strengths.forEach((strength) => {
            const strengthText = `• ${strength.topic}: ${strength.performance}`;
            yPosition = addWrappedText(
              strengthText,
              margin + 5,
              yPosition + 3,
              contentWidth - 5,
              10,
              "normal"
            );
          });
          yPosition += sectionSpacing;
        }

        // Areas for Improvement
        if (
          geminiAnalytics.areasForImprovement &&
          geminiAnalytics.areasForImprovement.length > 0
        ) {
          yPosition = checkPageBreak(
            yPosition,
            lineHeight * geminiAnalytics.areasForImprovement.length * 2 + 20
          );
          yPosition = addWrappedText(
            "Areas for Improvement:",
            margin,
            yPosition,
            contentWidth,
            12,
            "bold"
          );
          geminiAnalytics.areasForImprovement.forEach((area) => {
            const improvementText = `• ${area.topic}: ${area.suggestion}`;
            yPosition = addWrappedText(
              improvementText,
              margin + 5,
              yPosition + 3,
              contentWidth - 5,
              10,
              "normal"
            );
          });
          yPosition += sectionSpacing;
        }

        // Question-by-Question Feedback
        if (
          geminiAnalytics.questionFeedback &&
          geminiAnalytics.questionFeedback.length > 0
        ) {
          yPosition = checkPageBreak(yPosition, 40);
          doc.setFillColor(96, 125, 139); // Blue-gray
          doc.rect(margin, yPosition, contentWidth, 8, "F");
          yPosition = addWrappedText(
            "DETAILED QUESTION ANALYSIS",
            margin,
            yPosition + 5,
            contentWidth,
            12,
            "bold",
            [255, 255, 255]
          );
          yPosition += 8; // Space after section header

          geminiAnalytics.questionFeedback.forEach((feedback, index) => {
            yPosition = checkPageBreak(yPosition, 70); // Estimate space needed for each question block

            const originalQuestion = getQuestionDetails(feedback.questionId);
            const selectedOptionText =
              originalQuestion?.options?.find(
                (opt) => opt.id === feedback.selectedOptionId
              )?.text || feedback.selectedAnswer;
            const correctAnswerText =
              originalQuestion?.options?.find(
                (opt) => opt.id === originalQuestion?.correctAnswerId
              )?.text || feedback.correctAnswer;

            // Question Text
            yPosition = addWrappedText(
              `Question ${index + 1}: ${
                originalQuestion?.questionText || feedback.questionText
              }`,
              margin,
              yPosition,
              contentWidth,
              11,
              "bold"
            );
            yPosition += 3;

            // Answers
            addWrappedText(
              `Your Answer: ${selectedOptionText}`,
              margin + 5,
              yPosition,
              contentWidth - 5,
              9,
              "normal"
            );
            yPosition += lineHeight;
            addWrappedText(
              `Correct Answer: ${correctAnswerText}`,
              margin + 5,
              yPosition,
              contentWidth - 5,
              9,
              "normal"
            );
            yPosition += lineHeight;
            addWrappedText(
              `Status: ${feedback.isCorrect ? "Correct" : "Incorrect"}`,
              margin + 5,
              yPosition,
              contentWidth - 5,
              9,
              "bold",
              feedback.isCorrect ? [0, 150, 136] : [244, 67, 54]
            );
            yPosition += lineHeight + 3;

            // Explanation
            if (feedback.explanation) {
              yPosition = addWrappedText(
                "Explanation:",
                margin + 5,
                yPosition,
                contentWidth - 5,
                10,
                "bold"
              );
              yPosition = addWrappedText(
                feedback.explanation,
                margin + 5,
                yPosition + 3,
                contentWidth - 5,
                9
              );
              yPosition += lineHeight + 3;
            }

            // Topic & Difficulty
            addWrappedText(
              `Topic: ${feedback.topic || "N/A"} | Difficulty: ${
                feedback.difficulty || "N/A"
              }`,
              margin + 5,
              yPosition,
              contentWidth - 5,
              8,
              "normal",
              [100, 100, 100]
            );
            yPosition += sectionSpacing; // Space between questions
          });
        }
      }

      // --- Footer ---
      doc.setFillColor(240, 240, 240); // Light gray for footer
      doc.rect(0, pageHeight - 15, doc.internal.pageSize.width, 15, "F");
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.text(
        `Generated on ${new Date().toLocaleString()}`,
        margin,
        pageHeight - 8
      );
      doc.text(
        `Page ${doc.internal.getNumberOfPages()}`,
        doc.internal.pageSize.width - margin - 10,
        pageHeight - 8
      );

      // Save the PDF
      const sanitizedStudentName = attemptData.student?.fullName
        ? attemptData.student.fullName
            .replace(/[^a-zA-Z0-9]/g, "_")
            .toLowerCase()
        : "student";
      const sanitizedQuizTitle = attemptData.quizTitle
        ? attemptData.quizTitle.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()
        : "quiz";

      const filename = `EduForce_QuizReport_${sanitizedQuizTitle}_${sanitizedStudentName}_${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      doc.save(filename);

      toast.success("PDF report generated and downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF report: " + error.message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Handle PDF download button click
  const handleDownloadButtonClick = useCallback(async () => {
    setDownloadingPdf(true); // Indicate that download is in progress
    // We are now only using client-side PDF generation, no need for API fallback in this component.
    await generateDetailedPDF();
    // setDownloadingPdf will be set to false in generateDetailedPDF's finally block
  }, [generateDetailedPDF]);

  const {
    quizTitle,
    quizSubject,
    quizTopic,
    score,
    totalQuestions,
    percentage,
    submittedAt,
    isSuspicious,
    geminiAnalytics,
  } = attemptData || {}; // Add default empty object to avoid errors if attemptData is null/undefined

  const performanceGrade = getPerformanceGrade(percentage);

  // Helper to determine performance grade and associated colors
  function getPerformanceGrade(percentage) {
    if (percentage >= 90)
      return {
        grade: "A+",
        color: "text-emerald-400",
        bg: "bg-emerald-500/20",
        border: "border-emerald-500/30",
      };
    if (percentage >= 80)
      return {
        grade: "A",
        color: "text-green-400",
        bg: "bg-green-500/20",
        border: "border-green-500/30",
      };
    if (percentage >= 70)
      return {
        grade: "B",
        color: "text-blue-400",
        bg: "bg-blue-500/20",
        border: "border-blue-500/30",
      };
    if (percentage >= 60)
      return {
        grade: "C",
        color: "text-yellow-400",
        bg: "bg-yellow-500/20",
        border: "border-yellow-500/30",
      };
    return {
      grade: "F",
      color: "text-red-400",
      bg: "bg-red-500/20",
      border: "border-red-500/30",
    };
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col items-center justify-center p-8">
        <div className="relative">
          <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full animate-pulse"></div>
          <Loader className="relative w-16 h-16 animate-spin text-purple-400 mb-6" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Loading Your Report</h2>
          <p className="text-lg text-gray-300">
            Analyzing your quiz performance...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 text-white flex items-center justify-center p-8">
        <div className="text-center p-8 bg-gray-800/70 backdrop-blur-lg rounded-3xl shadow-2xl border border-red-500/30 max-w-lg">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full"></div>
            <AlertTriangle className="relative w-24 h-24 text-red-400 mx-auto" />
          </div>
          <h2 className="text-3xl font-bold text-red-400 mb-4">
            Oops! Something went wrong
          </h2>
          <p className="text-gray-300 mb-8 text-lg leading-relaxed">{error}</p>
          <button
            onClick={() => navigate("/student/quizzes/inventory")}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-white font-semibold transition-all duration-300 flex items-center mx-auto shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to My Attempts
          </button>
        </div>
      </div>
    );
  }

  if (!attemptData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col items-center justify-center p-8">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gray-500/20 blur-xl rounded-full"></div>
          <Frown className="relative w-20 h-20 text-gray-400" />
        </div>
        <h2 className="text-3xl font-bold mb-4">Report Not Found</h2>
        <p className="text-xl text-gray-300 text-center mb-8">
          We couldn't find any data for this quiz attempt.
        </p>
        <button
          onClick={() => navigate("/student/quizzes/inventory")}
          className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl text-white font-semibold transition-all duration-300 shadow-lg transform hover:-translate-y-1"
        >
          Go to Attempts Inventory
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-inter relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-black/30 backdrop-blur-lg border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/student/quizzes/inventory")}
              className="text-white flex items-center justify-center w-12 h-12 rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-300 group"
              title="Go Back to Attempts"
            >
              <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Quiz Performance Report
            </h1>
            <div className="w-12"></div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 w-full">
        {/* Quiz Header Card */}
        <div className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-lg border border-gray-700/50 rounded-3xl p-8 shadow-2xl mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5"></div>
          <div className="relative">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Trophy className="w-8 h-8 text-yellow-400" />
                  <h2 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                    {quizTitle}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-lg">
                  <div className="flex items-center gap-3 bg-gray-700/30 px-4 py-2 rounded-xl">
                    <BookOpen className="w-5 h-5 text-purple-400" />
                    <span className="text-gray-200">{quizSubject}</span>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-700/30 px-4 py-2 rounded-xl">
                    <Target className="w-5 h-5 text-blue-400" />
                    <span className="text-gray-200">{quizTopic}</span>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-700/30 px-4 py-2 rounded-xl">
                    <Calendar className="w-5 h-5 text-green-400" />
                    <span className="text-gray-200">
                      {new Date(submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleDownloadButtonClick}
                disabled={downloadingPdf}
                className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 rounded-2xl text-white font-bold transition-all duration-300 shadow-xl flex items-center space-x-3 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {downloadingPdf ? (
                  <>
                    <Loader className="w-6 h-6 animate-spin" />
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-6 h-6 group-hover:animate-bounce" />
                    <span>Download Report</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Score Card */}
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-lg border border-yellow-500/30 rounded-2xl p-6 shadow-xl group hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <Award className="w-10 h-10 text-yellow-400 group-hover:rotate-12 transition-transform" />
              <div
                className={`px-3 py-1 rounded-full text-sm font-bold ${performanceGrade.bg} ${performanceGrade.color}`}
              >
                {performanceGrade.grade}
              </div>
            </div>
            <div className="text-3xl font-black text-white mb-1">
              {score}
              <span className="text-xl text-gray-400">/{totalQuestions}</span>
            </div>
            <p className="text-yellow-200 font-medium">Questions Correct</p>
          </div>

          {/* Percentage Card */}
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-lg border border-blue-500/30 rounded-2xl p-6 shadow-xl group hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-10 h-10 text-blue-400 group-hover:rotate-12 transition-transform" />
              <Star className="w-6 h-6 text-blue-300" />
            </div>
            <div className="text-3xl font-black text-white mb-1">
              {percentage?.toFixed(1)}
              <span className="text-xl text-gray-400">%</span>
            </div>
            <p className="text-blue-200 font-medium">Overall Score</p>
          </div>

          {/* Status Card - COMPLETED HERE */}
          <div
            className={`backdrop-blur-lg border rounded-2xl p-6 shadow-xl group hover:scale-105 transition-all duration-300 ${
              percentage >= 60
                ? "bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30"
                : "bg-gradient-to-br from-red-500/20 to-pink-500/20 border-red-500/30"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              {percentage >= 60 ? (
                <CheckCircle className="w-10 h-10 text-green-400 group-hover:rotate-12 transition-transform" />
              ) : (
                <XCircle className="w-10 h-10 text-red-400 group-hover:rotate-12 transition-transform" />
              )}
              <Brain
                className={`w-6 h-6 ${
                  percentage >= 60 ? "text-green-300" : "text-red-300"
                }`}
              />
            </div>
            <div
              className={`text-2xl font-black mb-1 ${
                percentage >= 60 ? "text-green-300" : "text-red-300"
              }`}
            >
              {percentage >= 60 ? "PASSED" : "REVIEW"}
            </div>
            <p
              className={`font-medium ${
                percentage >= 60 ? "text-green-200" : "text-red-200"
              }`}
            >
              Performance Status
            </p>
          </div>

          {/* Security Card - COMPLETED HERE */}
          <div
            className={`backdrop-blur-lg border rounded-2xl p-6 shadow-xl group hover:scale-105 transition-all duration-300 ${
              isSuspicious
                ? "bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/30"
                : "bg-gradient-to-br from-green-500/20 to-blue-500/20 border-green-500/30"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              {isSuspicious ? (
                <AlertTriangle className="w-10 h-10 text-orange-400 group-hover:rotate-12 transition-transform" />
              ) : (
                <Shield className="w-10 h-10 text-green-400 group-hover:rotate-12 transition-transform" />
              )}
              <User
                className={`w-6 h-6 ${
                  isSuspicious ? "text-orange-300" : "text-green-300"
                }`}
              />
            </div>
            <div
              className={`text-2xl font-black mb-1 ${
                isSuspicious ? "text-orange-300" : "text-green-300"
              }`}
            >
              {isSuspicious ? "FLAGGED" : "CLEAN"}
            </div>
            <p
              className={`font-medium ${
                isSuspicious ? "text-orange-200" : "text-green-200"
              }`}
            >
              Activity Status
            </p>
          </div>
        </div>

        {/* AI Analytics Section */}
        {geminiAnalytics && (
          <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-lg border border-gray-700/50 rounded-3xl p-8 shadow-2xl mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5"></div>
            <div className="relative">
              <div className="flex items-center justify-center mb-8">
                <div className="flex items-center gap-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 px-6 py-3 rounded-2xl border border-purple-500/30">
                  <Brain className="w-8 h-8 text-purple-400 animate-pulse" />
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
                    AI Performance Analysis
                  </h2>
                </div>
              </div>

              {/* Overall Summary */}
              {geminiAnalytics.overallSummary && (
                <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-6 mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <MessageSquare className="w-7 h-7 text-indigo-400" />
                    <h3 className="text-2xl font-bold text-indigo-300">
                      Performance Summary
                    </h3>
                  </div>
                  <p className="text-lg text-gray-200 leading-relaxed">
                    {geminiAnalytics.overallSummary.message}
                  </p>
                </div>
              )}

              {/* Strengths and Improvements Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Strengths */}
                {geminiAnalytics.strengths &&
                  geminiAnalytics.strengths.length > 0 && (
                    <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <CheckCircle className="w-8 h-8 text-emerald-400" />
                        <h3 className="text-2xl font-bold text-emerald-300">
                          Your Strengths
                        </h3>
                      </div>
                      <div className="space-y-4">
                        {geminiAnalytics.strengths.map((strength, index) => (
                          <div
                            key={index}
                            className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 group hover:bg-emerald-500/10 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <Star className="w-5 h-5 text-emerald-400 mt-1 group-hover:scale-110 transition-transform" />
                              <div>
                                <h4 className="font-bold text-emerald-200 mb-1">
                                  {strength.topic}
                                </h4>
                                <p className="text-emerald-100">
                                  {strength.performance}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Areas for Improvement */}
                {geminiAnalytics.areasForImprovement &&
                  geminiAnalytics.areasForImprovement.length > 0 && (
                    <div className="bg-gradient-to-br from-rose-500/10 to-red-500/10 border border-rose-500/20 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <TrendingUp className="w-8 h-8 text-rose-400" />
                        <h3 className="text-2xl font-bold text-rose-300">
                          Growth Areas
                        </h3>
                      </div>
                      <div className="space-y-4">
                        {geminiAnalytics.areasForImprovement.map(
                          (area, index) => (
                            <div
                              key={index}
                              className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-4 group hover:bg-rose-500/10 transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                <Lightbulb className="w-5 h-5 text-rose-400 mt-1 group-hover:scale-110 transition-transform" />
                                <div>
                                  <h4 className="font-bold text-rose-200 mb-1">
                                    {area.topic}
                                  </h4>
                                  <p className="text-rose-100">
                                    {area.suggestion}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>

              {/* Question Feedback */}
              {geminiAnalytics.questionFeedback &&
                geminiAnalytics.questionFeedback.length > 0 && (
                  <div className="bg-gradient-to-br from-slate-700/30 to-gray-700/30 border border-slate-600/30 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <FileText className="w-8 h-8 text-slate-400" />
                      <h3 className="text-2xl font-bold text-slate-300">
                        Detailed Question Analysis
                      </h3>
                    </div>
                    <div className="space-y-6">
                      {geminiAnalytics.questionFeedback.map(
                        (feedback, index) => {
                          const originalQuestion = getQuestionDetails(
                            feedback.questionId
                          );
                          const selectedOptionText =
                            originalQuestion?.options.find(
                              (opt) => opt.id === feedback.selectedOptionId
                            )?.text || feedback.selectedAnswer;
                          const correctAnswerText =
                            originalQuestion?.options.find(
                              (opt) =>
                                opt.id === originalQuestion?.correctAnswerId
                            )?.text || feedback.correctAnswer;

                          return (
                            <div
                              key={feedback.questionId || index}
                              className={`rounded-2xl p-6 border-l-4 transition-all duration-300 hover:scale-[1.02] ${
                                feedback.isCorrect
                                  ? "bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-emerald-500 shadow-emerald-500/10"
                                  : "bg-gradient-to-r from-rose-500/10 to-red-500/10 border-rose-500 shadow-rose-500/10"
                              } shadow-lg`}
                            >
                              <div className="flex items-start justify-between mb-4">
                                <h4 className="text-xl font-bold text-white flex items-center gap-2">
                                  <span className="bg-gray-700/50 px-3 py-1 rounded-full text-sm">
                                    Q{index + 1}
                                  </span>
                                  {originalQuestion?.questionText ||
                                    feedback.questionText}
                                </h4>
                                {feedback.isCorrect ? (
                                  <CheckCircle className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                                ) : (
                                  <XCircle className="w-8 h-8 text-rose-400 flex-shrink-0" />
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div
                                  className={`p-4 rounded-xl border ${
                                    feedback.isCorrect
                                      ? "bg-emerald-500/5 border-emerald-500/20"
                                      : "bg-rose-500/5 border-rose-500/20"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <User className="w-5 h-5 text-gray-400" />
                                    <span className="font-semibold text-gray-300">
                                      Your Answer
                                    </span>
                                  </div>
                                  <p
                                    className={`font-medium ${
                                      feedback.isCorrect
                                        ? "text-emerald-200"
                                        : "text-rose-200"
                                    }`}
                                  >
                                    {selectedOptionText}
                                  </p>
                                </div>

                                <div className="p-4 rounded-xl border bg-emerald-500/5 border-emerald-500/20">
                                  <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                                    <span className="font-semibold text-gray-300">
                                      Correct Answer
                                    </span>
                                  </div>
                                  <p className="font-medium text-emerald-200">
                                    {correctAnswerText}
                                  </p>
                                </div>
                              </div>

                              <div className="bg-gray-800/30 rounded-xl p-4 mb-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <Lightbulb className="w-5 h-5 text-yellow-400" />
                                  <span className="font-semibold text-gray-300">
                                    Explanation
                                  </span>
                                </div>
                                <p className="text-gray-200 leading-relaxed">
                                  {feedback.explanation}
                                </p>
                              </div>

                              {feedback.topic && (
                                <div className="flex items-center gap-2">
                                  <Target className="w-4 h-4 text-purple-400" />
                                  <span className="text-sm text-purple-300 font-medium">
                                    Topic: {feedback.topic}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Action Footer */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button
                onClick={() => navigate("/student/quizzes/inventory")}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl text-white font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center group"
              >
                <ArrowLeft className="w-6 h-6 mr-3 group-hover:-translate-x-1 transition-transform" />
                Back to Quiz Attempts
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentQuizAttemptReportPage;
