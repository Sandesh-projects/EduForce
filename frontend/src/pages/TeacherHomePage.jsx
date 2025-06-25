// src/pages/TeacherHomePage.jsx
import React from "react";
import {
  Video,
  FileText,
  Brain,
  PenTool,
  BarChart3,
  Eye,
  PlusCircle,
  Upload,
  CheckCircle,
  Edit,
  ClipboardList,
  Activity,
  Award,
  BookOpen, // Added for consistency, even if not directly used in teacher features list
  Users, // Added for consistency
} from "lucide-react"; // Ensured all potentially useful icons are imported

const TeacherHomePage = () => {
  // Dummy data for demonstration
  const playlists = [
    { id: 1, title: "Algebra I Fundamentals", videos: 12, notes: 3 },
    { id: 2, title: "Geometry Basics", videos: 8, notes: 2 },
    { id: 3, title: "Calculus AB: Limits", videos: 5, notes: 1 },
  ];

  const quizzes = [
    {
      id: 101,
      title: "Algebra Chapter 1 Quiz",
      status: "Published",
      questions: 20,
      submissions: 45,
    },
    {
      id: 102,
      title: "Geometry Unit 2 Test",
      status: "Draft",
      questions: 15,
      submissions: 0,
    },
    {
      id: 103,
      title: "Calculus Limits Intro",
      status: "Needs Review",
      questions: 10,
      submissions: 0,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-inter">
      {/* Background overlay for subtle effect */}
      <div
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at top left, #8B5CF6, transparent 50%), radial-gradient(circle at bottom right, #EC4899, transparent 50%)",
        }}
      ></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <section className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Welcome, Esteemed Educator!
          </h1>
          <p className="text-xl text-gray-300">
            Your hub for creating engaging content and tracking student success.
          </p>
        </section>

        {/* Quick Actions / Overview */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 flex flex-col items-center text-center shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
            <Video className="w-12 h-12 text-purple-400 mb-3" />
            <h3 className="text-2xl font-semibold mb-2">My Playlists</h3>
            <p className="text-gray-400">Organize your video lectures.</p>
            <button className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-2 rounded-full hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105">
              View All
            </button>
          </div>

          <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 flex flex-col items-center text-center shadow-lg hover:shadow-pink-500/20 transition-all duration-300">
            <ClipboardList className="w-12 h-12 text-pink-400 mb-3" />
            <h3 className="text-2xl font-semibold mb-2">Quiz Builder</h3>
            <p className="text-gray-400">Create & manage your assessments.</p>
            <button className="mt-4 bg-gradient-to-r from-pink-600 to-red-600 text-white px-5 py-2 rounded-full hover:from-pink-700 hover:to-red-700 transition-all duration-300 transform hover:scale-105">
              Start New
            </button>
          </div>

          <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 flex flex-col items-center text-center shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
            <BarChart3 className="w-12 h-12 text-teal-400 mb-3" />
            <h3 className="text-2xl font-semibold mb-2">Student Analytics</h3>
            <p className="text-gray-400">Monitor performance insights.</p>
            <button className="mt-4 bg-gradient-to-r from-teal-600 to-green-600 text-white px-5 py-2 rounded-full hover:from-teal-700 hover:to-green-700 transition-all duration-300 transform hover:scale-105">
              View Reports
            </button>
          </div>
        </section>

        {/* 1. Playlists Management */}
        <section className="mb-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-white">
              Your Video Playlists
            </h2>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full flex items-center space-x-2 transition-colors">
              <PlusCircle className="w-5 h-5" />
              <span>New Playlist</span>
            </button>
          </div>
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl">
            {playlists.length > 0 ? (
              <ul className="space-y-4">
                {playlists.map((playlist) => (
                  <li
                    key={playlist.id}
                    className="flex items-center justify-between bg-gray-900/50 p-4 rounded-xl border border-gray-700"
                  >
                    <div className="flex items-center space-x-4">
                      <Video className="w-6 h-6 text-purple-400" />
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {playlist.title}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {playlist.videos} videos, {playlist.notes} PDF notes
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button className="text-purple-400 hover:text-purple-300 text-sm font-medium">
                        Edit
                      </button>
                      <button className="text-pink-400 hover:text-pink-300 text-sm font-medium">
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-center py-8">
                No playlists yet. Start by creating a new one!
              </p>
            )}
          </div>
        </section>

        {/* 2. Content Upload & 3. AI MCQ Generation */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl">
            <h2 className="text-3xl font-bold text-white mb-6">
              Upload & Automate
            </h2>
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-xl p-8 text-center text-gray-400 hover:border-purple-500 transition-colors cursor-pointer">
              <Upload className="w-12 h-12 mb-4 text-gray-500" />
              <p className="text-lg mb-2">Drag & Drop PDFs Here</p>
              <p className="text-sm">or click to browse files</p>
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                id="pdf-upload"
              />
              <label
                htmlFor="pdf-upload"
                className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-full cursor-pointer transition-colors"
              >
                Select PDF
              </label>
            </div>
            <p className="text-gray-500 text-sm mt-4 text-center">
              Supported formats: .pdf (max 20MB)
            </p>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl">
            <h2 className="text-3xl font-bold text-white mb-6">
              AI Quiz Generation
            </h2>
            <div className="flex flex-col items-center justify-center p-8 border border-purple-800 bg-purple-900/20 rounded-xl">
              <Brain className="w-12 h-12 text-purple-400 mb-4" />
              <p className="text-lg text-gray-300 mb-4 text-center">
                Automatically generate Multiple Choice Questions (MCQs) from
                your uploaded PDFs using Gemini AI.
              </p>
              <button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105">
                Generate MCQs
              </button>
              <p className="text-gray-500 text-sm mt-4">
                Once uploaded, click to generate quizzes.
              </p>
            </div>
            {/* Dummy progress/status */}
            <div className="mt-6 flex items-center text-gray-400">
              <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
              <span>
                Last PDF Processed: "Physics_Ch1.pdf" - 15 MCQs generated.
              </span>
            </div>
          </div>
        </section>

        {/* 4. Review/Edit/Publish Quizzes */}
        <section className="mb-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-white">Your Quizzes</h2>
            <button className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-full flex items-center space-x-2 transition-colors">
              <PlusCircle className="w-5 h-5" />
              <span>Create New Quiz</span>
            </button>
          </div>
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl">
            {quizzes.length > 0 ? (
              <ul className="space-y-4">
                {quizzes.map((quiz) => (
                  <li
                    key={quiz.id}
                    className="flex flex-col md:flex-row items-center justify-between bg-gray-900/50 p-4 rounded-xl border border-gray-700"
                  >
                    <div className="flex items-center space-x-4 mb-3 md:mb-0">
                      <ClipboardList className="w-6 h-6 text-pink-400" />
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {quiz.title}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {quiz.questions} questions | Status:{" "}
                          <span
                            className={`${
                              quiz.status === "Published"
                                ? "text-green-400"
                                : quiz.status === "Draft"
                                ? "text-yellow-400"
                                : "text-blue-400"
                            } font-medium`}
                          >
                            {quiz.status}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      {quiz.status !== "Published" && (
                        <button className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center space-x-1">
                          <Edit className="w-4 h-4" /> <span>Edit</span>
                        </button>
                      )}
                      {quiz.status !== "Published" && (
                        <button className="bg-gradient-to-r from-teal-600 to-green-600 text-white px-4 py-2 rounded-full text-sm hover:from-teal-700 hover:to-green-700 transition-all duration-300">
                          Publish
                        </button>
                      )}
                      {quiz.status === "Published" && (
                        <span className="text-green-400 text-sm font-medium flex items-center space-x-1">
                          <CheckCircle className="w-4 h-4" /> Published
                        </span>
                      )}
                      <button className="text-red-400 hover:text-red-300 text-sm font-medium">
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-center py-8">
                No quizzes created yet. Start building one!
              </p>
            )}
          </div>
        </section>

        {/* 5. Monitor Students' Quiz Results & Analytics */}
        <section className="mb-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-white">
              Student Performance Analytics
            </h2>
            <button className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-full flex items-center space-x-2 transition-colors">
              <Activity className="w-5 h-5" />
              <span>Full Reports</span>
            </button>
          </div>
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900/50 p-5 rounded-xl border border-gray-700 text-center">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Average Quiz Score
                </h3>
                <p className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  82%
                </p>
                <p className="text-gray-400 text-sm mt-1">Across all quizzes</p>
              </div>
              <div className="bg-gray-900/50 p-5 rounded-xl border border-gray-700 text-center">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Active Students
                </h3>
                <p className="text-5xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                  1,245
                </p>
                <p className="text-gray-400 text-sm mt-1">Currently engaged</p>
              </div>
            </div>
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-white mb-4">
                Latest Quiz Submissions
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center justify-between text-gray-300 bg-gray-900/30 p-3 rounded-lg border border-gray-700">
                  <span>Alice Johnson - Algebra Chapter 1 Quiz (92%)</span>
                  <span className="text-sm text-green-400">Excellent!</span>
                </li>
                <li className="flex items-center justify-between text-gray-300 bg-gray-900/30 p-3 rounded-lg border border-gray-700">
                  <span>Bob Smith - Geometry Unit 2 Test (78%)</span>
                  <span className="text-sm text-yellow-400">Good</span>
                </li>
                <li className="flex items-center justify-between text-gray-300 bg-gray-900/30 p-3 rounded-lg border border-gray-700">
                  <span>Charlie Brown - Calculus Limits Intro (65%)</span>
                  <span className="text-sm text-red-400">Needs review</span>
                </li>
              </ul>
              <p className="text-gray-500 text-sm mt-4 text-center">
                View full report for detailed insights.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section (Reused from Landing Page, adapted for teacher) */}
        <section className="px-6 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl p-12 border border-purple-500/30 backdrop-blur-sm">
              <h2 className="text-4xl font-bold text-white mb-4">
                Empower Your Classroom with EduForce AI!
              </h2>
              <p className="text-gray-300 text-lg mb-8">
                Ready to revolutionize your teaching methods? Explore more
                features or connect with support.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105">
                  Explore Features
                </button>
                <button className="border border-gray-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white/10 transition-all duration-300">
                  Get Support
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer (Simplified from Landing Page, optional if you have a global footer) */}
        <footer className="px-6 py-8 border-t border-gray-800 text-center">
          <p className="text-gray-400">© 2025 EduForce. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default TeacherHomePage;
