// src/pages/QuizReportPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { BarChart2, Award, Clock, ArrowLeft } from "lucide-react"; // Import relevant icons

const QuizReportPage = () => {
  const { quizId } = useParams(); // Get quizId from URL params

  // Dummy data for the report
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    // Simulate fetching report data based on quizId
    // In a real app, you would make an API call here:
    // axios.get(`/api/quizzes/${quizId}/report`).then(response => setReportData(response.data));
    const dummyReport = {
      quizTitle: "Dummy Physics Quiz Report",
      quizCode: "PHYS001",
      subject: "Physics",
      topic: "Kinematics",
      totalStudents: 25,
      averageScore: "78%",
      highestScore: "95% (Student X)",
      lowestScore: "42% (Student Y)",
      commonMistakes: [
        "Misunderstanding of projectile motion formulas.",
        "Incorrect unit conversions.",
        "Confusing velocity and acceleration.",
      ],
      scoreDistribution: {
        "90-100%": 5,
        "80-89%": 8,
        "70-79%": 7,
        "60-69%": 3,
        "<60%": 2,
      },
      individualScores: [
        { name: "Alice", score: 92, time: "15m 2s" },
        { name: "Bob", score: 78, time: "18m 30s" },
        { name: "Charlie", score: 85, time: "16m 45s" },
        { name: "Diana", score: 60, time: "22m 10s" },
        { name: "Eve", score: 95, time: "14m 50s" },
      ],
    };
    setReportData(dummyReport);
  }, [quizId]); // Re-fetch if quizId changes

  if (!reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        <div className="w-8 h-8 border-4 border-purple-500 border-dotted rounded-full animate-spin"></div>
        <p className="ml-3">Loading report...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-inter py-12 px-6">
      <div
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at top left, #8B5CF6, transparent 50%), radial-gradient(circle at bottom right, #EC4899, transparent 50%)",
        }}
      ></div>
      <div className="relative z-10 max-w-5xl mx-auto bg-gray-800/40 backdrop-blur-sm border border-purple-700/50 rounded-2xl p-8 shadow-xl">
        <Link
          to="/teacher/quizzes"
          className="inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors duration-200 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Quizzes
        </Link>

        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Quiz Report: {reportData.quizTitle}
        </h1>
        <p className="text-gray-400 mb-6">
          <span className="font-semibold">Quiz ID:</span> {quizId} |{" "}
          <span className="font-semibold">Quiz Code:</span>{" "}
          <span className="font-mono text-purple-300">
            {reportData.quizCode}
          </span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-md">
            <h2 className="text-2xl font-semibold text-white mb-4">
              <BarChart2 className="inline-block w-6 h-6 mr-2 text-blue-400" />
              Overall Performance
            </h2>
            <p className="text-lg text-gray-300 mb-2">
              <span className="font-semibold">Total Students Attempted:</span>{" "}
              <span className="text-blue-300">{reportData.totalStudents}</span>
            </p>
            <p className="text-lg text-gray-300 mb-2">
              <span className="font-semibold">Average Score:</span>{" "}
              <span className="text-green-400">{reportData.averageScore}</span>
            </p>
            <p className="text-lg text-gray-300 mb-2">
              <span className="font-semibold">Highest Score:</span>{" "}
              <span className="text-yellow-400">{reportData.highestScore}</span>
            </p>
            <p className="text-lg text-gray-300">
              <span className="font-semibold">Lowest Score:</span>{" "}
              <span className="text-red-400">{reportData.lowestScore}</span>
            </p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-md">
            <h2 className="text-2xl font-semibold text-white mb-4">
              <Award className="inline-block w-6 h-6 mr-2 text-yellow-400" />
              Score Distribution
            </h2>
            <ul className="space-y-2">
              {Object.entries(reportData.scoreDistribution).map(
                ([range, count]) => (
                  <li
                    key={range}
                    className="flex justify-between text-gray-300 text-lg"
                  >
                    <span>{range}</span>
                    <span className="font-semibold text-purple-300">
                      {count} students
                    </span>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-md mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">
            <Clock className="inline-block w-6 h-6 mr-2 text-teal-400" />
            Common Areas for Improvement
          </h2>
          <ul className="list-disc list-inside text-gray-300 space-y-1">
            {reportData.commonMistakes.map((mistake, index) => (
              <li key={index}>{mistake}</li>
            ))}
          </ul>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-md">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Individual Scores
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700 rounded-lg overflow-hidden">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Time Taken
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {reportData.individualScores.map((student, index) => (
                  <tr key={index} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {student.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">
                      {student.score}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {student.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizReportPage;
