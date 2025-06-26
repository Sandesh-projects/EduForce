// backend/src/routes/quiz.routes.js
import express from 'express';
// Correct the import name from 'createQuiz' to 'generateQuizFromPdf'
import {
    generateQuizFromPdf, // <--- Corrected name here
    getTeacherQuizzes,
    getQuizById,
    deleteQuizById, // Ensure this matches the exported name in controller
    updateQuiz,
} from '../controllers/quiz.controller.js';
// Ensure both protect and authorize are imported
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Route for generating/creating a quiz
router.post('/generate', protect, authorize(['teacher']), generateQuizFromPdf); // <--- Use corrected name here

// Route for fetching all quizzes for the teacher
router.get('/teacher', protect, authorize(['teacher']), getTeacherQuizzes); // Using /teacher for clarity

// Route for fetching a single quiz by ID (for review/edit)
router.get('/:id', protect, authorize(['teacher']), getQuizById); // Only teacher should get full quiz data

// Route for deleting a quiz by ID
router.delete('/:id', protect, authorize(['teacher']), deleteQuizById); // Make sure name matches export

// Route for updating a quiz by ID
router.put('/:id', protect, authorize(['teacher']), updateQuiz);

export default router;