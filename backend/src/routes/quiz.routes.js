// Routes for teacher-specific quiz operations
import express from 'express';
import {
    createQuizFromPdfContent,
    retrieveTeacherQuizzes,
    getQuizDetailsById,
    removeQuizById,
    updateExistingQuiz,
    publishOrUnpublishQuiz,
    getQuizAttemptsOverviewForTeacher,
    getStudentsForQuizAttempts,
    getTeacherSpecificStudentAttemptReport,
} from '../controllers/quiz.controller.js';
import { authenticateUser, restrictToRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

// Teacher quiz routes
router.post('/generate', authenticateUser, restrictToRoles(['teacher']), createQuizFromPdfContent);
router.get('/teacher', authenticateUser, restrictToRoles(['teacher']), retrieveTeacherQuizzes);
router.get('/:id', authenticateUser, restrictToRoles(['teacher', 'student']), getQuizDetailsById);
router.put('/:id', authenticateUser, restrictToRoles(['teacher']), updateExistingQuiz);
router.delete('/:id', authenticateUser, restrictToRoles(['teacher']), removeQuizById);
router.patch('/:id/publish', authenticateUser, restrictToRoles(['teacher']), publishOrUnpublishQuiz);

// Teacher quiz report routes
router.get('/:quizId/attempts', authenticateUser, restrictToRoles(['teacher']), getQuizAttemptsOverviewForTeacher);
router.get('/teacher/attempts/:attemptId', authenticateUser, restrictToRoles(['teacher']), getTeacherSpecificStudentAttemptReport);
router.get('/:quizId/students-attempts-overview', authenticateUser, restrictToRoles(['teacher']), getStudentsForQuizAttempts);

export default router;