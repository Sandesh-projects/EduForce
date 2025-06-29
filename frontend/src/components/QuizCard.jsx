import React from "react";
import { FaEdit, FaTrash, FaShareAlt } from "react-icons/fa"; // Icons for actions

/**
 * QuizCard component displays quiz details and action buttons for teachers.
 *
 * @param {object} props - Component props.
 * @param {object} props.quiz - Quiz data object.
 * @param {function} props.onDelete - Function to call when delete button is clicked.
 * @param {function} props.onEdit - Function to call when edit button is clicked.
 * @param {function} props.onPublish - Function to call when publish button is clicked.
 */
const QuizCard = ({ quiz, onDelete, onEdit, onPublish }) => {
  // Format the creation date
  const createdAt = quiz.createdAt
    ? new Date(quiz.createdAt).toLocaleDateString()
    : "N/A";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col justify-between">
      {/* Quiz Details */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {quiz.quizTitle}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          <span className="font-medium">Quiz Code:</span> {quiz.quizCode}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          <span className="font-medium">Questions:</span>{" "}
          {quiz.questions ? quiz.questions.length : 0}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          <span className="font-medium">Subject:</span> {quiz.subject}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          <span className="font-medium">Topic:</span> {quiz.userProvidedTopic}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          <span className="font-medium">Created:</span> {createdAt}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2">
        <button
          onClick={onEdit}
          className="py-1 px-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200 flex items-center text-sm"
          title="Edit Quiz"
        >
          <FaEdit className="mr-1" /> Edit
        </button>
        <button
          onClick={onPublish}
          className="py-1 px-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition duration-200 flex items-center text-sm"
          title="Publish Quiz"
        >
          <FaShareAlt className="mr-1" /> Publish
        </button>
        <button
          onClick={onDelete}
          className="py-1 px-3 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-200 flex items-center text-sm"
          title="Delete Quiz"
        >
          <FaTrash className="mr-1" /> Delete
        </button>
      </div>
    </div>
  );
};

export default QuizCard;
