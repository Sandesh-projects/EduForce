// src/pages/TeacherQuizzesPage.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "../axios";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import {
  ClipboardList, // Still used for quiz icon in table
  Edit,
  Trash2,
  Loader,
  Search,
  ArrowUpDown,
  PlusCircle,
  BarChart2, // New icon for 'View Report' button
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

  const handleEditQuiz = (quiz) => {
    setSelectedQuiz(quiz);
  };

  const handleViewReport = (quizId) => {
    // This navigation path MUST match the route in App.jsx
    navigate(`/teacher/quizzes/${quizId}/report`);
  };

  const handleDeleteQuiz = async (quizId) => {
    if (window.confirm("Are you sure you want to delete this quiz?")) {
      try {
        await axios.delete(`/api/quizzes/${quizId}`);
        setTeacherQuizzes((prevQuizzes) =>
          prevQuizzes.filter((q) => q._id !== quizId)
        );
        toast.success("Quiz deleted successfully!");
        if (currentQuizzes.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } catch (error) {
        console.error("Error deleting quiz:", error);
        toast.error(error.response?.data?.message || "Failed to delete quiz.");
      }
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
      setSelectedQuiz(null); // Close the modal
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

        // Handle date sorting
        if (sortConfig.key === "createdAt") {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
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
      return sortConfig.direction === "asc" ? "▲" : "▼";
    }
    return "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-inter">
      <div
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at top left, #8B5CF6, transparent 50%), radial-gradient(circle at bottom right, #EC4899, transparent 50%)",
        }}
      ></div>
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <section className="mb-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4 md:mb-0">
              Your Quiz Inventory
            </h1>
            <button
              onClick={handleGenerateNewQuiz}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-full text-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg flex items-center space-x-2 transform hover:scale-105"
            >
              <PlusCircle className="w-5 h-5" /> <span>Generate New Quiz</span>
            </button>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl">
            {/* Search Bar */}
            <div className="relative mb-6">
              <input
                type="text"
                placeholder="Search by title, code, subject, or topic..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>

            {quizzesLoading ? (
              <div className="flex justify-center items-center py-8 text-gray-400">
                <Loader className="w-6 h-6 animate-spin mr-3" />
                Loading quizzes...
              </div>
            ) : quizzesError ? (
              <p className="text-red-400 text-center py-8">{quizzesError}</p>
            ) : filteredAndSortedQuizzes.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                {searchTerm
                  ? "No quizzes found matching your search criteria."
                  : "No quizzes created yet. Click 'Generate New Quiz' to start!"}
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700 rounded-xl overflow-hidden">
                    <thead className="bg-gray-700">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort("quizTitle")}
                        >
                          Quiz Title {getSortIcon("quizTitle")}
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort("quizCode")}
                        >
                          Code {getSortIcon("quizCode")}
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort("subject")}
                        >
                          Subject {getSortIcon("subject")}
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort("userProvidedTopic")}
                        >
                          Topic {getSortIcon("userProvidedTopic")}
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                        >
                          Questions
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort("createdAt")}
                        >
                          Created {getSortIcon("createdAt")}
                        </th>
                        {/* REMOVED Status Column Header */}
                        <th
                          scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                      {currentQuizzes.map((quiz) => (
                        <tr key={quiz._id} className="hover:bg-gray-700/50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                            {quiz.quizTitle}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-300 font-mono">
                            {quiz.quizCode}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {quiz.subject}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {quiz.userProvidedTopic}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {quiz.questions.length}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {new Date(quiz.createdAt).toLocaleDateString()}
                          </td>
                          {/* REMOVED Status Column Data */}
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleEditQuiz(quiz)}
                                className="text-blue-400 hover:text-blue-300 p-1 rounded-full hover:bg-gray-700"
                                title="View/Edit Quiz"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleViewReport(quiz._id)} // This navigates to the TeacherQuizAttemptsPage
                                className="text-teal-400 hover:text-teal-300 p-1 rounded-full hover:bg-gray-700"
                                title="View Quiz Report"
                              >
                                <BarChart2 className="w-5 h-5" />{" "}
                                {/* Report icon */}
                              </button>
                              <button
                                onClick={() => handleDeleteQuiz(quiz._id)}
                                className="text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-gray-700"
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

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <nav className="mt-8 flex justify-center">
                    <ul className="flex items-center space-x-2">
                      <li>
                        <button
                          onClick={() => paginate(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                      </li>
                      {Array.from({ length: totalPages }, (_, i) => (
                        <li key={i}>
                          <button
                            onClick={() => paginate(i + 1)}
                            className={`px-4 py-2 rounded-lg ${
                              currentPage === i + 1
                                ? "bg-purple-600 text-white"
                                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            }`}
                          >
                            {i + 1}
                          </button>
                        </li>
                      ))}
                      <li>
                        <button
                          onClick={() => paginate(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                  </nav>
                )}
              </>
            )}
          </div>
        </section>
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
