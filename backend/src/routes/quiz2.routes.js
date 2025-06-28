// backend/src/routes/quiz2.routes.js
// This file ONLY contains routes for student-specific quiz operations.
import express from 'express';
import {
    getAvailablePublishedQuizzes,
    getQuizForStudentByCode,
    submitStudentQuizAttempt,
    getStudentQuizAttempts,
    getStudentIndividualQuizReport,
    checkStudentQuizStatus,
} from '../controllers/quiz2.controller.js';
// Import the specific middlewares needed for student routes from the new middleware file
import { allowAuthenticated } from '../middleware/quiz2.middleware.js';

// --- !!! IMPORTANT VERIFICATION LOG !!! ---
// WHEN YOUR BACKEND SERVER STARTS, YOU *MUST* SEE THIS EXACT MESSAGE IN ITS TERMINAL.
console.log("Loading quiz2.routes.js (Version Check: 2025-06-27 Refactor - Student Only Routes)");

const router = express.Router();

// Student Routes
router.get('/published', allowAuthenticated, getAvailablePublishedQuizzes);
router.get('/take/:quizCode', allowAuthenticated, getQuizForStudentByCode);
router.get('/check-attempt/:quizCode', allowAuthenticated, checkStudentQuizStatus);
router.post('/submit', allowAuthenticated, submitStudentQuizAttempt);
// These are the critical routes that were causing issues, now using allowAuthenticated
router.get('/attempts', allowAuthenticated, getStudentQuizAttempts);
router.get('/attempts/:attemptId', allowAuthenticated, getStudentIndividualQuizReport);

export default router;
