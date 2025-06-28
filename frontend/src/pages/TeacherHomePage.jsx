// src/pages/TeacherHomePage.jsx
import React, { useState, useRef } from "react";
import axios from "../axios"; // Your configured axios instance
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify"; // For notifications
import { Link } from "react-router-dom"; // Import Link for navigation

// Import Lucide Icons
import {
  Brain,
  Upload,
  CheckCircle,
  X, // Icon for closing modal
  Loader, // Icon for loading state
  ClipboardList,
  BookText, // New icon for subjective questions
  LayoutDashboard, // A general dashboard icon for the main section
} from "lucide-react";

const TeacherHomePage = () => {
  const { user, isLoggedIn } = useAuth();
  const [showGenerateQuizModal, setShowGenerateQuizModal] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [subject, setSubject] = useState("");
  const [userProvidedTopic, setUserProvidedTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [generateSuccess, setGenerateSuccess] = useState("");

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      setGenerateError(""); // Clear any previous errors
    } else {
      setPdfFile(null);
      setGenerateError("Please select a PDF file.");
    }
  };

  const handleGenerateQuizSubmit = async (e) => {
    e.preventDefault();
    setGenerateLoading(true);
    setGenerateError("");
    setGenerateSuccess("");

    if (!pdfFile) {
      setGenerateError("Please upload a PDF file.");
      setGenerateLoading(false);
      return;
    }
    if (!subject.trim()) {
      setGenerateError("Please enter a Subject.");
      setGenerateLoading(false);
      return;
    }
    if (!userProvidedTopic.trim()) {
      setGenerateError("Please enter a Topic.");
      setGenerateLoading(false);
      return;
    }
    if (numQuestions < 1 || numQuestions > 25) {
      setGenerateError("Number of questions must be between 1 and 25.");
      setGenerateLoading(false);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(pdfFile);

    reader.onloadend = async () => {
      const base64Pdf = reader.result.split(",")[1]; // Get the Base64 part

      try {
        const response = await axios.post("/api/quizzes/generate", {
          pdfBase64: base64Pdf,
          subject,
          userProvidedTopic,
          numQuestions: parseInt(numQuestions), // Ensure numQuestions is a number
        });

        setGenerateSuccess(
          `Quiz "${response.data.quiz.quizTitle}" (${response.data.quiz.quizCode}) generated successfully!`
        );
        toast.success(
          `Quiz "${response.data.quiz.quizTitle}" generated successfully!`
        );

        setShowGenerateQuizModal(false); // Close modal on success
        setPdfFile(null); // Clear form fields
        setSubject("");
        setUserProvidedTopic("");
        setNumQuestions(5);
        if (fileInputRef.current) {
          fileInputRef.current.value = ""; // Clear file input
        }
      } catch (error) {
        console.error(
          "Error generating quiz:",
          error.response?.data || error.message
        );
        setGenerateError(
          error.response?.data?.message ||
            "Failed to generate quiz. Please try again."
        );
        toast.error(
          error.response?.data?.message || "Failed to generate quiz."
        );
      } finally {
        setGenerateLoading(false);
      }
    };

    reader.onerror = (error) => {
      setGenerateError("Failed to read PDF file.");
      setGenerateLoading(false);
      console.error("FileReader error:", error);
      toast.error("Failed to read PDF file.");
    };
  };

  // Handler for the new "Generate Subjective Test" button
  const handleGenerateSubjectiveTest = () => {
    toast.info("Subjective test generation feature is yet to be implemented!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-inter flex flex-col items-center">
      {/* Background overlay for subtle effect */}
      <div
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at top left, #8B5CF6, transparent 50%), radial-gradient(circle at bottom right, #EC4899, transparent 50%)",
        }}
      ></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 w-full">
        {/* Welcome Section */}
        <section className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Welcome, Esteemed Educator!
          </h1>
          <p className="text-xl text-gray-300">
            Your hub for creating engaging content and tracking student success.
          </p>
        </section>

        {/* Main Dashboard Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Left Column: Create New Content (MCQ & Subjective) */}
          <div className="lg:col-span-2 bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-xl flex flex-col">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
              <LayoutDashboard className="w-8 h-8 mr-3 text-purple-400" />{" "}
              Create New Content
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
              {/* Card for AI MCQ Generation */}
              <div className="bg-gray-800/50 border border-purple-800 bg-purple-900/20 rounded-xl p-6 flex flex-col items-center text-center shadow-lg hover:shadow-purple-500/30 transition-all duration-300">
                <Brain className="w-14 h-14 text-purple-400 mb-4" />
                <h3 className="text-2xl font-semibold mb-3">
                  AI MCQ Generator
                </h3>
                <p className="text-lg text-gray-300 mb-6 flex-grow">
                  Upload a PDF and let Gemini AI create multiple-choice
                  questions for you.
                </p>
                <button
                  onClick={() => setShowGenerateQuizModal(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 w-full"
                >
                  Generate MCQs
                </button>
              </div>

              {/* Card for Subjective Test Generation */}
              <div className="bg-gray-800/50 border border-blue-800 bg-blue-900/20 rounded-xl p-6 flex flex-col items-center text-center shadow-lg hover:shadow-blue-500/30 transition-all duration-300">
                <BookText className="w-14 h-14 text-blue-400 mb-4" />
                <h3 className="text-2xl font-semibold mb-3">
                  Subjective Test Creator
                </h3>
                <p className="text-lg text-gray-300 mb-6 flex-grow">
                  Design tests with open-ended questions and detailed answers
                  for deeper assessment.
                </p>
                <button
                  onClick={handleGenerateSubjectiveTest}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-3 rounded-full font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 transform hover:scale-105 w-full"
                >
                  Create Subjective Test
                </button>
              </div>
            </div>
            {generateSuccess && (
              <div className="mt-6 flex items-center text-green-400 p-3 rounded-lg bg-green-900/30">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span>{generateSuccess}</span>
              </div>
            )}
            {generateError && (
              <div className="mt-6 flex items-center text-red-400 p-3 rounded-lg bg-red-900/30">
                <X className="w-5 h-5 mr-2" />
                <span>{generateError}</span>
              </div>
            )}
          </div>

          {/* Right Column: Quick Actions / Navigation Cards (Manage Quizzes) */}
          <div className="lg:col-span-1 bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-xl flex flex-col">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
              <ClipboardList className="w-8 h-8 mr-3 text-pink-400" /> Your
              Quizzes
            </h2>
            {/* Card to navigate to Your Quizzes Page */}
            <div className="bg-gray-800/50 border border-pink-800 bg-pink-900/20 rounded-xl p-6 flex flex-col items-center text-center shadow-lg hover:shadow-pink-500/30 transition-all duration-300 flex-grow justify-center">
              <ClipboardList className="w-14 h-14 text-pink-400 mb-4" />
              <h3 className="text-2xl font-semibold mb-3">
                Manage Your Quizzes
              </h3>
              <p className="text-lg text-gray-300 mb-6">
                View, edit, publish, and delete your created quizzes.
              </p>
              <Link
                to="/teacher/quizzes"
                className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-8 py-3 rounded-full hover:from-pink-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 w-full"
              >
                View All Quizzes
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 py-20 text-center flex justify-center">
          <div className="max-w-4xl mx-auto w-full">
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
      </div>

      {/* Generate Quiz Modal */}
      {showGenerateQuizModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md relative border border-purple-700 shadow-xl">
            <button
              onClick={() => setShowGenerateQuizModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-3xl font-bold text-white mb-6 text-center">
              Generate AI Quiz
            </h2>
            <form onSubmit={handleGenerateQuizSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="pdfFile"
                  className="block text-gray-300 text-sm font-medium mb-2"
                >
                  Upload PDF
                </label>
                <input
                  type="file"
                  id="pdfFile"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="block w-full text-sm text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-purple-500 file:text-white
                    hover:file:bg-purple-600"
                />
                {pdfFile && (
                  <p className="text-xs text-gray-400 mt-1">
                    Selected: {pdfFile.name}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-gray-300 text-sm font-medium mb-2"
                >
                  Subject Name
                </label>
                <input
                  type="text"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Physics, History, Algebra"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="topic"
                  className="block text-gray-300 text-sm font-medium mb-2"
                >
                  Topic
                </label>
                <input
                  type="text"
                  id="topic"
                  value={userProvidedTopic}
                  onChange={(e) => setUserProvidedTopic(e.target.value)}
                  placeholder="e.g., Newton's Laws, World War II, Quadratic Equations"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="numQuestions"
                  className="block text-gray-300 text-sm font-medium mb-2"
                >
                  Number of Questions (1-25)
                </label>
                <input
                  type="number"
                  id="numQuestions"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(e.target.value)}
                  min="1"
                  max="25"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              {generateError && (
                <p className="text-red-400 text-sm text-center">
                  {generateError}
                </p>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-md font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 flex items-center justify-center"
                disabled={generateLoading}
              >
                {generateLoading ? (
                  <>
                    <Loader className="w-5 h-5 mr-3 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Quiz"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherHomePage;
