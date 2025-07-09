import React, { useState, useEffect } from "react";
import {
  FaTimes,
  FaEdit,
  FaSave,
  FaBan,
  FaQuestionCircle,
  FaBookOpen,
  FaGraduationCap,
} from "react-icons/fa";

/**
 * Enhanced QuizPreviewModal component with improved UX and visual consistency
 */
const QuizPreviewModal = ({ quiz, onClose, onSave }) => {
  const [editableQuiz, setEditableQuiz] = useState(null);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [isEditingQuizDetails, setIsEditingQuizDetails] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Initialize editable quiz and track changes
  useEffect(() => {
    if (quiz) {
      setEditableQuiz({ ...quiz });
      setHasUnsavedChanges(false);
    }
  }, [quiz]);

  // Track changes to mark as unsaved
  useEffect(() => {
    if (editableQuiz && quiz) {
      const hasChanges = JSON.stringify(editableQuiz) !== JSON.stringify(quiz);
      setHasUnsavedChanges(hasChanges);
    }
  }, [editableQuiz, quiz]);

  if (!editableQuiz) return null;

  // Enhanced handlers with consistent state management
  const handleDetailChange = (field, value) => {
    setEditableQuiz((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleQuestionChange = (questionId, updates) => {
    setEditableQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === questionId ? { ...q, ...updates } : q
      ),
    }));
  };

  const handleOptionChange = (questionId, optionId, newText) => {
    setEditableQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((opt) =>
                opt.id === optionId ? { ...opt, text: newText } : opt
              ),
            }
          : q
      ),
    }));
  };

  const handleSaveQuiz = () => {
    if (onSave) {
      onSave(editableQuiz);
    }
    setEditingQuestionId(null);
    setIsEditingQuizDetails(false);
    setHasUnsavedChanges(false);
  };

  const handleCancelEdit = () => {
    setEditableQuiz({ ...quiz });
    setEditingQuestionId(null);
    setIsEditingQuizDetails(false);
    setHasUnsavedChanges(false);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "text-green-400 bg-green-400/10";
      case "medium":
        return "text-yellow-400 bg-yellow-400/10";
      case "hard":
        return "text-red-400 bg-red-400/10";
      default:
        return "text-gray-400 bg-gray-400/10";
    }
  };

  const InputField = ({
    value,
    onChange,
    placeholder,
    className = "",
    multiline = false,
    rows = 3,
  }) => {
    const baseClasses =
      "w-full p-3 rounded-lg bg-gray-800/80 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200";

    if (multiline) {
      return (
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          className={`${baseClasses} resize-y min-h-[80px] ${className}`}
        />
      );
    }

    return (
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${baseClasses} ${className}`}
      />
    );
  };

  const EditButton = ({ onClick, isEditing, size = "md" }) => {
    const sizeClasses = size === "sm" ? "p-2" : "p-3";
    const iconSize = size === "sm" ? 16 : 20;

    return (
      <button
        onClick={onClick}
        className={`${sizeClasses} rounded-full transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${
          isEditing
            ? "bg-green-600 hover:bg-green-500 text-white"
            : "bg-blue-600 hover:bg-blue-500 text-white"
        }`}
        title={isEditing ? "Save Changes" : "Edit"}
      >
        {isEditing ? <FaSave size={iconSize} /> : <FaEdit size={iconSize} />}
      </button>
    );
  };

  const CancelButton = ({ onClick, size = "md" }) => {
    const sizeClasses = size === "sm" ? "p-2" : "p-3";
    const iconSize = size === "sm" ? 16 : 20;

    return (
      <button
        onClick={onClick}
        className={`${sizeClasses} rounded-full bg-red-600 hover:bg-red-500 text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105`}
        title="Cancel"
      >
        <FaBan size={iconSize} />
      </button>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center p-4 z-50">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-purple-500/30">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-purple-500/30 p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-600/20 rounded-full">
                <FaQuestionCircle className="text-purple-400" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Quiz Preview</h1>
                <p className="text-gray-400">
                  Review and edit your quiz content
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {hasUnsavedChanges && (
                <div className="flex items-center space-x-2 text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-sm">Unsaved changes</span>
                </div>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-all duration-200"
                title="Close"
              >
                <FaTimes size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-160px)] p-6">
          {/* Quiz Details Section */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <FaBookOpen className="text-purple-400" size={20} />
                <h2 className="text-xl font-semibold text-white">
                  Quiz Details
                </h2>
              </div>
              <div className="flex space-x-2">
                {isEditingQuizDetails ? (
                  <>
                    <EditButton
                      onClick={() => setIsEditingQuizDetails(false)}
                      isEditing={true}
                      size="sm"
                    />
                    <CancelButton onClick={handleCancelEdit} size="sm" />
                  </>
                ) : (
                  <EditButton
                    onClick={() => setIsEditingQuizDetails(true)}
                    isEditing={false}
                    size="sm"
                  />
                )}
              </div>
            </div>

            {isEditingQuizDetails ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Quiz Title
                  </label>
                  <InputField
                    value={editableQuiz.quizTitle || ""}
                    onChange={(e) =>
                      handleDetailChange("quizTitle", e.target.value)
                    }
                    placeholder="Enter quiz title"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Subject
                    </label>
                    <InputField
                      value={editableQuiz.subject || ""}
                      onChange={(e) =>
                        handleDetailChange("subject", e.target.value)
                      }
                      placeholder="Enter subject"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Topic
                    </label>
                    <InputField
                      value={editableQuiz.userProvidedTopic || ""}
                      onChange={(e) =>
                        handleDetailChange("userProvidedTopic", e.target.value)
                      }
                      placeholder="Enter topic"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <h3 className="text-2xl font-bold text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {editableQuiz.quizTitle || "Untitled Quiz"}
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">Code:</span>
                    <span className="font-mono text-purple-400 bg-purple-400/10 px-2 py-1 rounded">
                      {editableQuiz.quizCode || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">Subject:</span>
                    <span className="text-white">
                      {editableQuiz.subject || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">Topic:</span>
                    <span className="text-white">
                      {editableQuiz.userProvidedTopic || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Questions Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <FaGraduationCap className="text-purple-400" size={20} />
              <h2 className="text-xl font-semibold text-white">
                Questions ({editableQuiz.questions?.length || 0})
              </h2>
            </div>

            {editableQuiz.questions?.map((question, index) => (
              <div
                key={question.id}
                className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6"
              >
                {/* Question Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-purple-600 rounded-full text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <span className="text-sm text-gray-400">
                        Question {index + 1}
                      </span>
                      <div className="flex items-center space-x-2 mt-1">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(
                            question.difficulty
                          )}`}
                        >
                          {question.difficulty || "Medium"}
                        </span>
                        {question.topic && (
                          <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded-full">
                            {question.topic}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    {editingQuestionId === question.id ? (
                      <>
                        <EditButton
                          onClick={() => setEditingQuestionId(null)}
                          isEditing={true}
                          size="sm"
                        />
                        <CancelButton onClick={handleCancelEdit} size="sm" />
                      </>
                    ) : (
                      <EditButton
                        onClick={() => setEditingQuestionId(question.id)}
                        isEditing={false}
                        size="sm"
                      />
                    )}
                  </div>
                </div>

                {/* Question Content */}
                <div className="space-y-4">
                  {/* Question Text */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Question
                    </label>
                    {editingQuestionId === question.id ? (
                      <InputField
                        value={question.questionText || ""}
                        onChange={(e) =>
                          handleQuestionChange(question.id, {
                            questionText: e.target.value,
                          })
                        }
                        placeholder="Enter question text"
                        multiline={true}
                        rows={2}
                      />
                    ) : (
                      <p className="text-white bg-gray-700/30 p-3 rounded-lg border border-gray-600/30">
                        {question.questionText || "No question text"}
                      </p>
                    )}
                  </div>

                  {/* Options */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Answer Options
                    </label>
                    <div className="space-y-2">
                      {question.options?.map((option, optIndex) => (
                        <div
                          key={option.id}
                          className="flex items-center space-x-3"
                        >
                          <div className="flex items-center justify-center w-6 h-6 bg-gray-700 rounded-full text-white text-xs font-bold">
                            {String.fromCharCode(65 + optIndex)}
                          </div>

                          {editingQuestionId === question.id ? (
                            <>
                              <input
                                type="radio"
                                name={`correct_${question.id}`}
                                checked={option.id === question.correctAnswerId}
                                onChange={() =>
                                  handleQuestionChange(question.id, {
                                    correctAnswerId: option.id,
                                  })
                                }
                                className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 focus:ring-purple-500"
                              />
                              <InputField
                                value={option.text || ""}
                                onChange={(e) =>
                                  handleOptionChange(
                                    question.id,
                                    option.id,
                                    e.target.value
                                  )
                                }
                                placeholder={`Option ${String.fromCharCode(
                                  65 + optIndex
                                )}`}
                                className="flex-1"
                              />
                            </>
                          ) : (
                            <div
                              className={`flex-1 p-3 rounded-lg border ${
                                option.id === question.correctAnswerId
                                  ? "bg-green-400/10 border-green-400/50 text-green-400"
                                  : "bg-gray-700/30 border-gray-600/30 text-white"
                              }`}
                            >
                              {option.text || "No option text"}
                              {option.id === question.correctAnswerId && (
                                <span className="ml-2 text-xs bg-green-400/20 text-green-400 px-2 py-1 rounded-full">
                                  Correct
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Additional Question Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Difficulty
                      </label>
                      {editingQuestionId === question.id ? (
                        <select
                          value={question.difficulty || "Medium"}
                          onChange={(e) =>
                            handleQuestionChange(question.id, {
                              difficulty: e.target.value,
                            })
                          }
                          className="w-full p-3 rounded-lg bg-gray-800/80 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      ) : (
                        <div
                          className={`p-3 rounded-lg ${getDifficultyColor(
                            question.difficulty
                          )}`}
                        >
                          {question.difficulty || "Medium"}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Topic
                      </label>
                      {editingQuestionId === question.id ? (
                        <InputField
                          value={question.topic || ""}
                          onChange={(e) =>
                            handleQuestionChange(question.id, {
                              topic: e.target.value,
                            })
                          }
                          placeholder="Enter topic"
                        />
                      ) : (
                        <div className="p-3 rounded-lg bg-gray-700/30 border border-gray-600/30 text-white">
                          {question.topic || "No topic specified"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Explanation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Explanation
                    </label>
                    {editingQuestionId === question.id ? (
                      <InputField
                        value={question.explanation || ""}
                        onChange={(e) =>
                          handleQuestionChange(question.id, {
                            explanation: e.target.value,
                          })
                        }
                        placeholder="Enter explanation for the correct answer"
                        multiline={true}
                        rows={2}
                      />
                    ) : (
                      <div className="p-3 rounded-lg bg-gray-700/30 border border-gray-600/30 text-gray-300">
                        {question.explanation || "No explanation provided"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700/50 p-6 bg-gray-800/30">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              {editableQuiz.questions?.length || 0} question(s) total
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleCancelEdit}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all duration-200 flex items-center space-x-2"
              >
                <FaBan size={16} />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSaveQuiz}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-lg"
              >
                <FaSave size={16} />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPreviewModal;
