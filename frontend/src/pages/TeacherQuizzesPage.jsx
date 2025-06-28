// frontend/src/pages/TeacherQuizzesPage.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "../axios";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import {
  ClipboardList,
  Edit,
  Trash2,
  Loader,
  Search,
  PlusCircle,
  BarChart2,
  ArrowLeft,
  Frown,
  Download,
  Filter,
  Calendar,
  BookOpen,
  Users,
  TrendingUp,
  Eye,
  FileText,
  Grid3X3,
  SortDesc,
  SortAsc,
} from "lucide-react";
import QuizPreviewModal from "../components/QuizPreviewModal";
import { useNavigate } from "react-router-dom";

const TeacherQuizzesPage = () => {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [teacherQuizzes, setTeacherQuizzes] = useState([]);
  const [quizzesLoading, setQuizzesLoading] = useState(true);
  const [quizzesError, setQuizzesError] = useState("");
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [quizzesPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'cards'

  const fetchTeacherQuizzes = useCallback(async () => {
    if (!isLoggedIn || !user) {
      setQuizzesLoading(false);
      return;
    }
    setQuizzesLoading(true);
    setQuizzesError("");
    try {
      const response = await axios.get("/api/quizzes/teacher");
      setTeacherQuizzes(response.data);
    } catch (error) {
      console.error("Error fetching teacher quizzes:", error);
      setQuizzesError("Failed to load your quizzes. Please try again.");
      toast.error("Failed to load your quizzes.");
    } finally {
      setQuizzesLoading(false);
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    fetchTeacherQuizzes();
  }, [fetchTeacherQuizzes]);

  // CSV Download Function
  const downloadCSV = () => {
    if (filteredAndSortedQuizzes.length === 0) {
      toast.warning("No data to export");
      return;
    }

    const headers = [
      "Quiz Title",
      "Quiz Code",
      "Subject",
      "Topic",
      "Questions Count",
      "Created Date",
      "Status",
    ];

    const csvData = filteredAndSortedQuizzes.map((quiz) => [
      quiz.quizTitle,
      quiz.quizCode,
      quiz.subject,
      quiz.userProvidedTopic,
      quiz.questions.length,
      new Date(quiz.createdAt).toLocaleDateString(),
      "Active", // You can modify this based on your quiz status logic
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.map((field) => `"${field}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `quizzes_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV downloaded successfully!");
    }
  };

  const handleEditQuiz = (quiz) => {
    setSelectedQuiz(quiz);
  };

  const handleViewReport = (quizId) => {
    navigate(`/teacher/quizzes/${quizId}/report`);
  };

  const handleDeleteQuiz = async (quizId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this quiz? This action cannot be undone."
      )
    ) {
      return;
    }

    toast.info("Deleting quiz...", { autoClose: 1500 });
    try {
      await axios.delete(`/api/quizzes/${quizId}`);
      toast.success("Quiz deleted successfully!");
      setTeacherQuizzes((prevQuizzes) =>
        prevQuizzes.filter((q) => q._id !== quizId)
      );
      if (currentQuizzes.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast.error(error.response?.data?.message || "Failed to delete quiz.");
    }
  };

  const handleSaveEditedQuiz = async (editedQuizData) => {
    try {
      const quizId = editedQuizData._id;
      if (!quizId) {
        toast.error("Error: Quiz ID is missing for update.");
        console.error("Quiz ID missing:", editedQuizData);
        return;
      }

      const response = await axios.put(
        `/api/quizzes/${quizId}`,
        editedQuizData
      );

      toast.success(response.data.message || "Quiz updated successfully!");
      setTeacherQuizzes((prevQuizzes) =>
        prevQuizzes.map((q) =>
          q._id === quizId ? { ...response.data.quiz } : q
        )
      );
      setSelectedQuiz(null);
    } catch (error) {
      console.error(
        "Error saving edited quiz:",
        error.response?.data || error.message
      );
      toast.error(
        error.response?.data?.message || "Failed to save quiz changes."
      );
    }
  };

  const handleClosePreviewModal = () => {
    setSelectedQuiz(null);
  };

  const handleGenerateNewQuiz = () => {
    navigate("/teacher/home");
  };

  const filteredAndSortedQuizzes = useMemo(() => {
    let filtered = teacherQuizzes.filter((quiz) => {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      return (
        quiz.quizTitle.toLowerCase().includes(lowerCaseSearchTerm) ||
        quiz.quizCode.toLowerCase().includes(lowerCaseSearchTerm) ||
        quiz.subject.toLowerCase().includes(lowerCaseSearchTerm) ||
        quiz.userProvidedTopic.toLowerCase().includes(lowerCaseSearchTerm)
      );
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === "createdAt") {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortConfig.direction === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return filtered;
  }, [teacherQuizzes, searchTerm, sortConfig]);

  const indexOfLastQuiz = currentPage * quizzesPerPage;
  const indexOfFirstQuiz = indexOfLastQuiz - quizzesPerPage;
  const currentQuizzes = filteredAndSortedQuizzes.slice(
    indexOfFirstQuiz,
    indexOfLastQuiz
  );
  const totalPages = Math.ceil(
    filteredAndSortedQuizzes.length / quizzesPerPage
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "asc" ? (
        <SortAsc className="w-4 h-4 inline ml-1" />
      ) : (
        <SortDesc className="w-4 h-4 inline ml-1" />
      );
    }
    return null;
  };

  // Stats calculations
  const totalQuizzes = teacherQuizzes.length;
  const totalQuestions = teacherQuizzes.reduce(
    (sum, quiz) => sum + quiz.questions.length,
    0
  );
  const subjects = [...new Set(teacherQuizzes.map((quiz) => quiz.subject))]
    .length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-inter">
      {/* Background overlay */}
      <div
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at top left, #8B5CF6, transparent 50%), radial-gradient(circle at bottom right, #EC4899, transparent 50%)",
        }}
      />

      {/* Header */}
      <div className="relative z-10 bg-black/30 backdrop-blur-sm border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-colors border border-gray-600"
                title="Go Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Quiz Dashboard
                </h1>
                <p className="text-gray-400 text-sm">
                  Manage and monitor your quizzes
                </p>
              </div>
            </div>
            <button
              onClick={handleGenerateNewQuiz}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg flex items-center space-x-2 transform hover:scale-105"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Create New Quiz</span>
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm font-medium">
                  Total Quizzes
                </p>
                <p className="text-3xl font-bold text-white">{totalQuizzes}</p>
              </div>
              <ClipboardList className="w-12 h-12 text-purple-400" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm font-medium">
                  Total Questions
                </p>
                <p className="text-3xl font-bold text-white">
                  {totalQuestions}
                </p>
              </div>
              <FileText className="w-12 h-12 text-blue-400" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-sm border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm font-medium">Subjects</p>
                <p className="text-3xl font-bold text-white">{subjects}</p>
              </div>
              <BookOpen className="w-12 h-12 text-green-400" />
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search quizzes..."
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={downloadCSV}
                disabled={filteredAndSortedQuizzes.length === 0}
                className="flex items-center space-x-2 px-4 py-3 bg-green-600/20 border border-green-500/30 text-green-300 rounded-xl hover:bg-green-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title="Download CSV"
              >
                <Download className="w-5 h-5" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
              <div className="flex rounded-xl border border-gray-600 overflow-hidden">
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-4 py-3 transition-all ${
                    viewMode === "table"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
                  }`}
                  title="Table View"
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("cards")}
                  className={`px-4 py-3 transition-all ${
                    viewMode === "cards"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
                  }`}
                  title="Card View"
                >
                  <ClipboardList className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Results Info */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
            <span>
              Showing {indexOfFirstQuiz + 1}-
              {Math.min(indexOfLastQuiz, filteredAndSortedQuizzes.length)} of{" "}
              {filteredAndSortedQuizzes.length} quizzes
            </span>
            {searchTerm && <span>Search results for "{searchTerm}"</span>}
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden">
          {quizzesLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loader className="w-8 h-8 animate-spin mr-3 text-purple-400" />
              <span className="text-gray-400 text-lg">
                Loading your quizzes...
              </span>
            </div>
          ) : quizzesError ? (
            <div className="text-center py-16">
              <Frown className="w-16 h-16 mx-auto mb-4 text-red-400" />
              <p className="text-red-400 text-lg mb-4">{quizzesError}</p>
              <button
                onClick={fetchTeacherQuizzes}
                className="px-6 py-3 bg-red-600/20 border border-red-500/30 text-red-300 rounded-xl hover:bg-red-600/30 transition-all"
              >
                Try Again
              </button>
            </div>
          ) : filteredAndSortedQuizzes.length === 0 ? (
            <div className="text-center py-16">
              <ClipboardList className="w-20 h-20 mx-auto mb-6 text-gray-500" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                {searchTerm
                  ? "No matching quizzes found"
                  : "No quizzes created yet"}
              </h3>
              <p className="text-gray-400 mb-6">
                {searchTerm
                  ? "Try adjusting your search criteria"
                  : "Get started by creating your first quiz"}
              </p>
              {!searchTerm && (
                <button
                  onClick={handleGenerateNewQuiz}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg transform hover:scale-105"
                >
                  Create Your First Quiz
                </button>
              )}
            </div>
          ) : viewMode === "table" ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-900/50">
                    <tr>
                      <th
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-800/50 transition-colors"
                        onClick={() => handleSort("quizTitle")}
                      >
                        <div className="flex items-center">
                          Quiz Title {getSortIcon("quizTitle")}
                        </div>
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-800/50 transition-colors"
                        onClick={() => handleSort("quizCode")}
                      >
                        <div className="flex items-center">
                          Code {getSortIcon("quizCode")}
                        </div>
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-800/50 transition-colors"
                        onClick={() => handleSort("subject")}
                      >
                        <div className="flex items-center">
                          Subject {getSortIcon("subject")}
                        </div>
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-800/50 transition-colors"
                        onClick={() => handleSort("userProvidedTopic")}
                      >
                        <div className="flex items-center">
                          Topic {getSortIcon("userProvidedTopic")}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                        Questions
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-800/50 transition-colors"
                        onClick={() => handleSort("createdAt")}
                      >
                        <div className="flex items-center">
                          Created {getSortIcon("createdAt")}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {currentQuizzes.map((quiz, index) => (
                      <tr
                        key={quiz._id}
                        className={`hover:bg-gray-700/30 transition-colors duration-200 ${
                          index % 2 === 0 ? "bg-gray-800/20" : "bg-gray-800/10"
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-white text-sm">
                            {quiz.quizTitle}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100/10 text-purple-300 border border-purple-500/20">
                            {quiz.quizCode}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {quiz.subject}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {quiz.userProvidedTopic}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100/10 text-blue-300 border border-blue-500/20">
                            {quiz.questions.length}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                            {new Date(quiz.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEditQuiz(quiz)}
                              className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-all duration-200"
                              title="View/Edit Quiz"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleViewReport(quiz._id)}
                              className="p-2 text-green-400 hover:text-green-300 hover:bg-green-400/10 rounded-lg transition-all duration-200"
                              title="View Report"
                            >
                              <BarChart2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuiz(quiz._id)}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-all duration-200"
                              title="Delete Quiz"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            /* Card View */
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentQuizzes.map((quiz) => (
                  <div
                    key={quiz._id}
                    className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-2 line-clamp-2">
                          {quiz.quizTitle}
                        </h3>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100/10 text-purple-300 border border-purple-500/20">
                            {quiz.quizCode}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-sm text-gray-300">
                        <BookOpen className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-medium">Subject:</span>
                        <span className="ml-2">{quiz.subject}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-300">
                        <FileText className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-medium">Topic:</span>
                        <span className="ml-2 truncate">
                          {quiz.userProvidedTopic}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-300">
                          <Grid3X3 className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{quiz.questions.length} Questions</span>
                        </div>
                        <div className="flex items-center text-gray-400">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>
                            {new Date(quiz.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditQuiz(quiz)}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-all duration-200"
                          title="View/Edit Quiz"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewReport(quiz._id)}
                          className="p-2 text-green-400 hover:text-green-300 hover:bg-green-400/10 rounded-lg transition-all duration-200"
                          title="View Report"
                        >
                          <BarChart2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuiz(quiz._id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-all duration-200"
                          title="Delete Quiz"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-700 bg-gray-900/30">
              <nav className="flex justify-between items-center">
                <div className="text-sm text-gray-400">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-gray-600"
                  >
                    Previous
                  </button>
                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => paginate(pageNumber)}
                          className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                            currentPage === pageNumber
                              ? "bg-purple-600 text-white shadow-lg"
                              : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border border-gray-600"
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-gray-600"
                  >
                    Next
                  </button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </div>

      {selectedQuiz && (
        <QuizPreviewModal
          quiz={selectedQuiz}
          onClose={handleClosePreviewModal}
          onSave={handleSaveEditedQuiz}
        />
      )}
    </div>
  );
};

export default TeacherQuizzesPage;
