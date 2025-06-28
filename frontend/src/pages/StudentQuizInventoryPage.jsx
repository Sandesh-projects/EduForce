// frontend/src/pages/StudentQuizInventoryPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "../axios"; // Corrected import path for axios
import { toast } from "react-toastify";
import {
  ListChecks,
  Loader,
  Search,
  ArrowUpDown,
  FileText,
  Frown,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  Calendar,
  Award,
  BookOpen,
  Target,
  TrendingUp,
  Eye,
  Filter,
  Download,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const StudentQuizInventoryPage = () => {
  const navigate = useNavigate();
  const [studentAttempts, setStudentAttempts] = useState([]);
  const [attemptsLoading, setAttemptsLoading] = useState(true);
  const [attemptsError, setAttemptsError] = useState("");

  // State for Inventory features
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [attemptsPerPage] = useState(12); // Increased for better grid layout
  const [sortConfig, setSortConfig] = useState({
    key: "submittedAt",
    direction: "descending",
  });
  const [viewMode, setViewMode] = useState("grid"); // grid or table
  const [filterStatus, setFilterStatus] = useState("all"); // all, suspicious, clean

  // useCallback to memoize the fetch function
  const fetchStudentAttempts = useCallback(async () => {
    setAttemptsLoading(true);
    setAttemptsError("");
    try {
      const response = await axios.get("/api/student/quizzes/attempts");
      setStudentAttempts(response.data);
    } catch (error) {
      console.error("Error fetching student attempts:", error);
      setAttemptsError(
        "Failed to load your quiz attempts. Please try again. " +
          (error.response?.data?.message || error.message)
      );
      toast.error("Failed to load your quiz attempts.");
    } finally {
      setAttemptsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudentAttempts();
  }, [fetchStudentAttempts]);

  const handleViewAttemptReport = (attemptId) => {
    navigate(`/student/quizzes/report/${attemptId}`);
  };

  // CSV download handler
  const downloadCSV = () => {
    const headers = [
      "Quiz Title",
      "Subject",
      "Topic",
      "Score (%)",
      "Raw Score",
      "Total Questions",
      "Date Submitted",
      "Status",
    ];
    const rows = filteredAndSortedAttempts.map((a) => [
      `"${a.quizTitle.replace(/"/g, '""')}"`,
      `"${a.quizSubject.replace(/"/g, '""')}"`,
      `"${a.quizTopic.replace(/"/g, '""')}"`,
      a.percentage.toFixed(1),
      a.score,
      a.totalQuestions,
      new Date(a.submittedAt).toLocaleDateString("en-US"),
      a.isSuspicious ? "Suspicious" : "Clean",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "quiz_attempts.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate statistics
  const stats = useMemo(() => {
    if (studentAttempts.length === 0) return null;

    const totalAttempts = studentAttempts.length;
    const avgPercentage =
      studentAttempts.reduce((sum, attempt) => sum + attempt.percentage, 0) /
      totalAttempts;
    const suspiciousCount = studentAttempts.filter(
      (attempt) => attempt.isSuspicious
    ).length;
    const highScores = studentAttempts.filter(
      (attempt) => attempt.percentage >= 80
    ).length;

    return {
      totalAttempts,
      avgPercentage: avgPercentage.toFixed(1),
      suspiciousCount,
      highScores,
      cleanRate: (
        ((totalAttempts - suspiciousCount) / totalAttempts) *
        100
      ).toFixed(1),
    };
  }, [studentAttempts]);

  // Enhanced filtering and sorting
  const filteredAndSortedAttempts = useMemo(() => {
    let filtered = studentAttempts.filter((attempt) => {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const matchesSearch =
        (attempt.quizTitle &&
          attempt.quizTitle.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (attempt.quizSubject &&
          attempt.quizSubject.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (attempt.quizTopic &&
          attempt.quizTopic.toLowerCase().includes(lowerCaseSearchTerm));

      const matchesFilter =
        filterStatus === "all" ||
        (filterStatus === "suspicious" && attempt.isSuspicious) ||
        (filterStatus === "clean" && !attempt.isSuspicious);

      return matchesSearch && matchesFilter;
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === "submittedAt") {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        } else if (typeof aValue === "number" && typeof bValue === "number") {
          return sortConfig.direction === "ascending"
            ? aValue - bValue
            : bValue - aValue;
        } else if (typeof aValue === "string" && typeof bValue === "string") {
          return sortConfig.direction === "ascending"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (aValue < bValue)
          return sortConfig.direction === "ascending" ? -1 : 1;
        if (aValue > bValue)
          return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [studentAttempts, searchTerm, sortConfig, filterStatus]);

  // Pagination logic
  const indexOfLastAttempt = currentPage * attemptsPerPage;
  const indexOfFirstAttempt = indexOfLastAttempt - attemptsPerPage;
  const currentAttempts = filteredAndSortedAttempts.slice(
    indexOfFirstAttempt,
    indexOfLastAttempt
  );
  const totalPages = Math.ceil(
    filteredAndSortedAttempts.length / attemptsPerPage
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const getPercentageColor = (percentage) => {
    if (percentage >= 80) return "text-emerald-400";
    if (percentage >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getPercentageBg = (percentage) => {
    if (percentage >= 80) return "bg-emerald-500/20 border-emerald-500/30";
    if (percentage >= 60) return "bg-yellow-500/20 border-yellow-500/30";
    return "bg-red-500/20 border-red-500/30";
  };

  if (attemptsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col items-center justify-center p-8">
        <div className="relative">
          <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full animate-pulse"></div>
          <Loader className="relative w-16 h-16 animate-spin text-purple-400 mb-6" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Loading Your Attempts</h2>
          <p className="text-lg text-gray-300">
            Fetching your past quiz performances...
          </p>
        </div>
      </div>
    );
  }

  if (attemptsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 text-white flex items-center justify-center p-8">
        <div className="text-center p-8 bg-gray-800/70 backdrop-blur-lg rounded-3xl shadow-2xl border border-red-500/30 max-w-lg">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full"></div>
            <Frown className="relative w-24 h-24 text-red-400 mx-auto" />
          </div>
          <h2 className="text-3xl font-bold text-red-400 mb-4">
            Error Loading Attempts
          </h2>
          <p className="text-gray-300 mb-8 text-lg leading-relaxed">
            {attemptsError}
          </p>
          <button
            onClick={fetchStudentAttempts}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-white font-semibold transition-all duration-300 flex items-center mx-auto shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <RefreshCcw className="w-5 h-5 mr-2" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-inter relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 w-full">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent flex items-center justify-center mb-4">
            <ListChecks className="w-10 h-10 md:w-12 md:h-12 mr-4" />
            My Quiz Journey
          </h1>
          <p className="text-lg md:text-xl text-gray-300">
            Track your progress and celebrate your achievements
          </p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6 text-center">
              <BookOpen className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">
                {stats.totalAttempts}
              </div>
              <div className="text-sm text-gray-300">Total Attempts</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 backdrop-blur-sm border border-emerald-500/30 rounded-2xl p-6 text-center">
              <TrendingUp className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">
                {stats.avgPercentage}%
              </div>
              <div className="text-sm text-gray-300">Average Score</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-6 text-center">
              <Award className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">
                {stats.highScores}
              </div>
              <div className="text-sm text-gray-300">High Scores (80%+)</div>
            </div>
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6 text-center">
              <Target className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">
                {stats.cleanRate}%
              </div>
              <div className="text-sm text-gray-300">Clean Attempts</div>
            </div>
          </div>
        )}

        {/* Controls Section */}
        <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search quizzes..."
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Filter and Controls */}
            <div className="flex items-center gap-3">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Attempts</option>
                <option value="clean">Clean Only</option>
                <option value="suspicious">Suspicious Only</option>
              </select>

              <div className="flex bg-gray-700 rounded-xl border border-gray-600 overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-4 py-3 transition-colors ${
                    viewMode === "grid"
                      ? "bg-purple-600 text-white"
                      : "text-gray-300 hover:text-white hover:bg-gray-600"
                  }`}
                >
                  <div className="w-5 h-5 grid grid-cols-2 gap-0.5">
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                  </div>
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-4 py-3 transition-colors ${
                    viewMode === "table"
                      ? "bg-purple-600 text-white"
                      : "text-gray-300 hover:text-white hover:bg-gray-600"
                  }`}
                >
                  <div className="w-5 h-5 flex flex-col gap-1">
                    <div className="h-0.5 bg-current rounded"></div>
                    <div className="h-0.5 bg-current rounded"></div>
                    <div className="h-0.5 bg-current rounded"></div>
                  </div>
                </button>
              </div>

              <button
                onClick={fetchStudentAttempts}
                className="flex items-center px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl text-white font-semibold transition-all duration-300 shadow-md transform hover:scale-105"
              >
                <RefreshCcw className="w-5 h-5 mr-2" />
                Refresh
              </button>

              {/* New Download CSV Button */}
              <button
                onClick={downloadCSV}
                className="flex items-center px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl text-white font-semibold transition-all duration-300 shadow-md transform hover:scale-105"
              >
                <Download className="w-5 h-5 mr-2" />
                Download CSV
              </button>
            </div>
          </div>
        </div>

        {filteredAndSortedAttempts.length === 0 ? (
          <div className="text-center py-16 text-gray-300 bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-xl flex flex-col items-center">
            <FileText className="w-20 h-20 mb-6 text-gray-500" />
            <p className="text-2xl font-semibold mb-2">
              {searchTerm || filterStatus !== "all"
                ? "No matching results"
                : "No Quiz Attempts Yet!"}
            </p>
            <p className="text-lg max-w-md">
              {searchTerm || filterStatus !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Start taking quizzes to see your performance history here."}
            </p>
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {currentAttempts.map((attempt) => (
                  <div
                    key={attempt._id}
                    className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-purple-500/50 hover:transform hover:scale-105"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-white text-lg mb-1 line-clamp-2">
                          {attempt.quizTitle}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {attempt.quizSubject}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {attempt.quizTopic}
                        </p>
                      </div>
                      <div className="flex-shrink-0 ml-3">
                        {attempt.isSuspicious ? (
                          <XCircle className="w-6 h-6 text-red-400" />
                        ) : (
                          <CheckCircle2 className="w-6 h-6 text-green-400" />
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div
                        className={`p-3 rounded-xl border ${getPercentageBg(
                          attempt.percentage
                        )}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-300">Score</span>
                          <span
                            className={`font-bold text-xl ${getPercentageColor(
                              attempt.percentage
                            )}`}
                          >
                            {attempt.percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {attempt.score} / {attempt.totalQuestions} questions
                        </div>
                      </div>

                      <div className="flex items-center text-gray-400 text-sm">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(attempt.submittedAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleViewAttemptReport(attempt._id)}
                      className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-white font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                    >
                      <Eye className="w-5 h-5 mr-2" />
                      View Report
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Table View */}
            {viewMode === "table" && (
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-xl overflow-hidden mb-8">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600 transition-colors"
                          onClick={() => handleSort("quizTitle")}
                        >
                          Quiz Title
                          <ArrowUpDown className="inline ml-1 w-4 h-4 text-gray-500" />
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600 transition-colors"
                          onClick={() => handleSort("quizSubject")}
                        >
                          Subject
                          <ArrowUpDown className="inline ml-1 w-4 h-4 text-gray-500" />
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600 transition-colors"
                          onClick={() => handleSort("percentage")}
                        >
                          Score
                          <ArrowUpDown className="inline ml-1 w-4 h-4 text-gray-500" />
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600 transition-colors"
                          onClick={() => handleSort("submittedAt")}
                        >
                          Date
                          <ArrowUpDown className="inline ml-1 w-4 h-4 text-gray-500" />
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                        >
                          Status
                        </th>
                        <th scope="col" className="relative px-6 py-4">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {currentAttempts.map((attempt) => (
                        <tr
                          key={attempt._id}
                          className="bg-gray-800/70 hover:bg-gray-700/80 transition-colors duration-150"
                        >
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium text-white">
                                {attempt.quizTitle}
                              </div>
                              <div className="text-sm text-gray-400">
                                {attempt.quizTopic}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {attempt.quizSubject}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span
                                className={`font-bold text-lg ${getPercentageColor(
                                  attempt.percentage
                                )}`}
                              >
                                {attempt.percentage.toFixed(1)}%
                              </span>
                              <span className="text-gray-400 text-sm ml-2">
                                ({attempt.score}/{attempt.totalQuestions})
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {new Date(attempt.submittedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {attempt.isSuspicious ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-800/30 text-red-400 text-xs font-semibold">
                                <XCircle className="w-3 h-3 mr-1" /> Suspicious
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-800/30 text-green-400 text-xs font-semibold">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Clean
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() =>
                                handleViewAttemptReport(attempt._id)
                              }
                              className="text-purple-400 hover:text-purple-300 flex items-center justify-center p-2 rounded-full bg-gray-700/50 hover:bg-gray-600/50 transition-colors transform hover:scale-110"
                              title="View Detailed Report"
                            >
                              <FileText className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Enhanced Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
                <div className="text-sm text-gray-300 mb-4 sm:mb-0">
                  Showing{" "}
                  <span className="font-semibold text-white">
                    {indexOfFirstAttempt + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-white">
                    {Math.min(
                      indexOfLastAttempt,
                      filteredAndSortedAttempts.length
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-white">
                    {filteredAndSortedAttempts.length}
                  </span>{" "}
                  results
                </div>
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <div className="flex space-x-1">
                    {[...Array(Math.min(5, totalPages)).keys()].map((i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => paginate(pageNum)}
                          className={`px-3 py-2 rounded-lg transition-colors ${
                            currentPage === pageNum
                              ? "bg-purple-600 text-white shadow-md"
                              : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StudentQuizInventoryPage;
