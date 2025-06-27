// backend/src/routes/quiz.routes.js
import express from 'express';
import {
    createQuizFromPdfContent,
    retrieveTeacherQuizzes,
    getQuizDetailsById,
    removeQuizById,
    updateExistingQuiz,
    publishOrUnpublishQuiz,
    getAvailablePublishedQuizzes,
    getQuizForStudentByCode,
    submitStudentQuizAttempt,
    getStudentQuizAttempts, // THIS IS THE KEY CONTROLLER FUNCTION FOR STUDENT INVENTORY
    getStudentIndividualQuizReport,
    getQuizAttemptsOverviewForTeacher,
    getStudentsForQuizAttempts,
    getTeacherSpecificStudentAttemptReport,
    checkStudentQuizStatus,
} from '../controllers/quiz.controller.js';
// IMPORT THE NEW MIDDLEWARE FUNCTION 'allowAuthenticated'
import { authenticateUser, restrictToRoles, allowAuthenticated } from '../middleware/auth.middleware.js';

// --- !!! IMPORTANT VERIFICATION LOG !!! ---
// WHEN YOUR BACKEND SERVER STARTS, YOU *MUST* SEE THIS EXACT MESSAGE IN ITS TERMINAL.
// If you don't, your server is NOT loading this file.
console.log("Loading quiz.routes.js (Version Check: 2025-06-27 FINAL FINAL - Using allowAuthenticated)");

const router = express.Router();

// Teacher Routes
router.post('/generate', authenticateUser, restrictToRoles(['teacher']), createQuizFromPdfContent);
router.get('/teacher', authenticateUser, restrictToRoles(['teacher']), retrieveTeacherQuizzes);
router.get('/:id', authenticateUser, restrictToRoles(['teacher', 'student']), getQuizDetailsById); // Accessible by both teacher and student (if published)
router.put('/:id', authenticateUser, restrictToRoles(['teacher']), updateExistingQuiz);
router.delete('/:id', authenticateUser, restrictToRoles(['teacher']), removeQuizById);
router.patch('/:id/publish', authenticateUser, restrictToRoles(['teacher']), publishOrUnpublishQuiz);

// Teacher's Quiz Report Routes
router.get('/:quizId/attempts', authenticateUser, restrictToRoles(['teacher']), getQuizAttemptsOverviewForTeacher);
router.get('/teacher/attempts/:attemptId', authenticateUser, restrictToRoles(['teacher']), getTeacherSpecificStudentAttemptReport);

// Student Routes
router.get('/student/published', authenticateUser, restrictToRoles(['student']), getAvailablePublishedQuizzes);
router.get('/student/take/:quizCode', authenticateUser, restrictToRoles(['student']), getQuizForStudentByCode);
router.get('/student/check-attempt/:quizCode', authenticateUser, restrictToRoles(['student']), checkStudentQuizStatus);
router.post('/student/submit', authenticateUser, restrictToRoles(['student']), submitStudentQuizAttempt);

// *******************************************************************
// THIS IS THE CRITICAL ROUTE FOR THE STUDENT INVENTORY PAGE.
// It now uses the new 'allowAuthenticated' middleware, which does not check roles.
router.get('/student/attempts', allowAuthenticated, getStudentQuizAttempts);
// *******************************************************************

// Student's Own Detailed Quiz Attempt Report Page - also uses allowAuthenticated
router.get('/student/attempts/:attemptId', allowAuthenticated, getStudentIndividualQuizReport);

export default router;