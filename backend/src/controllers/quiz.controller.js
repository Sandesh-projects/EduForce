// backend/src/controllers/quiz.controller.js
import Quiz from '../models/quiz.model.js';
import { parsePdfAndGenerateMcqs } from '../services/pdfParse.js';
import randomstring from 'randomstring';
import asyncHandler from 'express-async-handler'; // Import express-async-handler

/**
 * Helper function to generate a unique quiz code
 */
const generateUniqueQuizCode = async () => {
    let code;
    let isUnique = false;
    while (!isUnique) {
        code = randomstring.generate({
            length: 8,
            charset: 'alphanumeric',
            capitalization: 'uppercase',
        });
        const existingQuiz = await Quiz.findOne({ quizCode: code });
        if (!existingQuiz) {
            isUnique = true;
        }
    }
    return code;
};


/**
 * @function generateQuizFromPdf
 * @description Generates MCQs from a PDF and saves the quiz to the database.
 * Route: POST /api/quizzes/generate
 * Access: Private (Teacher only, via protect middleware)
 */
export const generateQuizFromPdf = asyncHandler(async (req, res) => {
    const { pdfBase64, numQuestions, subject, userProvidedTopic } = req.body;
    const teacherId = req.user._id;

    if (!pdfBase64 || !subject || !userProvidedTopic) {
        res.status(400);
        throw new Error('PDF content (Base64), Subject, and Topic are required.');
    }

    try {
        const quizCode = await generateUniqueQuizCode();
        const mcqsData = await parsePdfAndGenerateMcqs(pdfBase64, numQuestions, subject, userProvidedTopic);

        if (!mcqsData || !mcqsData.questions || mcqsData.questions.length === 0) {
            res.status(500);
            throw new Error('Gemini did not generate any valid questions. Please try with different content.');
        }

        const newQuiz = await Quiz.create({
            teacher: teacherId,
            quizTitle: mcqsData.quizTitle || `${subject} Quiz`,
            subject: subject,
            userProvidedTopic: userProvidedTopic,
            quizCode: quizCode,
            quizInstructions: mcqsData.quizInstructions || 'Answer carefully based on the provided text.',
            questions: mcqsData.questions,
        });

        res.status(201).json({
            message: 'Quiz generated and saved successfully!',
            quiz: newQuiz,
        });
    } catch (error) {
        console.error('Error generating and saving quiz:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: error.message || 'Failed to generate and save quiz.' });
        }
    }
});

/**
 * @function getTeacherQuizzes
 * @description Fetches all quizzes created by the authenticated teacher.
 * Route: GET /api/quizzes/teacher
 * Access: Private (Teacher only)
 */
export const getTeacherQuizzes = asyncHandler(async (req, res) => {
    const teacherId = req.user._id;

    try {
        const quizzes = await Quiz.find({ teacher: teacherId }).sort({ createdAt: -1 });
        res.status(200).json(quizzes);
    } catch (error) {
        console.error('Error fetching teacher quizzes:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Failed to retrieve quizzes.' });
        }
    }
});

/**
 * @function getQuizById
 * @description Fetches a single quiz by its ID.
 * Route: GET /api/quizzes/:id
 * Access: Private (accessible if the quiz belongs to the teacher, or potentially public for students taking it, based on future logic)
 */
export const getQuizById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    try {
        const quiz = await Quiz.findById(id);

        if (!quiz) {
            res.status(404);
            throw new Error('Quiz not found.');
        }

        if (quiz.teacher.toString() !== userId.toString()) {
            res.status(403);
            throw new Error('Not authorized to access this quiz.');
        }

        res.status(200).json(quiz);
    } catch (error) {
        console.error('Error fetching quiz by ID:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Failed to retrieve quiz.' });
        }
    }
});

/**
 * @function deleteQuizById
 * @description Deletes a quiz by its ID.
 * Route: DELETE /api/quizzes/:id
 * Access: Private (Teacher only)
 */
export const deleteQuizById = asyncHandler(async (req, res) => {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found.');
    }

    if (quiz.teacher.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to delete this quiz.');
    }

    await quiz.deleteOne();
    res.status(200).json({ message: 'Quiz removed successfully!' });
});
/**
 * @function updateQuiz
 * @description Updates an existing quiz.
 * Route: PUT /api/quizzes/:id
 * Access: Private (Teacher only)
 */
export const updateQuiz = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updatedQuizData = req.body;
  const userId = req.user._id;

  if (!updatedQuizData || !updatedQuizData.questions || !Array.isArray(updatedQuizData.questions)) {
      res.status(400);
      throw new Error('Invalid quiz data provided. Questions array is missing or malformed.');
  }

  try {
      const quiz = await Quiz.findById(id);

      if (!quiz) {
          res.status(404);
          throw new Error('Quiz not found.');
      }

      if (quiz.teacher.toString() !== userId.toString()) {
          res.status(403);
          throw new Error('Not authorized to update this quiz.');
      }

      // Update fields directly
      quiz.quizTitle = updatedQuizData.quizTitle || quiz.quizTitle;
      quiz.subject = updatedQuizData.subject || quiz.subject;
      quiz.userProvidedTopic = updatedQuizData.userProvidedTopic || quiz.userProvidedTopic;
      quiz.quizInstructions = updatedQuizData.quizInstructions || quiz.quizInstructions;
      quiz.questions = updatedQuizData.questions; // Replace the questions array entirely

      // IMPORTANT: Mark 'questions' array as modified if you're replacing it directly
      // Mongoose sometimes doesn't detect changes to nested arrays unless explicitly told.
      quiz.markModified('questions');

      await quiz.save(); // Save the updated document

      res.status(200).json({ message: 'Quiz updated successfully', quiz });
  } catch (error) {
      console.error('Error updating quiz:', error);
      if (!res.headersSent) {
          res.status(500).json({ message: error.message || 'Failed to update quiz.' });
      }
  }
});