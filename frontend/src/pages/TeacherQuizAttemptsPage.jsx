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
  Frown, // Added for error state
  ArrowLeft, // Added for back button
} from "lucide-react";
import { Line, Bar } from "react-chartjs-2";
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
  const { quizId } = useParams(); // Get quizId from the URL
  const navigate = useNavigate();

  const [quizDetails, setQuizDetails] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchQuizAttempts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch quiz details (to get totalQuestions for scoring display, etc.)
      // This is a protected route for teacher/student
      const quizResponse = await axios.get(`/api/quizzes/${quizId}`);
      setQuizDetails(quizResponse.data);

      // Fetch all attempts for this quiz
      // This hits the /api/quizzes/:quizId/attempts endpoint, protected for 'teacher'
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
    // Navigate to the teacher's view of a specific student's detailed report
    navigate(`/teacher/attempts/${attemptId}`);
  };

  const quizStats = useMemo(() => {
    if (!attempts.length || !quizDetails) {
      return null;
    }

    const scores = attempts.map((a) => a.score || 0);
    const totalScore = scores.reduce((sum, score) => sum + score, 0);
    const averageScore = totalScore / attempts.length;

    const maxScore = quizDetails.questions ? quizDetails.questions.length : 1;
    // Define a clear pass threshold, e.g., 60%
    const passThreshold = 0.6;
    const passedAttempts = attempts.filter(
      (a) => a.score / maxScore >= passThreshold
    );
    const passRate = (passedAttempts.length / attempts.length) * 100;

    const scoreDistribution = {};
    scores.forEach((score) => {
      scoreDistribution[score] = (scoreDistribution[score] || 0) + 1;
    });

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
          backgroundColor: "rgba(139, 92, 246, 0.6)", // Purple shade
          borderColor: "rgba(139, 92, 246, 1)",
          borderWidth: 1,
        },
      ],
    };

    const scoreChartOptions = {
      responsive: true,
      maintainAspectRatio: false, // Allows the chart to take parent div's size
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: "#ddd", // Light gray for legend text
          },
        },
        title: {
          display: true,
          text: "Score Distribution",
          color: "#eee", // White for title text
          font: {
            size: 18,
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Score",
            color: "#ddd", // Light gray for X-axis title
          },
          ticks: {
            color: "#bbb", // Lighter gray for X-axis ticks
          },
          grid: {
            color: "rgba(255,255,255,0.1)", // Faint grid lines
          },
        },
        y: {
          title: {
            display: true,
            text: "Number of Students",
            color: "#ddd", // Light gray for Y-axis title
          },
          ticks: {
            color: "#bbb", // Lighter gray for Y-axis ticks
            stepSize: 1, // Ensure integer ticks for student count
          },
          grid: {
            color: "rgba(255,255,255,0.1)", // Faint grid lines
          },
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
      scoreChartOptions,
      maxPossibleScore: maxScore,
    };
  }, [attempts, quizDetails]); // Recalculate if attempts or quizDetails change

  // Loading state UI
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex justify-center items-center text-white">
        <Loader className="w-8 h-8 animate-spin mr-3" /> Loading quiz report...
      </div>
    );
  }

  // Error state UI
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center p-8">
        <div className="text-center p-8 bg-gray-800/70 rounded-lg shadow-xl border border-gray-700">
          <Frown className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-2xl font-semibold text-red-400 mb-4">
            Error Loading Page
          </p>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => navigate("/teacher/quizzes")}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors duration-200 flex items-center mx-auto"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to My Quizzes
          </button>
        </div>
      </div>
    );
  }

  // No quiz details loaded (should be caught by error, but good as a fallback)
  if (!quizDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex justify-center items-center text-gray-400">
        Quiz details could not be loaded. Please try again.
      </div>
    );
  }

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
        <button
          onClick={() => navigate("/teacher/quizzes")}
          className="mb-6 flex items-center text-purple-400 hover:text-purple-600 transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to My Quizzes
        </button>

        <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-6 text-center">
          Quiz Report: {quizDetails.quizTitle} ({quizDetails.quizCode})
        </h1>
        <p className="text-lg text-gray-300 text-center mb-8">
          Subject: {quizDetails.subject} | Topic:{" "}
          {quizDetails.userProvidedTopic}
        </p>

        {quizStats && attempts.length > 0 ? (
          <section className="mb-12 bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl">
            <h2 className="text-3xl font-bold text-purple-300 mb-6 flex items-center">
              <BarChart2 className="w-7 h-7 mr-3" /> Overall Quiz Statistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-700/50 p-5 rounded-xl shadow-lg flex flex-col items-center">
                <p className="text-lg text-gray-300">Total Attempts</p>
                <p className="text-4xl font-extrabold text-blue-400">
                  {quizStats.totalAttempts}
                </p>
              </div>
              <div className="bg-gray-700/50 p-5 rounded-xl shadow-lg flex flex-col items-center">
                <p className="text-lg text-gray-300">Average Score</p>
                <p className="text-4xl font-extrabold text-green-400">
                  {quizStats.averageScore} / {quizStats.maxPossibleScore}
                </p>
              </div>
              <div className="bg-gray-700/50 p-5 rounded-xl shadow-lg flex flex-col items-center">
                <p className="text-lg text-gray-300">Pass Rate (60%)</p>
                <p className="text-4xl font-extrabold text-yellow-400">
                  {quizStats.passRate}%
                </p>
              </div>
              <div className="bg-gray-700/50 p-5 rounded-xl shadow-lg flex flex-col items-center">
                <p className="text-lg text-gray-300">Highest Score</p>
                <p className="text-4xl font-extrabold text-red-400">
                  {quizStats.highestScore} / {quizStats.maxPossibleScore}
                </p>
              </div>
            </div>

            {/* Chart for Score Distribution */}
            <div className="bg-gray-700/50 p-6 rounded-xl shadow-lg h-96">
              {" "}
              {/* Added fixed height for chart */}
              <Bar
                data={quizStats.scoreChartData}
                options={quizStats.scoreChartOptions}
              />
            </div>
          </section>
        ) : (
          <p className="text-center text-gray-400 py-10">
            No attempts recorded for this quiz yet.
          </p>
        )}

        <section className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl">
          <h2 className="text-3xl font-bold text-purple-300 mb-6 flex items-center">
            <User className="w-7 h-7 mr-3" /> Student Attempts
          </h2>
          {attempts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700 rounded-xl overflow-hidden">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Date Taken
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {attempts.map((attempt) => (
                    <tr key={attempt._id} className="hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {attempt.studentName || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">
                        {attempt.score !== undefined
                          ? `${attempt.score} / ${quizDetails.questions.length}`
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(attempt.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewStudentReport(attempt._id)}
                          className="text-blue-400 hover:text-blue-300 p-2 rounded-full hover:bg-gray-700 transition-colors duration-200"
                          title="View Full Report"
                        >
                          <BookOpen className="w-5 h-5 inline-block mr-1" />{" "}
                          View Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-400">
              No students have taken this quiz yet.
            </p>
          )}
        </section>
      </div>
    </div>
  );
};

export default TeacherQuizAttemptsPage;
