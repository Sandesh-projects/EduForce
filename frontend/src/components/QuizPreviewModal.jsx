import React, { useState, useEffect } from "react";
import { FaTimes, FaEdit, FaSave, FaBan } from "react-icons/fa"; // Icons for actions

/**
 * QuizPreviewModal component displays a quiz for preview and allows editing.
 *
 * @param {object} props - Component props.
 * @param {object} props.quiz - The quiz object to display and edit.
 * @param {function} props.onClose - Function to call when the modal is closed.
 * @param {function} props.onSave - Function to call when changes are saved.
 */
const QuizPreviewModal = ({ quiz, onClose, onSave }) => {
  // State for the quiz data that can be edited within the modal
  const [editableQuiz, setEditableQuiz] = useState(null);
  // Tracks which question is currently in editing mode
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  // Tracks if quiz title/subject/topic are being edited
  const [isEditingQuizDetails, setIsEditingQuizDetails] = useState(false);

  // Initialize `editableQuiz` when the `quiz` prop changes
  useEffect(() => {
    if (quiz) {
      setEditableQuiz({ ...quiz });
    }
  }, [quiz]);

  // Don't render if quiz data isn't loaded yet
  if (!editableQuiz) return null;

  // Handles changes to quiz details (title, subject, topic)
  const handleDetailChange = (e) => {
    const { name, value } = e.target;
    setEditableQuiz((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handles changes to a question's text
  const handleQuestionTextChange = (questionId, newText) => {
    setEditableQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === questionId ? { ...q, questionText: newText } : q
      ),
    }));
  };

  // Handles changes to an option's text for a specific question
  const handleOptionTextChange = (questionId, optionId, newText) => {
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

  // Handles changing the correct answer for a question
  const handleCorrectAnswerChange = (questionId, newCorrectAnswerId) => {
    setEditableQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === questionId ? { ...q, correctAnswerId: newCorrectAnswerId } : q
      ),
    }));
  };

  // Handles changes to other question fields like explanation, difficulty, topic
  const handleQuestionFieldChange = (questionId, fieldName, value) => {
    setEditableQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === questionId ? { ...q, [fieldName]: value } : q
      ),
    }));
  };

  // Saves all current edits and calls the `onSave` prop
  const handleSaveQuiz = () => {
    if (onSave) {
      onSave(editableQuiz); // Pass the edited quiz object to the parent
    }
    setEditingQuestionId(null); // Exit question editing mode
    setIsEditingQuizDetails(false); // Exit quiz details editing mode
  };

  // Cancels all edits and reverts to the original quiz data
  const handleCancelEdit = () => {
    setEditableQuiz({ ...quiz }); // Revert to original quiz prop
    setEditingQuestionId(null); // Exit question editing mode
    setIsEditingQuizDetails(false); // Exit quiz details editing mode
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center p-4 z-50">
      <div className="bg-gradient-to-br from-gray-900 to-purple-950 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative p-8 border border-purple-700/50">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-200"
          title="Close"
        >
          <FaTimes size={24} />
        </button>

        {/* Quiz Details (Title, Code, Subject, Topic) with Edit/Save/Cancel */}
        <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
          {isEditingQuizDetails ? (
            // Input fields when editing quiz details
            <div className="w-full space-y-3">
              <input
                type="text"
                name="quizTitle"
                value={editableQuiz.quizTitle}
                onChange={handleDetailChange}
                className="text-3xl font-bold w-full p-3 rounded-lg bg-gray-800 border border-purple-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="text"
                name="subject"
                value={editableQuiz.subject}
                onChange={handleDetailChange}
                className="text-gray-300 w-full p-2 rounded-lg bg-gray-800 border border-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Subject"
              />
              <input
                type="text"
                name="userProvidedTopic"
                value={editableQuiz.userProvidedTopic}
                onChange={handleDetailChange}
                className="text-gray-300 w-full p-2 rounded-lg bg-gray-800 border border-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Topic"
              />
            </div>
          ) : (
            // Display quiz details when not editing
            <div>
              <h2 className="text-4xl font-extrabold text-white mb-2 bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                {editableQuiz.quizTitle}
              </h2>
              <p className="text-gray-400 mb-1">
                <span className="font-semibold">Quiz Code:</span>{" "}
                <span className="font-mono text-purple-400">
                  {editableQuiz.quizCode}
                </span>
              </p>
              <p className="text-gray-400 mb-1">
                <span className="font-semibold">Subject:</span>{" "}
                {editableQuiz.subject}
              </p>
              <p className="text-gray-400 mb-4">
                <span className="font-semibold">Topic:</span>{" "}
                {editableQuiz.userProvidedTopic}
              </p>
            </div>
          )}
          {/* Edit/Save/Cancel buttons for quiz details */}
          {isEditingQuizDetails ? (
            <div className="flex space-x-3 ml-6">
              <button
                onClick={() => setIsEditingQuizDetails(false)}
                className="p-3 rounded-full bg-green-700 text-white hover:bg-green-600 transition duration-200 shadow-md"
                title="Done Editing Details"
              >
                <FaSave size={20} />
              </button>
              <button
                onClick={handleCancelEdit}
                className="p-3 rounded-full bg-red-700 text-white hover:bg-red-600 transition duration-200 shadow-md"
                title="Cancel Details Edit"
              >
                <FaBan size={20} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingQuizDetails(true)}
              className="p-3 rounded-full bg-blue-700 text-white hover:bg-blue-600 transition duration-200 shadow-md ml-6"
              title="Edit Quiz Details"
            >
              <FaEdit size={20} />
            </button>
          )}
        </div>

        {/* Questions Section */}
        <h3 className="text-3xl font-bold text-white mb-5 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Questions:
        </h3>
        {editableQuiz.questions.map((q, qIndex) => (
          <div
            key={q.id}
            className="mb-8 p-6 rounded-xl border border-gray-700 bg-gray-800/60 shadow-lg"
          >
            <div className="flex justify-between items-start mb-4">
              {/* Question Text - Editable or Display */}
              {editingQuestionId === q.id ? (
                <textarea
                  className="text-lg font-medium w-full p-3 rounded-lg bg-gray-700 border border-purple-600 text-white placeholder-gray-400 resize-y min-h-[80px] focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={q.questionText}
                  onChange={(e) =>
                    handleQuestionTextChange(q.id, e.target.value)
                  }
                  rows="3"
                />
              ) : (
                <p className="text-lg font-medium text-white">
                  <span className="text-purple-400 font-bold">
                    {qIndex + 1}.
                  </span>{" "}
                  {q.questionText}
                </p>
              )}
              {/* Edit/Save/Cancel buttons for individual questions */}
              {editingQuestionId === q.id ? (
                <div className="flex space-x-2 ml-6 shrink-0">
                  <button
                    onClick={() => setEditingQuestionId(null)}
                    className="p-2 rounded-full bg-green-700 text-white hover:bg-green-600 transition duration-200 shadow-sm"
                    title="Done Editing Question"
                  >
                    <FaSave size={18} />
                  </button>
                  <button
                    onClick={handleCancelEdit} // This cancels all edits in the modal
                    className="p-2 rounded-full bg-red-700 text-white hover:bg-red-600 transition duration-200 shadow-sm"
                    title="Cancel Question Edit"
                  >
                    <FaBan size={18} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingQuestionId(q.id)}
                  className="p-2 rounded-full bg-blue-700 text-white hover:bg-blue-600 transition duration-200 shadow-sm ml-6 shrink-0"
                  title="Edit Question"
                >
                  <FaEdit size={18} />
                </button>
              )}
            </div>

            {/* Options List */}
            <ul className="space-y-3 mt-4 ml-6">
              {q.options.map((option) => (
                <li key={option.id} className="flex items-center">
                  {editingQuestionId === q.id ? (
                    // Editable options with radio button for correct answer
                    <>
                      <input
                        type="radio"
                        name={`correct_answer_${q.id}`}
                        value={option.id}
                        checked={option.id === q.correctAnswerId}
                        onChange={() =>
                          handleCorrectAnswerChange(q.id, option.id)
                        }
                        className="mr-3 form-radio h-5 w-5 text-purple-500 border-gray-600 focus:ring-purple-500 bg-gray-700"
                      />
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) =>
                          handleOptionTextChange(
                            q.id,
                            option.id,
                            e.target.value
                          )
                        }
                        className="flex-grow p-2 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </>
                  ) : (
                    // Display options, highlight correct answer
                    <span
                      className={`text-lg ${
                        option.id === q.correctAnswerId
                          ? "text-green-400 font-semibold"
                          : "text-gray-300"
                      }`}
                    >
                      {option.text}
                    </span>
                  )}
                </li>
              ))}
            </ul>

            {/* Explanation, Difficulty, Topic */}
            <div className="mt-5 text-sm space-y-2">
              <div className="flex items-center">
                <span className="font-semibold text-gray-400">
                  Correct Answer:
                </span>{" "}
                <span className="ml-2 text-green-400">
                  {q.options.find((opt) => opt.id === q.correctAnswerId)?.text}
                </span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center">
                <span className="font-semibold text-gray-400 md:w-28 shrink-0">
                  Explanation:
                </span>{" "}
                {editingQuestionId === q.id ? (
                  <textarea
                    className="flex-grow p-2 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 resize-y min-h-[60px] ml-0 md:ml-2 mt-2 md:mt-0 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={q.explanation}
                    onChange={(e) =>
                      handleQuestionFieldChange(
                        q.id,
                        "explanation",
                        e.target.value
                      )
                    }
                    rows="2"
                  />
                ) : (
                  <span className="ml-0 md:ml-2 text-gray-300 mt-2 md:mt-0">
                    {q.explanation}
                  </span>
                )}
              </div>
              <div className="flex flex-col md:flex-row md:items-center">
                <span className="font-semibold text-gray-400 md:w-28 shrink-0">
                  Difficulty:
                </span>{" "}
                {editingQuestionId === q.id ? (
                  <select
                    value={q.difficulty}
                    onChange={(e) =>
                      handleQuestionFieldChange(
                        q.id,
                        "difficulty",
                        e.target.value
                      )
                    }
                    className="p-2 rounded-lg bg-gray-700 border border-gray-600 text-white ml-0 md:ml-2 mt-2 md:mt-0 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                ) : (
                  <span className="ml-0 md:ml-2 text-gray-300 mt-2 md:mt-0">
                    {q.difficulty}
                  </span>
                )}
                <span className="mx-2 hidden md:inline text-gray-400">|</span>
                <span className="font-semibold text-gray-400 md:w-16 shrink-0 mt-2 md:mt-0">
                  Topic:
                </span>{" "}
                {editingQuestionId === q.id ? (
                  <input
                    type="text"
                    value={q.topic}
                    onChange={(e) =>
                      handleQuestionFieldChange(q.id, "topic", e.target.value)
                    }
                    className="flex-grow p-2 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 ml-0 md:ml-2 mt-2 md:mt-0 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                ) : (
                  <span className="ml-0 md:ml-2 text-gray-300 mt-2 md:mt-0">
                    {q.topic}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Global Save/Cancel Buttons */}
        <div className="flex justify-end mt-8 space-x-4">
          <button
            onClick={handleSaveQuiz}
            className="py-3 px-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg flex items-center justify-center space-x-2 transform hover:scale-105"
            title="Save all changes"
          >
            <FaSave /> <span>Save All Changes</span>
          </button>
          <button
            onClick={handleCancelEdit}
            className="py-3 px-8 bg-gray-700 border border-gray-600 text-gray-200 rounded-full font-semibold hover:bg-gray-600 transition-all duration-300 shadow-lg flex items-center justify-center space-x-2 transform hover:scale-105"
            title="Cancel all changes and close"
          >
            <FaBan /> <span>Cancel</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizPreviewModal;
