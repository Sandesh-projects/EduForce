// frontend/src/pages/StudentTakeQuizPage.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../axios";
import { toast } from "react-toastify";
import {
  Timer,
  CheckSquare,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Flag,
} from "lucide-react";

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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionStatuses, setQuestionStatuses] = useState({});
  const quizContainerRef = useRef(null);
  const WARNING_THRESHOLD = 3;

  // Updated fullscreen function: use document.documentElement
  const enterFullscreen = useCallback(() => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable full-screen mode:", err);
      });
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
    toast.info("Entering full-screen mode for proctoring. Do not exit!");
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }, []);

  const handleProctoringEvent = useCallback(
    (eventType, description) => {
      setProctoringEvents((prev) => {
        const newEvent = { timestamp: new Date(), eventType, description };
        const updatedEvents = [...prev, newEvent];
        setIsSuspicious(true);
        toast.warn(`Proctoring Alert: ${description}`);

        if (updatedEvents.length >= WARNING_THRESHOLD) {
          toast.error(
            "Multiple suspicious activities detected. Quiz terminated and not submitted."
          );
          setSubmitted(true);
          exitFullscreen();
          navigate("/student/home");
          return [];
        }
        return updatedEvents;
      });
    },
    [exitFullscreen, navigate]
  );

  const handleFullscreenChange = useCallback(() => {
    if (
      !document.fullscreenElement &&
      !document.webkitFullscreenElement &&
      !document.msFullscreenElement &&
      isAttemptingQuiz
    ) {
      handleProctoringEvent(
        "fullscreen_exit",
        "Exited full-screen mode. Quiz terminated."
      );
      setSubmitted(true);
      exitFullscreen();
      navigate("/student/home");
    }
  }, [isAttemptingQuiz, handleProctoringEvent, exitFullscreen, navigate]);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden && isAttemptingQuiz) {
      handleProctoringEvent("window_blur", "Switched to another tab/window.");
    }
  }, [isAttemptingQuiz, handleProctoringEvent]);

  const handleCopyPasteAttempt = useCallback(
    (event) => {
      if (
        isAttemptingQuiz &&
        (event.ctrlKey || event.metaKey) &&
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
      document.addEventListener("fullscreenchange", handleFullscreenChange);
      document.addEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.addEventListener("msfullscreenchange", handleFullscreenChange);
      document.addEventListener("visibilitychange", handleVisibilityChange);
      document.addEventListener("keydown", handleCopyPasteAttempt);
      document.addEventListener("contextmenu", handleContextMenu);
      document.addEventListener("keydown", handleKeyDownForDevTools);
      document.body.style.userSelect = "none";
      document.body.style.webkitUserSelect = "none";
      document.body.style.MozUserSelect = "none";
      document.body.style.msUserSelect = "none";
    }

    return () => {
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
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDownForDevTools);
      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";
      document.body.style.MozUserSelect = "";
      document.body.style.msUserSelect = "";
    };
  }, [
    isAttemptingQuiz,
    handleFullscreenChange,
    handleVisibilityChange,
    handleCopyPasteAttempt,
    handleContextMenu,
    handleKeyDownForDevTools,
  ]);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await axios.get(
          `/api/student/quizzes/take/${quizCode}`
        );
        setQuiz(response.data);
        const initialAnswers = {};
        const initialStatuses = {};
        response.data.questions.forEach((q) => {
          initialAnswers[q.id] = null;
          initialStatuses[q.id] = "unanswered";
        });
        setSelectedAnswers(initialAnswers);
        setQuestionStatuses(initialStatuses);
      } catch (err) {
        console.error("Error fetching quiz:", err);
        setError("Quiz not found or not available. Please check the code.");
        toast.error("Failed to load quiz.");
        navigate("/student/home");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizCode, navigate]);

  const handleOptionChange = (questionId, optionId) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
    setQuestionStatuses((prev) => ({
      ...prev,
      [questionId]: "answered",
    }));
  };

  const handleStartQuiz = () => {
    setIsAttemptingQuiz(true);
    enterFullscreen();
  };

  const handleNextQuestion = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleJumpToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };

  const handleToggleFlag = () => {
    if (!quiz) return;
    const currentQuestionId = quiz.questions[currentQuestionIndex].id;
    setQuestionStatuses((prev) => ({
      ...prev,
      [currentQuestionId]:
        prev[currentQuestionId] === "flagged"
          ? selectedAnswers[currentQuestionId] != null
            ? "answered"
            : "unanswered"
          : "flagged",
    }));
  };

  const handleSubmitQuiz = async () => {
    if (isSuspicious && proctoringEvents.length >= WARNING_THRESHOLD) {
      toast.error(
        "Quiz terminated due to suspicious activity and cannot be submitted."
      );
      exitFullscreen();
      navigate("/student/home");
      return;
    }

    const confirmSubmit = window.confirm(
      "Are you sure you want to submit the quiz? You cannot change answers after this."
    );
    if (!confirmSubmit) {
      return;
    }

    setSubmitted(true);
    setLoading(true);
    exitFullscreen();

    const answersToSubmit = Object.keys(selectedAnswers).map((questionId) => ({
      questionId,
      selectedOptionId: selectedAnswers[questionId],
    }));

    try {
      const response = await axios.post("/api/student/quizzes/submit", {
        quizId: quiz._id,
        answers: answersToSubmit,
        proctoringEvents: proctoringEvents,
        isSuspicious: isSuspicious,
      });
      toast.success("Quiz submitted successfully!");
      navigate(`/student/quizzes/report/${response.data._id}`);
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

  const currentQuestion = quiz.questions[currentQuestionIndex];

  return (
    <div
      ref={quizContainerRef}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8 overflow-hidden relative"
      style={{
        userSelect: "none",
        MozUserSelect: "none",
        WebkitUserSelect: "none",
        msUserSelect: "none",
      }}
    >
      <div className="max-w-6xl mx-auto flex h-[calc(100vh-64px)] gap-6">
        {/* Left Section */}
        <div className="flex-1 flex flex-col bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-lg overflow-y-auto">
          <h1 className="text-3xl font-bold mb-4 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent sticky top-0 bg-gray-800/30 pt-2 pb-4 z-10">
            {quiz.quizTitle}
          </h1>
          {isSuspicious && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg mb-6 flex items-center">
              <AlertTriangle className="w-6 h-6 mr-3" />
              <p>
                Suspicious activity detected! Further infractions may result in
                quiz termination.
              </p>
            </div>
          )}
          <div className="flex-grow">
            <p className="text-xl font-semibold mb-4 text-white">
              Q{currentQuestionIndex + 1}: {currentQuestion.questionText}
            </p>
            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <label
                  key={option.id}
                  className="flex items-center p-3 rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition-colors duration-200"
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option.id}
                    checked={selectedAnswers[currentQuestion.id] === option.id}
                    onChange={() =>
                      handleOptionChange(currentQuestion.id, option.id)
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
          <div className="flex justify-between mt-6 sticky bottom-0 bg-gray-800/30 pt-4 pb-2 z-10">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0 || submitted}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5 mr-2" /> Previous
            </button>
            <button
              onClick={handleToggleFlag}
              disabled={submitted}
              className={`px-6 py-3 rounded-lg flex items-center transition-colors duration-200 ${
                questionStatuses[currentQuestion.id] === "flagged"
                  ? "bg-orange-500 hover:bg-orange-600"
                  : "bg-blue-600 hover:bg-blue-700"
              } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Flag className="w-5 h-5 mr-2" />{" "}
              {questionStatuses[currentQuestion.id] === "flagged"
                ? "Unflag"
                : "Flag for Review"}
            </button>
            <button
              onClick={handleNextQuestion}
              disabled={
                currentQuestionIndex === quiz.questions.length - 1 || submitted
              }
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>

        {/* Right Section */}
        <div className="w-1/4 flex flex-col bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-lg overflow-y-auto">
          <h2 className="text-2xl font-bold mb-6 text-center text-teal-400">
            Questions
          </h2>
          <div className="grid grid-cols-4 gap-3 mb-6">
            {quiz.questions.map((q, index) => {
              const status = questionStatuses[q.id];
              let bgColor = "bg-gray-700 hover:bg-gray-600";
              if (status === "answered")
                bgColor = "bg-green-600 hover:bg-green-700";
              if (status === "flagged")
                bgColor = "bg-orange-500 hover:bg-orange-600";
              const isActive = index === currentQuestionIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => handleJumpToQuestion(index)}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg text-lg font-semibold transition-colors duration-200 ${bgColor} ${
                    isActive ? "ring-2 ring-purple-400 scale-110" : ""
                  } ${submitted ? "cursor-not-allowed opacity-70" : ""}`}
                  disabled={submitted}
                  title={
                    status === "answered"
                      ? "Answered"
                      : status === "flagged"
                      ? "Flagged for Review"
                      : "Unanswered"
                  }
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-auto text-center pt-4 border-t border-gray-700">
            <button
              onClick={handleSubmitQuiz}
              disabled={submitted || loading}
              className={`px-8 py-3 rounded-full text-lg font-semibold transition-all duration-300 ${
                submitted || loading
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white transform hover:scale-105"
              }`}
            >
              {loading ? "Submitting..." : "Submit Quiz"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentTakeQuizPage;
