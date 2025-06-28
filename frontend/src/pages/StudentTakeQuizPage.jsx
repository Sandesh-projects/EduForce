// frontend/src/pages/StudentTakeQuizPage.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../axios";
import { toast } from "react-toastify";
import { Timer, CheckSquare, XCircle, AlertTriangle } from "lucide-react";

const StudentTakeQuizPage = () => {
  const { quizCode } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isAttemptingQuiz, setIsAttemptingQuiz] = useState(false);
  const [proctoringEvents, setProctoringEvents] = useState([]);
  const [isSuspicious, setIsSuspicious] = useState(false);
  const quizContainerRef = useRef(null);

  const WARNING_THRESHOLD = 3; // Number of suspicious activities before instant quit

  // Proctoring: Fullscreen Mode and Window Focus
  const enterFullscreen = useCallback(() => {
    if (quizContainerRef.current) {
      if (quizContainerRef.current.requestFullscreen) {
        quizContainerRef.current.requestFullscreen();
      } else if (quizContainerRef.current.webkitRequestFullscreen) {
        /* Safari */
        quizContainerRef.current.webkitRequestFullscreen();
      } else if (quizContainerRef.current.msRequestFullscreen) {
        /* IE11 */
        quizContainerRef.current.msRequestFullscreen();
      }
      toast.info("Entering full-screen mode for proctoring. Do not exit!");
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      /* Safari */
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      /* IE11 */
      document.msExitFullscreen();
    }
  }, []);

  const handleProctoringEvent = useCallback(
    (eventType, description) => {
      const newEvent = { timestamp: new Date(), eventType, description };
      setProctoringEvents((prev) => [...prev, newEvent]);
      setIsSuspicious(true);
      toast.warn(`Proctoring Alert: ${description}`);

      // Check against WARNING_THRESHOLD using the updated state length
      // Note: proctoringEvents.length here will reflect the state *before* the current update.
      // So, for the current event, we check prev.length + 1.
      if (proctoringEvents.length + 1 >= WARNING_THRESHOLD) {
        toast.error(
          "Multiple suspicious activities detected. Quiz terminated and not submitted."
        );
        setSubmitted(true); // Prevent submission
        exitFullscreen();
        navigate("/student/home"); // Redirect out of quiz
      }
    },
    [proctoringEvents.length, exitFullscreen, navigate] // proctoringEvents.length is crucial here
  );

  const handleFullscreenChange = useCallback(() => {
    if (
      !document.fullscreenElement &&
      !document.webkitFullscreenElement &&
      !document.msFullscreenElement &&
      isAttemptingQuiz // Only trigger if currently attempting quiz
    ) {
      // Exited fullscreen
      handleProctoringEvent("fullscreen_exit", "Exited full-screen mode.");
      // Optionally, force re-entry or terminate
      // enterFullscreen(); // Uncomment to force re-entry
    }
  }, [isAttemptingQuiz, handleProctoringEvent]);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden && isAttemptingQuiz) {
      handleProctoringEvent("window_blur", "Switched to another tab/window.");
    }
  }, [isAttemptingQuiz, handleProctoringEvent]);

  // Basic Copy/Paste Detection (limited effectiveness)
  const handleCopyPasteAttempt = useCallback(
    (event) => {
      if (
        isAttemptingQuiz &&
        (event.ctrlKey || event.metaKey) && // Ctrl for Windows/Linux, Meta for Mac
        (event.key === "c" || event.key === "v" || event.key === "x")
      ) {
        handleProctoringEvent(
          "copy_paste_attempt",
          `Attempted to ${
            event.key === "c" ? "copy" : event.key === "v" ? "paste" : "cut"
          }.`
        );
      }
    },
    [isAttemptingQuiz, handleProctoringEvent]
  );

  // Named function for contextmenu for proper cleanup
  const handleContextMenu = useCallback(
    (e) => {
      if (isAttemptingQuiz) {
        e.preventDefault();
        handleProctoringEvent(
          "other_suspicious_activity",
          "Attempted right-click."
        );
      }
    },
    [isAttemptingQuiz, handleProctoringEvent]
  );

  // Named function for F12/DevTools for proper cleanup
  const handleKeyDownForDevTools = useCallback(
    (e) => {
      if (
        isAttemptingQuiz &&
        (e.key === "F12" || (e.ctrlKey && e.shiftKey && e.key === "I"))
      ) {
        e.preventDefault();
        handleProctoringEvent(
          "other_suspicious_activity",
          "Attempted to open developer tools."
        );
      }
    },
    [isAttemptingQuiz, handleProctoringEvent]
  );

  useEffect(() => {
    if (isAttemptingQuiz) {
      // Add event listeners for proctoring
      document.addEventListener("fullscreenchange", handleFullscreenChange);
      document.addEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.addEventListener("msfullscreenchange", handleFullscreenChange);
      document.addEventListener("visibilitychange", handleVisibilityChange);
      document.addEventListener("keydown", handleCopyPasteAttempt);
      document.addEventListener("contextmenu", handleContextMenu); // Use named function
      document.addEventListener("keydown", handleKeyDownForDevTools); // Use named function
    }

    return () => {
      // Clean up event listeners
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "msfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("keydown", handleCopyPasteAttempt);
      document.removeEventListener("contextmenu", handleContextMenu); // Clean up named function
      document.removeEventListener("keydown", handleKeyDownForDevTools); // Clean up named function
    };
  }, [
    isAttemptingQuiz,
    handleFullscreenChange,
    handleVisibilityChange,
    handleCopyPasteAttempt,
    handleProctoringEvent, // Important for callbacks
    handleContextMenu, // New dependency
    handleKeyDownForDevTools, // New dependency
  ]);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        // UPDATED API PATH: /api/student/quizzes/take/:quizCode
        const response = await axios.get(
          `/api/student/quizzes/take/${quizCode}`
        );
        setQuiz(response.data);
        // Initialize selected answers with null for each question
        const initialAnswers = {};
        response.data.questions.forEach((q) => {
          initialAnswers[q.id] = null;
        });
        setSelectedAnswers(initialAnswers);
      } catch (err) {
        console.error("Error fetching quiz:", err);
        setError("Quiz not found or not available. Please check the code.");
        toast.error("Failed to load quiz.");
        navigate("/student/home"); // Redirect back if quiz not found
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizCode, navigate]); // Added navigate to dependency array

  const handleOptionChange = (questionId, optionId) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleStartQuiz = () => {
    setIsAttemptingQuiz(true);
    enterFullscreen();
  };

  const handleSubmitQuiz = async () => {
    // Replaced window.confirm with a custom modal/toast message.
    // For simplicity, a direct toast.info is used here, but for a real app,
    // you'd render a dedicated confirmation modal component.
    toast.info("Submitting quiz. You cannot change answers after this.", {
      position: "top-center",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });

    // Before setting submitted=true, check if termination condition is met
    if (isSuspicious && proctoringEvents.length >= WARNING_THRESHOLD) {
      toast.error(
        "Quiz terminated due to suspicious activity and cannot be submitted."
      );
      exitFullscreen();
      navigate("/student/home");
      return; // Stop submission process
    }

    setSubmitted(true);
    setLoading(true);
    exitFullscreen(); // Exit full screen on submit

    const answersToSubmit = Object.keys(selectedAnswers).map((questionId) => ({
      questionId,
      selectedOptionId: selectedAnswers[questionId],
    }));

    try {
      // UPDATED API PATH: /api/student/quizzes/submit
      const response = await axios.post("/api/student/quizzes/submit", {
        quizId: quiz._id,
        answers: answersToSubmit,
        proctoringEvents: proctoringEvents,
        isSuspicious: isSuspicious,
      });
      toast.success("Quiz submitted successfully!");
      navigate(`/student/quizzes/report/${response.data._id}`); // Navigate to report page
    } catch (err) {
      console.error("Error submitting quiz:", err);
      toast.error("Failed to submit quiz. Please try again.");
      setError("Failed to submit quiz.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <p className="text-xl">Loading quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col items-center justify-center p-8">
        <XCircle className="w-20 h-20 text-red-500 mb-4" />
        <p className="text-2xl text-red-400 font-semibold">{error}</p>
        <button
          onClick={() => navigate("/student/home")}
          className="mt-6 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-all"
        >
          Go to Home
        </button>
      </div>
    );
  }

  if (!isAttemptingQuiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center p-8">
        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-xl text-center max-w-lg w-full">
          <h2 className="text-3xl font-bold mb-4 text-purple-400">
            {quiz.quizTitle}
          </h2>
          <p className="text-lg text-gray-300 mb-6">{quiz.quizInstructions}</p>
          <div className="mb-6 text-gray-400">
            <p>
              Subject: <span className="font-semibold">{quiz.subject}</span>
            </p>
            <p>
              Topic:{" "}
              <span className="font-semibold">{quiz.userProvidedTopic}</span>
            </p>
            <p>
              Questions:{" "}
              <span className="font-semibold">{quiz.questions.length}</span>
            </p>
          </div>
          <p className="text-red-400 mb-6 text-lg font-semibold">
            Warning: This quiz is proctored. Exiting full-screen or switching
            tabs will be detected and may result in quiz termination.
          </p>
          <button
            onClick={handleStartQuiz}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center mx-auto"
          >
            <Timer className="w-5 h-5 mr-2" />
            Start Quiz Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={quizContainerRef}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8 overflow-y-auto"
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          {quiz.quizTitle}
        </h1>
        <p className="text-lg text-gray-300 mb-8 text-center">
          {quiz.quizInstructions}
        </p>

        {isSuspicious && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg mb-6 flex items-center">
            <AlertTriangle className="w-6 h-6 mr-3" />
            <p>
              Suspicious activity detected! Further infractions may result in
              quiz termination.
            </p>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmitQuiz();
          }}
        >
          <div className="space-y-10">
            {quiz.questions.map((question, index) => (
              <div
                key={question.id}
                className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-lg"
              >
                <p className="text-xl font-semibold mb-4 text-white">
                  Q{index + 1}: {question.questionText}
                </p>
                <div className="space-y-3">
                  {question.options.map((option) => (
                    <label
                      key={option.id}
                      className="flex items-center p-3 rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition-colors duration-200"
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option.id}
                        checked={selectedAnswers[question.id] === option.id}
                        onChange={() =>
                          handleOptionChange(question.id, option.id)
                        }
                        className="form-radio h-5 w-5 text-purple-500 bg-gray-900 border-gray-500 focus:ring-purple-400"
                        disabled={submitted}
                      />
                      <span className="ml-3 text-lg text-gray-200">
                        {option.text}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <button
              type="submit"
              disabled={submitted || loading}
              className={`px-10 py-4 rounded-full text-xl font-semibold transition-all duration-300 ${
                submitted || loading
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white transform hover:scale-105"
              }`}
            >
              {loading ? "Submitting..." : "Submit Quiz"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentTakeQuizPage;
