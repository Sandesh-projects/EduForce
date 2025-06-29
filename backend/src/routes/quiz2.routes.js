// Routes for student-specific quiz operations
import express from 'express';
import {
    getAvailablePublishedQuizzes,
    getQuizForStudentByCode,
    submitStudentQuizAttempt,
    getStudentQuizAttempts,
    getStudentIndividualQuizReport,
    checkStudentQuizStatus,
} from '../controllers/quiz2.controller.js';
// Import the specific middleware needed for student routes
import { allowAuthenticated } from '../middleware/quiz2.middleware.js';

const router = express.Router();

// Student Routes
router.get('/published', allowAuthenticated, getAvailablePublishedQuizzes);
router.get('/take/:quizCode', allowAuthenticated, getQuizForStudentByCode);
router.get('/check-attempt/:quizCode', allowAuthenticated, checkStudentQuizStatus);
router.post('/submit', allowAuthenticated, submitStudentQuizAttempt);
router.get('/attempts', allowAuthenticated, getStudentQuizAttempts);
router.get('/attempts/:attemptId', allowAuthenticated, getStudentIndividualQuizReport);

export default router;