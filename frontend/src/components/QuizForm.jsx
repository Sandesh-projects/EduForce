import React, { useState } from "react";
import axios from "../axios"; // Your configured Axios instance
import { toast } from "react-toastify"; // For user notifications

/**
 * QuizForm component allows teachers to upload a PDF and generate an AI quiz from it.
 *
 * @param {object} props - Component props.
 * @param {function} props.onQuizGenerated - Callback function after a quiz is successfully generated.
 */
const QuizForm = ({ onQuizGenerated }) => {
  const [pdfFile, setPdfFile] = useState(null);
  const [subject, setSubject] = useState("");
  const [userProvidedTopic, setUserProvidedTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [loading, setLoading] = useState(false); // Manages loading state during quiz generation

  // Handles PDF file selection
  const handleFileChange = (e) => {
    setPdfFile(e.target.files[0]);
  };

  // Handles quiz generation form submission
  const handleGenerateQuizSubmit = async (e) => {
    e.preventDefault();

    // Validate form fields
    if (!pdfFile || !subject || !userProvidedTopic) {
      toast.error("Please fill in all required fields and upload a PDF.");
      return;
    }

    setLoading(true); // Start loading
    const reader = new FileReader();

    // Once PDF is read as Base64, send to backend
    reader.onloadend = async () => {
      const base64Pdf = reader.result; // Base64 string of the PDF

      const payload = {
        base64Pdf,
        subject,
        userProvidedTopic,
        numQuestions: parseInt(numQuestions),
      };

      try {
        const response = await axios.post("/api/quizzes/generate", payload, {
          headers: { "Content-Type": "application/json" },
        });
        toast.success("Quiz generated successfully!");
        // Clear form fields
        setPdfFile(null);
        setSubject("");
        setUserProvidedTopic("");
        setNumQuestions(5);
        // Trigger callback to update parent component (e.g., refresh quiz list)
        if (onQuizGenerated) {
          onQuizGenerated(response.data);
        }
      } catch (error) {
        console.error("Error generating quiz:", error);
        toast.error(
          `Error generating quiz: ${
            error.response?.data?.message || error.message
          }`
        );
      } finally {
        setLoading(false); // End loading
      }
    };

    reader.readAsDataURL(pdfFile); // Read the selected PDF file as a Base64 data URL
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        Generate AI Quiz
      </h2>
      <form onSubmit={handleGenerateQuizSubmit} className="space-y-4">
        {/* PDF Upload Field */}
        <div>
          <label
            htmlFor="pdf-upload"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Upload PDF
          </label>
          <input
            type="file"
            id="pdf-upload"
            accept=".pdf"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 dark:file:bg-purple-700 dark:file:text-purple-100 dark:hover:file:bg-purple-600"
          />
          {pdfFile && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Selected: {pdfFile.name}
            </p>
          )}
        </div>

        {/* Subject Name Field */}
        <div>
          <label
            htmlFor="subject-name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Subject Name
          </label>
          <input
            type="text"
            id="subject-name"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="e.g., EHF"
            required
          />
        </div>

        {/* Topic Field */}
        <div>
          <label
            htmlFor="topic"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Topic
          </label>
          <input
            type="text"
            id="topic"
            value={userProvidedTopic}
            onChange={(e) => setUserProvidedTopic(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="e.g., Ethical Hacking"
            required
          />
        </div>

        {/* Number of Questions Field */}
        <div>
          <label
            htmlFor="num-questions"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Number of Questions (1-25)
          </label>
          <input
            type="number"
            id="num-questions"
            value={numQuestions}
            onChange={(e) => setNumQuestions(e.target.value)}
            min="1"
            max="25"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:focus:ring-offset-gray-800"
          disabled={loading} // Disable button while loading
        >
          {loading ? "Generating..." : "Generate Quiz"}
        </button>
      </form>
    </div>
  );
};

export default QuizForm;
