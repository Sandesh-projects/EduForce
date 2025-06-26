// frontend/src/pages/StudentQuizInventoryPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "../axios"; // Corrected import path for axios
import { toast } from "react-toastify";
import {
  ListChecks,
  Loader,
  Search,
  ArrowUpDown,
  BarChart2, // For 'View Report' button
  Award, // For score icon
  RefreshCcw,
  SortAsc,
  SortDesc,
  FileText,
  Frown,
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
  const [attemptsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    key: "submittedAt",
    direction: "descending",
  });

  const fetchStudentAttempts = useCallback(async () => {
    // No user check needed here, middleware protects
    setAttemptsLoading(true);
    setAttemptsError("");
    try {
      // API call already includes /api
      const response = await axios.get("/api/quizzes/student/attempts");
      setStudentAttempts(response.data);
    } catch (error) {
      console.error("Error fetching student attempts:", error);
      setAttemptsError("Failed to load your quiz attempts. Please try again.");
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

        if (
          sortConfig.key === "submittedAt" ||
          sortConfig.key === "createdAt"
        ) {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }
        // Ensure numeric comparison for score/percentage
        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortConfig.direction === "ascending"
            ? aValue - bValue
            : bValue - aValue;
        }

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
  }, [studentAttempts, searchTerm, sortConfig]);

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
  };

  const renderSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "ascending" ? (
        <SortAsc className="inline ml-1 w-4 h-4" />
      ) : (
        <SortDesc className="inline ml-1 w-4 h-4" />
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent flex items-center justify-center">
          <ListChecks className="w-9 h-9 mr-3" />
          My Quiz Attempts
        </h1>

        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="relative w-full md:w-1/2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by title, subject, or topic..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <button
            onClick={fetchStudentAttempts}
            className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors duration-200"
          >
            <RefreshCcw className="w-5 h-5 mr-2" /> Refresh
          </button>
        </div>

        {attemptsLoading ? (
          <div className="text-center py-10 text-gray-300">
            Loading your quiz attempts...
          </div>
        ) : attemptsError ? (
          <div className="text-center py-10 text-red-400 flex flex-col items-center">
            <Frown className="w-12 h-12 mb-4" />
            {attemptsError}
          </div>
        ) : filteredAndSortedAttempts.length === 0 ? (
          <div className="text-center py-10 text-gray-300">
            No quiz attempts found yet. Start by taking a new quiz!
          </div>
        ) : (
          // Added overflow-x-auto to this div to make the table horizontally scrollable
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-xl overflow-hidden overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                    onClick={() => handleSort("quizTitle")}
                  >
                    Quiz Title {renderSortIndicator("quizTitle")}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                    onClick={() => handleSort("quizSubject")}
                  >
                    Subject {renderSortIndicator("quizSubject")}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                    onClick={() => handleSort("quizTopic")}
                  >
                    Topic {renderSortIndicator("quizTopic")}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                    onClick={() => handleSort("score")}
                  >
                    Score {renderSortIndicator("score")}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                    onClick={() => handleSort("percentage")}
                  >
                    Percentage {renderSortIndicator("percentage")}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
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
                    className="bg-gray-800 hover:bg-gray-700 transition-colors duration-150"
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
                      {attempt.score} / {attempt.totalQuestions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {attempt.percentage.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(attempt.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {attempt.isSuspicious ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Yes
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewAttemptReport(attempt._id)}
                        className="text-purple-400 hover:text-purple-600 flex items-center"
                      >
                        <FileText className="w-4 h-4 mr-1" /> View Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-3 flex justify-center items-center bg-gray-700">
                <nav
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-600 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {[...Array(totalPages).keys()].map((number) => (
                    <button
                      key={number + 1}
                      onClick={() => paginate(number + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium ${
                        currentPage === number + 1
                          ? "bg-purple-600 text-white"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      {number + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-600 bg-gray-800 text-sm font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentQuizInventoryPage;
