// backend/src/routes/quiz.routes.js
import express from 'express';
import { generateQuizFromPdf, getTeacherQuizzes, getQuizById } from '../controllers/quiz.controller.js';
import { protect } from '../middleware/auth.middleware.js'; // Import protect middleware

const router = express.Router();

// All quiz routes should ideally be protected
router.post('/generate', protect, generateQuizFromPdf); // Protect this route: only authenticated users can generate
router.get('/my-quizzes', protect, getTeacherQuizzes); // Get quizzes for the logged-in teacher
router.get('/:id', protect, getQuizById); // Get a specific quiz by ID

// You might add routes for updating and deleting quizzes too
// router.put('/:id', protect, updateQuiz);
// router.delete('/:id', protect, deleteQuiz);

export default router;