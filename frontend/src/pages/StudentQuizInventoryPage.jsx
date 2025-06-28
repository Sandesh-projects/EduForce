// frontend/src/pages/StudentQuizInventoryPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "../axios"; // Corrected import path for axios
import { toast } from "react-toastify";
import {
  ListChecks,
  Loader, // Used for loading state
  Search,
  ArrowUpDown, // Combined icon for sortable columns
  FileText, // Icon for View Report
  Frown, // Icon for error state
  RefreshCcw, // Refresh icon
  CheckCircle2, // For 'No' suspicious activity
  XCircle, // For 'Yes' suspicious activity
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
  const [attemptsPerPage] = useState(10); // Number of attempts to display per page
  const [sortConfig, setSortConfig] = useState({
    key: "submittedAt",
    direction: "descending",
  });

  // useCallback to memoize the fetch function, preventing unnecessary re-renders
  const fetchStudentAttempts = useCallback(async () => {
    setAttemptsLoading(true);
    setAttemptsError("");
    try {
      // API call to fetch all quiz attempts for the logged-in student
      const response = await axios.get("/api/student/quizzes/attempts");
      setStudentAttempts(response.data);
    } catch (error) {
      console.error("Error fetching student attempts:", error);
      // Enhanced error message to include backend message if available
      setAttemptsError(
        "Failed to load your quiz attempts. Please try again. " +
          (error.response?.data?.message || error.message)
      );
      toast.error("Failed to load your quiz attempts.");
    } finally {
      setAttemptsLoading(false);
    }
  }, []); // Empty dependency array means this function is created once

  // useEffect to call the fetch function when the component mounts
  useEffect(() => {
    fetchStudentAttempts();
  }, [fetchStudentAttempts]); // Dependency on fetchStudentAttempts ensures it runs when the function itself changes (which it won't due to useCallback)

  // Handler for navigating to a specific quiz attempt report
  const handleViewAttemptReport = (attemptId) => {
    // Ensure this path matches the one defined in App.jsx
    navigate(`/student/quizzes/report/${attemptId}`);
  };

  // Memoized function for filtering and sorting attempts
  const filteredAndSortedAttempts = useMemo(() => {
    let filtered = studentAttempts.filter((attempt) => {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      return (
        (attempt.quizTitle &&
          attempt.quizTitle.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (attempt.quizSubject &&
          attempt.quizSubject.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (attempt.quizTopic &&
          attempt.quizTopic.toLowerCase().includes(lowerCaseSearchTerm))
      );
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Convert dates to Date objects for proper comparison
        if (sortConfig.key === "submittedAt") {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }
        // Handle numeric comparisons (score, percentage)
        else if (typeof aValue === "number" && typeof bValue === "number") {
          return sortConfig.direction === "ascending"
            ? aValue - bValue
            : bValue - aValue;
        }
        // Handle string comparisons
        else if (typeof aValue === "string" && typeof bValue === "string") {
          return sortConfig.direction === "ascending"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        // Fallback for other types or null/undefined values
        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return filtered;
  }, [studentAttempts, searchTerm, sortConfig]); // Dependencies for memoization

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

  // Function to change the current page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Handler for sorting table columns
  const handleSort = (key) => {
    let direction = "ascending";
    // If the same column is clicked again, reverse the sort direction
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset to first page on new sort
  };

  // Helper function to render sort direction indicator icon
  const renderSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "ascending" ? (
        <ArrowUpDown className="inline ml-1 w-4 h-4 rotate-180" /> // Rotate for ascending
      ) : (
        <ArrowUpDown className="inline ml-1 w-4 h-4" /> // Default for descending
      );
    }
    return <ArrowUpDown className="inline ml-1 w-4 h-4 text-gray-500" />; // Default icon for unsorted columns
  };

  // Helper for conditional styling based on percentage score
  const getPercentageColor = (percentage) => {
    if (percentage >= 80) return "text-emerald-400 font-bold";
    if (percentage >= 60) return "text-yellow-400 font-bold";
    return "text-red-400 font-bold";
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

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 w-full">
        {/* Header Section */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent flex items-center justify-center">
            <ListChecks className="w-12 h-12 mr-4" />
            My Quiz Attempts
          </h1>
          <p className="text-xl text-gray-300 mt-4">
            Review your past performances and track your progress.
          </p>
        </div>

        {/* Search and Refresh Bar */}
        <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search quizzes by title, subject, or topic..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
            />
          </div>
          <button
            onClick={fetchStudentAttempts}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl text-white font-semibold transition-all duration-300 shadow-md transform hover:scale-105"
          >
            <RefreshCcw className="w-5 h-5 mr-2" /> Refresh List
          </button>
        </div>

        {filteredAndSortedAttempts.length === 0 ? (
          <div className="text-center py-16 text-gray-300 bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-xl flex flex-col items-center">
            <FileText className="w-20 h-20 mb-6 text-gray-500" />
            <p className="text-2xl font-semibold mb-2">No Quiz Attempts Yet!</p>
            <p className="text-lg max-w-md">
              It looks like you haven't taken any quizzes. Start a new quiz to
              see your performance history here.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600 transition-colors"
                        onClick={() => handleSort("quizTitle")}
                      >
                        Quiz Title {renderSortIndicator("quizTitle")}
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600 transition-colors"
                        onClick={() => handleSort("quizSubject")}
                      >
                        Subject {renderSortIndicator("quizSubject")}
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600 transition-colors"
                        onClick={() => handleSort("quizTopic")}
                      >
                        Topic {renderSortIndicator("quizTopic")}
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600 transition-colors"
                        onClick={() => handleSort("score")}
                      >
                        Score {renderSortIndicator("score")}
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600 transition-colors"
                        onClick={() => handleSort("percentage")}
                      >
                        Percentage {renderSortIndicator("percentage")}
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600 transition-colors"
                        onClick={() => handleSort("submittedAt")}
                      >
                        Date Attempted {renderSortIndicator("submittedAt")}
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                      >
                        Suspicious Activity
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">View Report</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {currentAttempts.map((attempt) => (
                      <tr
                        key={attempt._id}
                        className="bg-gray-800/70 hover:bg-gray-700/80 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {attempt.quizTitle}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {attempt.quizSubject}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {attempt.quizTopic}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          <span className="font-semibold text-lg">
                            {attempt.score}
                          </span>{" "}
                          / {attempt.totalQuestions}
                        </td>
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm ${getPercentageColor(
                            attempt.percentage
                          )}`}
                        >
                          {attempt.percentage.toFixed(2)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {new Date(attempt.submittedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {attempt.isSuspicious ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-800/30 text-red-400 text-xs font-semibold">
                              <XCircle className="w-3 h-3 mr-1" /> Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-800/30 text-green-400 text-xs font-semibold">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> No
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleViewAttemptReport(attempt._id)}
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-center bg-gray-700/50 border-t border-gray-700">
                  <span className="text-sm text-gray-300 mb-2 sm:mb-0">
                    Showing {indexOfFirstAttempt + 1} to{" "}
                    {Math.min(
                      indexOfLastAttempt,
                      filteredAndSortedAttempts.length
                    )}{" "}
                    of {filteredAndSortedAttempts.length} results
                  </span>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-600 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    {[...Array(totalPages).keys()].map((number) => (
                      <button
                        key={number + 1}
                        onClick={() => paginate(number + 1)}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium transition-colors ${
                          currentPage === number + 1
                            ? "bg-purple-600 text-white shadow-md"
                            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        }`}
                      >
                        {number + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-600 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StudentQuizInventoryPage;
