// backend/src/routes/quiz.routes.js
// This file now ONLY contains routes for teacher-specific quiz operations.
import express from 'express';
import {
    createQuizFromPdfContent,
    retrieveTeacherQuizzes,
    getQuizDetailsById,
    removeQuizById,
    updateExistingQuiz,
    publishOrUnpublishQuiz,
    getQuizAttemptsOverviewForTeacher,
    getStudentsForQuizAttempts, // Kept this one here as it's typically for teacher reports
    getTeacherSpecificStudentAttemptReport,
} from '../controllers/quiz.controller.js';
import { authenticateUser, restrictToRoles } from '../middleware/auth.middleware.js';

// --- !!! IMPORTANT VERIFICATION LOG !!! ---
// WHEN YOUR BACKEND SERVER STARTS, YOU *MUST* SEE THIS EXACT MESSAGE IN ITS TERMINAL.
console.log("Loading quiz.routes.js (Version Check: 2025-06-27 Refactor - Teacher Only Routes)");

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
router.get('/:quizId/students-attempts-overview', authenticateUser, restrictToRoles(['teacher']), getStudentsForQuizAttempts); // Explicitly a teacher report route

export default router;
