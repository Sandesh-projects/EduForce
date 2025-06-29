import React, {
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import axios from "../axios"; // Axios for API calls
import { useAuth } from "../context/AuthContext"; // Auth context for user info
import { toast } from "react-toastify"; // For notifications
import { ClipboardList, Edit, Trash2, Loader, PlusCircle } from "lucide-react"; // Icons
import QuizPreviewModal from "./QuizPreviewModal"; // Modal for quiz preview/edit

const TeacherQuizzes = forwardRef(({ onGenerateQuizClick }, ref) => {
  const { user, isLoggedIn } = useAuth();
  const [teacherQuizzes, setTeacherQuizzes] = useState([]);
  const [quizzesLoading, setQuizzesLoading] = useState(true);
  const [quizzesError, setQuizzesError] = useState("");
  const [selectedQuiz, setSelectedQuiz] = useState(null); // Quiz for modal

  // Fetches quizzes for the logged-in teacher
  const fetchTeacherQuizzes = async () => {
    if (!isLoggedIn || !user) {
      setQuizzesLoading(false);
      return;
    }
    setQuizzesLoading(true);
    setQuizzesError("");
    try {
      const response = await axios.get("/api/quizzes/teacher");
      setTeacherQuizzes(response.data);
    } catch (error) {
      console.error("Error fetching teacher quizzes:", error);
      setQuizzesError("Failed to load your quizzes. Please try again.");
      toast.error("Failed to load your quizzes.");
    } finally {
      setQuizzesLoading(false);
    }
  };

  // Expose fetch function to parent component via ref
  useImperativeHandle(ref, () => ({
    fetchQuizzes: fetchTeacherQuizzes,
  }));

  // Fetch quizzes on component mount or auth status change
  useEffect(() => {
    fetchTeacherQuizzes();
  }, [isLoggedIn, user]);

  // Sets selected quiz to open preview modal
  const handleEditQuiz = (quiz) => {
    setSelectedQuiz(quiz);
  };

  // Handles quiz publishing (placeholder for now)
  const handlePublishQuiz = async (quiz) => {
    toast.info(`Publishing quiz: ${quiz.quizTitle} - ${quiz.quizCode}`);
    // Add actual publish logic here
  };

  // Handles quiz deletion
  const handleDeleteQuiz = async (quizId) => {
    if (window.confirm("Are you sure you want to delete this quiz?")) {
      try {
        await axios.delete(`/api/quizzes/${quizId}`);
        setTeacherQuizzes((prevQuizzes) =>
          prevQuizzes.filter((q) => q._id !== quizId)
        );
        toast.success("Quiz deleted successfully!");
      } catch (error) {
        console.error("Error deleting quiz:", error);
        toast.error(error.response?.data?.message || "Failed to delete quiz.");
      }
    }
  };

  // Closes preview modal and refreshes quiz list
  const handleClosePreviewModal = () => {
    setSelectedQuiz(null);
    fetchTeacherQuizzes(); // Refresh list to reflect potential edits
  };

  return (
    <section className="mb-16">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white">Your Quizzes</h2>
        {/* Button to create new quiz */}
        <button
          onClick={onGenerateQuizClick}
          className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-full flex items-center space-x-2 transition-colors"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Create New Quiz</span>
        </button>
      </div>
      <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl">
        {/* Loading, error, or quizzes display */}
        {quizzesLoading ? (
          <div className="flex justify-center items-center py-8 text-gray-400">
            <Loader className="w-6 h-6 animate-spin mr-3" />
            Loading quizzes...
          </div>
        ) : quizzesError ? (
          <p className="text-red-400 text-center py-8">{quizzesError}</p>
        ) : teacherQuizzes.length > 0 ? (
          <ul className="space-y-4">
            {teacherQuizzes.map((quiz) => (
              <li
                key={quiz._id}
                className="flex flex-col md:flex-row items-center justify-between bg-gray-900/50 p-4 rounded-xl border border-gray-700"
              >
                <div className="flex items-center space-x-4 mb-3 md:mb-0">
                  <ClipboardList className="w-6 h-6 text-pink-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {quiz.quizTitle}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Quiz Code:{" "}
                      <span className="font-bold text-purple-400">
                        {quiz.quizCode}
                      </span>
                    </p>
                    <p className="text-gray-400 text-sm">
                      {quiz.questions.length} questions | Subject:{" "}
                      {quiz.subject} | Topic: {quiz.userProvidedTopic} |
                      Created: {new Date(quiz.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  {/* Quiz action buttons */}
                  <button
                    onClick={() => handleEditQuiz(quiz)}
                    className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center space-x-1"
                  >
                    <Edit className="w-4 h-4" /> <span>View/Edit</span>
                  </button>
                  <button
                    onClick={() => handlePublishQuiz(quiz)}
                    className="bg-gradient-to-r from-teal-600 to-green-600 text-white px-4 py-2 rounded-full text-sm hover:from-teal-700 hover:to-green-700 transition-all duration-300"
                  >
                    Publish
                  </button>
                  <button
                    onClick={() => handleDeleteQuiz(quiz._id)}
                    className="text-red-400 hover:text-red-300 text-sm font-medium flex items-center space-x-1"
                  >
                    <Trash2 className="w-4 h-4" /> <span>Delete</span>
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

      {/* Quiz Preview/Edit Modal */}
      {selectedQuiz && (
        <QuizPreviewModal
          quiz={selectedQuiz}
          onClose={handleClosePreviewModal}
        />
      )}
    </section>
  );
});

export default TeacherQuizzes;
