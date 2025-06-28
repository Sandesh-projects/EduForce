// frontend/src/pages/TeacherQuizAttemptsPage.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../axios";
import { toast } from "react-toastify";
import {
  Loader,
  BarChart2,
  User,
  BookOpen,
  Calendar,
  Award,
  Frown,
  ArrowLeft,
  Download,
  FileText,
  TrendingUp,
  Users,
  Target,
  Clock,
  Filter,
  Search,
  Eye,
  ChevronDown,
  Star,
  AlertCircle,
} from "lucide-react";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const TeacherQuizAttemptsPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quizDetails, setQuizDetails] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("submittedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [downloadingPdf, setDownloadingPdf] = useState(null);

  const fetchQuizAttempts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const quizResponse = await axios.get(`/api/quizzes/${quizId}`);
      setQuizDetails(quizResponse.data);

      const attemptsResponse = await axios.get(
        `/api/quizzes/${quizId}/attempts`
      );
      setAttempts(attemptsResponse.data);
    } catch (err) {
      console.error("Error fetching quiz attempts:", err);
      const errorMessage = err.response?.data?.message || err.message;
      setError(
        `Failed to load quiz attempts. ${errorMessage}. Please check your network and authorization.`
      );
      toast.error(`Failed to load quiz attempts: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    fetchQuizAttempts();
  }, [fetchQuizAttempts]);

  const handleViewStudentReport = (attemptId) => {
    navigate(`/teacher/attempts/${attemptId}`);
  };

  const handleDownloadPdf = async (attemptId, studentName) => {
    setDownloadingPdf(attemptId);
    try {
      const response = await axios.get(`/api/attempts/${attemptId}/pdf`, {
        responseType: "blob",
        headers: {
          Accept: "application/pdf",
        },
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Generate filename
      const sanitizedStudentName = studentName
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();
      const sanitizedQuizTitle = quizDetails.quizTitle
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();
      link.setAttribute(
        "download",
        `quiz_report_${sanitizedQuizTitle}_${sanitizedStudentName}.pdf`
      );

      // Append to html link element page
      document.body.appendChild(link);

      // Start download
      link.click();

      // Clean up and remove the link
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`PDF report downloaded for ${studentName}`);
    } catch (err) {
      console.error("Error downloading PDF:", err);
      toast.error("Failed to download PDF report");
    } finally {
      setDownloadingPdf(null);
    }
  };

  const filteredAndSortedAttempts = useMemo(() => {
    let filtered = attempts.filter((attempt) =>
      attempt.studentName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === "submittedAt") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }, [attempts, searchTerm, sortBy, sortOrder]);

  const quizStats = useMemo(() => {
    if (!attempts.length || !quizDetails) {
      return null;
    }

    const scores = attempts.map((a) => a.score || 0);
    const totalScore = scores.reduce((sum, score) => sum + score, 0);
    const averageScore = totalScore / attempts.length;

    const maxScore = quizDetails.questions ? quizDetails.questions.length : 1;
    const passThreshold = 0.6;
    const passedAttempts = attempts.filter(
      (a) => a.score / maxScore >= passThreshold
    );
    const passRate = (passedAttempts.length / attempts.length) * 100;

    const scoreDistribution = {};
    scores.forEach((score) => {
      scoreDistribution[score] = (scoreDistribution[score] || 0) + 1;
    });

    // Performance levels for doughnut chart
    const excellent = attempts.filter((a) => a.score / maxScore >= 0.9).length;
    const good = attempts.filter(
      (a) => a.score / maxScore >= 0.7 && a.score / maxScore < 0.9
    ).length;
    const average = attempts.filter(
      (a) => a.score / maxScore >= 0.6 && a.score / maxScore < 0.7
    ).length;
    const needsImprovement = attempts.filter(
      (a) => a.score / maxScore < 0.6
    ).length;

    const performanceChartData = {
      labels: [
        "Excellent (90%+)",
        "Good (70-89%)",
        "Average (60-69%)",
        "Needs Improvement (<60%)",
      ],
      datasets: [
        {
          data: [excellent, good, average, needsImprovement],
          backgroundColor: [
            "rgba(34, 197, 94, 0.8)",
            "rgba(59, 130, 246, 0.8)",
            "rgba(245, 158, 11, 0.8)",
            "rgba(239, 68, 68, 0.8)",
          ],
          borderColor: [
            "rgba(34, 197, 94, 1)",
            "rgba(59, 130, 246, 1)",
            "rgba(245, 158, 11, 1)",
            "rgba(239, 68, 68, 1)",
          ],
          borderWidth: 2,
        },
      ],
    };

    const scoreChartData = {
      labels: Object.keys(scoreDistribution).sort(
        (a, b) => parseInt(a) - parseInt(b)
      ),
      datasets: [
        {
          label: "Number of Students",
          data: Object.keys(scoreDistribution)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map((score) => scoreDistribution[score]),
          backgroundColor: "rgba(139, 92, 246, 0.6)",
          borderColor: "rgba(139, 92, 246, 1)",
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: "#e5e7eb",
            font: { size: 12 },
            padding: 20,
          },
        },
        title: {
          display: true,
          text: "Score Distribution",
          color: "#f9fafb",
          font: { size: 16, weight: "bold" },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Score",
            color: "#d1d5db",
          },
          ticks: { color: "#9ca3af" },
          grid: { color: "rgba(255,255,255,0.1)" },
        },
        y: {
          title: {
            display: true,
            text: "Number of Students",
            color: "#d1d5db",
          },
          ticks: {
            color: "#9ca3af",
            stepSize: 1,
          },
          grid: { color: "rgba(255,255,255,0.1)" },
        },
      },
    };

    return {
      averageScore: averageScore.toFixed(2),
      totalAttempts: attempts.length,
      passRate: passRate.toFixed(2),
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      scoreChartData,
      chartOptions,
      performanceChartData,
      maxPossibleScore: maxScore,
      excellent,
      good,
      average,
      needsImprovement,
    };
  }, [attempts, quizDetails]);

  const getScoreColor = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return "text-green-400";
    if (percentage >= 70) return "text-blue-400";
    if (percentage >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBadge = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return { text: "Excellent", color: "bg-green-500" };
    if (percentage >= 70) return { text: "Good", color: "bg-blue-500" };
    if (percentage >= 60) return { text: "Average", color: "bg-yellow-500" };
    return { text: "Needs Improvement", color: "bg-red-500" };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex justify-center items-center text-white">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-400" />
          <p className="text-xl font-semibold">Loading quiz report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center p-8">
        <div className="text-center p-8 bg-gray-800/70 rounded-2xl shadow-2xl border border-gray-700 max-w-md">
          <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-red-400 mb-4">
            Error Loading Page
          </h2>
          <p className="text-gray-300 mb-8 text-lg">{error}</p>
          <button
            onClick={() => navigate("/teacher/quizzes")}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-white font-semibold transition-all duration-300 flex items-center mx-auto shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to My Quizzes
          </button>
        </div>
      </div>
    );
  }

  if (!quizDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex justify-center items-center text-gray-400">
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <p className="text-xl">
            Quiz details could not be loaded. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-inter">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 opacity-30">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/teacher/quizzes")}
            className="mb-6 flex items-center text-purple-400 hover:text-purple-300 transition-all duration-200 group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to My Quizzes</span>
          </button>

          <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-2">
                  Quiz Report
                </h1>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  {quizDetails.quizTitle}
                </h2>
                <div className="flex items-center gap-4 text-lg text-gray-300">
                  <span className="px-4 py-2 bg-purple-600/30 rounded-full font-mono">
                    {quizDetails.quizCode}
                  </span>
                  <span className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-2" />
                    {quizDetails.subject}
                  </span>
                  <span className="flex items-center">
                    <Target className="w-4 h-4 mr-2" />
                    {quizDetails.userProvidedTopic}
                  </span>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="text-center p-6 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl border border-purple-500/30">
                  <Calendar className="w-12 h-12 mx-auto mb-2 text-purple-400" />
                  <p className="text-sm text-gray-300">Created</p>
                  <p className="text-lg font-semibold">
                    {new Date(quizDetails.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Overview */}
        {quizStats && attempts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-8 h-8 text-blue-400" />
                  <span className="text-3xl font-bold text-blue-400">
                    {quizStats.totalAttempts}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-200">
                  Total Attempts
                </h3>
                <p className="text-sm text-gray-400">
                  Students who took the quiz
                </p>
              </div>

              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="w-8 h-8 text-green-400" />
                  <span className="text-3xl font-bold text-green-400">
                    {quizStats.averageScore}/{quizStats.maxPossibleScore}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-200">
                  Average Score
                </h3>
                <p className="text-sm text-gray-400">Class performance</p>
              </div>

              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <Award className="w-8 h-8 text-yellow-400" />
                  <span className="text-3xl font-bold text-yellow-400">
                    {quizStats.passRate}%
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-200">
                  Pass Rate
                </h3>
                <p className="text-sm text-gray-400">Students scoring 60%+</p>
              </div>

              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <Star className="w-8 h-8 text-purple-400" />
                  <span className="text-3xl font-bold text-purple-400">
                    {quizStats.highestScore}/{quizStats.maxPossibleScore}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-200">
                  Top Score
                </h3>
                <p className="text-sm text-gray-400">Best performance</p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl">
                <h3 className="text-2xl font-bold text-purple-300 mb-6 flex items-center">
                  <BarChart2 className="w-6 h-6 mr-3" />
                  Score Distribution
                </h3>
                <div className="h-80">
                  <Bar
                    data={quizStats.scoreChartData}
                    options={quizStats.chartOptions}
                  />
                </div>
              </div>

              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl">
                <h3 className="text-2xl font-bold text-purple-300 mb-6 flex items-center">
                  <Target className="w-6 h-6 mr-3" />
                  Performance Levels
                </h3>
                <div className="h-80 flex items-center justify-center">
                  <Doughnut
                    data={quizStats.performanceChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "bottom",
                          labels: {
                            color: "#e5e7eb",
                            font: { size: 11 },
                            padding: 15,
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-16 bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-xl mb-8">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-2xl font-bold text-gray-300 mb-2">
              No Attempts Yet
            </h3>
            <p className="text-gray-400">
              Students haven't taken this quiz yet. Share the quiz code with
              your students!
            </p>
          </div>
        )}

        {/* Student Attempts Section */}
        <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-purple-300 flex items-center mb-4 md:mb-0">
              <User className="w-7 h-7 mr-3" />
              Student Attempts ({filteredAndSortedAttempts.length})
            </h2>

            {attempts.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="submittedAt">Date</option>
                    <option value="score">Score</option>
                    <option value="studentName">Name</option>
                  </select>

                  <button
                    onClick={() =>
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                    }
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white hover:bg-gray-600 transition-colors"
                  >
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {filteredAndSortedAttempts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-700">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Score & Performance
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredAndSortedAttempts.map((attempt) => {
                    const badge = getScoreBadge(
                      attempt.score,
                      quizDetails.questions.length
                    );
                    return (
                      <tr
                        key={attempt._id}
                        className="hover:bg-gray-700/30 transition-colors duration-200"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                              {attempt.studentName?.charAt(0)?.toUpperCase() ||
                                "?"}
                            </div>
                            <div>
                              <div className="text-lg font-semibold text-white">
                                {attempt.studentName || "Anonymous"}
                              </div>
                              <div className="text-sm text-gray-400">
                                ID: {attempt.studentId || "N/A"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span
                              className={`text-2xl font-bold ${getScoreColor(
                                attempt.score,
                                quizDetails.questions.length
                              )}`}
                            >
                              {attempt.score !== undefined
                                ? `${attempt.score}/${quizDetails.questions.length}`
                                : "N/A"}
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${badge.color}`}
                            >
                              {badge.text}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-gray-400">
                            {attempt.score !== undefined
                              ? `${Math.round(
                                  (attempt.score /
                                    quizDetails.questions.length) *
                                    100
                                )}%`
                              : "Not scored"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-lg text-gray-200">
                            {new Date(attempt.submittedAt).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-400">
                            {new Date(attempt.submittedAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() =>
                                handleViewStudentReport(attempt._id)
                              }
                              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
                              title="View Detailed Report"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : attempts.length > 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                No matching students found
              </h3>
              <p className="text-gray-400">
                Try adjusting your search terms or filters.
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                No Students Yet
              </h3>
              <p className="text-gray-400">
                Students haven't taken this quiz yet. Share the quiz code with
                your students!
              </p>
              <div className="mt-6 p-4 bg-purple-600/20 rounded-lg border border-purple-500/30 inline-block">
                <p className="text-sm text-gray-300 mb-2">Quiz Code:</p>
                <p className="text-2xl font-bold font-mono text-purple-300">
                  {quizDetails.quizCode}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default TeacherQuizAttemptsPage;
