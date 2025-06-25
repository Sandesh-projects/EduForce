// backend/src/controllers/quiz.controller.js
import Quiz from '../models/quiz.model.js'; // Import the Quiz model
import { parsePdfAndGenerateMcqs } from '../services/pdfParse.js'; // Import the service

/**
 * @function generateQuizFromPdf
 * @description Generates MCQs from a PDF and saves the quiz to the database.
 * Route: POST /api/quizzes/generate
 * Access: Private (Teacher only, via protect middleware)
 */
export const generateQuizFromPdf = async (req, res) => {
  const { pdfBase64, numQuestions } = req.body;
  const teacherId = req.user._id; // Get teacher ID from the authenticated user (populated by protect middleware)

  if (!pdfBase64) {
    return res.status(400).json({ message: 'PDF content (Base64) is required.' });
  }

  // Optional: Add more validation for numQuestions if needed beyond service-level validation

  try {
    // Call the service to parse PDF and generate MCQs using Gemini
    const mcqsData = await parsePdfAndGenerateMcqs(pdfBase64, numQuestions);

    if (!mcqsData || !mcqsData.questions || mcqsData.questions.length === 0) {
      return res.status(500).json({ message: 'Gemini did not generate any valid questions.' });
    }

    // Create a new Quiz document
    const newQuiz = await Quiz.create({
      teacher: teacherId,
      quizTitle: mcqsData.quizTitle || 'Generated Quiz', // Use title from Gemini, or default
      quizInstructions: mcqsData.quizInstructions || 'Answer all questions.',
      questions: mcqsData.questions,
    });

    res.status(201).json({
      message: 'Quiz generated and saved successfully!',
      quiz: newQuiz,
    });
  } catch (error) {
    console.error('Error generating and saving quiz:', error);
    res.status(500).json({ message: error.message || 'Failed to generate and save quiz.' });
  }
};

/**
 * @function getTeacherQuizzes
 * @description Fetches all quizzes created by the authenticated teacher.
 * Route: GET /api/quizzes/my-quizzes
 * Access: Private (Teacher only)
 */
export const getTeacherQuizzes = async (req, res) => {
  const teacherId = req.user._id; // Get teacher ID from authenticated user

  try {
    const quizzes = await Quiz.find({ teacher: teacherId }).sort({ createdAt: -1 }); // Sort by newest first
    res.status(200).json(quizzes);
  } catch (error) {
    console.error('Error fetching teacher quizzes:', error);
    res.status(500).json({ message: 'Failed to retrieve quizzes.' });
  }
};

/**
 * @function getQuizById
 * @description Fetches a single quiz by its ID.
 * Route: GET /api/quizzes/:id
 * Access: Private (accessible if the quiz belongs to the teacher, or potentially public for students taking it, based on future logic)
 */
export const getQuizById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id; // Current authenticated user

  try {
    const quiz = await Quiz.findById(id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }

    // Ensure only the owner (teacher) or authorized users can access
    // For now, let's assume only the teacher who created it can view it.
    // Future: Add logic for students enrolled in a course to access it.
    if (quiz.teacher.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this quiz.' });
    }

    res.status(200).json(quiz);
  } catch (error) {
    console.error('Error fetching quiz by ID:', error);
    res.status(500).json({ message: 'Failed to retrieve quiz.' });
  }
};

// You can add updateQuiz and deleteQuiz functions similarly
// export const updateQuiz = ...
// export const deleteQuiz = ...