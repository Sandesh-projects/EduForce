// backend/src/controllers/quiz2.controller.js
// This file ONLY contains controller functions for student-specific quiz operations.
import Quiz from '../models/quiz.model.js';
import QuizAttempt from '../models/QuizAttempt.model.js';
import { generateQuizAttemptAnalysis } from '../services/gemini.services.student.submit.js';
import asyncHandler from 'express-async-handler';


/**
 * @function getAvailablePublishedQuizzes
 * @description Retrieves all quizzes that are currently published and available to students.
 * Route: GET /api/student/quizzes/published
 * Access: Private (Student only)
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const getAvailablePublishedQuizzes = asyncHandler(async (req, res) => {
    const quizzes = await Quiz.find({ published: true })
                               .select('quizTitle subject userProvidedTopic quizCode createdAt questions.length'); // Select questions.length for count
    res.json(quizzes);
});

/**
 * @function getQuizForStudentByCode
 * @description Retrieves a specific published quiz by its unique code for a student to take.
 * Also checks if the student has already attempted this quiz.
 * Route: GET /api/student/quizzes/take/:quizCode
 * Access: Private (Student only)
 * @param {object} req - Express request object (expects quiz code in params)
 * @param {object} res - Express response object
 */
export const getQuizForStudentByCode = asyncHandler(async (req, res) => {
    const quizCode = req.params.quizCode.toUpperCase();
    const studentId = req.user.id; // Get student ID from authenticated user

    console.log(`[quiz2.controller] Attempting to find quiz with code: ${quizCode} for student ${studentId}`);

    const quiz = await Quiz.findOne({ quizCode: quizCode, published: true })
                           .select('-teacher -createdAt -updatedAt -__v'); // Exclude teacher and timestamp fields

    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found or not currently published with this code.');
    }

    // Crucial: Check if the student has already completed this quiz.
    const existingAttempt = await QuizAttempt.findOne({ student: studentId, quiz: quiz._id });
    if (existingAttempt) {
        res.status(409); // Conflict: indicates resource state prevents the action
        throw new Error('You have already completed this quiz. Re-attempts are not permitted.');
    }

    // Prepare quiz data for student (exclude correct answers)
    const quizDataForStudent = {
        _id: quiz._id,
        quizTitle: quiz.quizTitle,
        quizInstructions: quiz.quizInstructions,
        subject: quiz.subject,
        userProvidedTopic: quiz.userProvidedTopic,
        quizCode: quiz.quizCode,
        questions: quiz.questions.map(q => ({
            id: q.id,
            questionText: q.questionText,
            options: q.options,
        })),
    };

    res.json(quizDataForStudent);
});

/**
 * @function checkStudentQuizStatus
 * @description Checks if a student has already attempted a specific quiz by its code.
 * Route: GET /api/student/quizzes/check-attempt/:quizCode
 * Access: Private (Student only)
 * @param {object} req - Express request object (expects quiz code in params)
 * @param {object} res - Express response object
 */
export const checkStudentQuizStatus = asyncHandler(async (req, res) => {
    const quizCode = req.params.quizCode.toUpperCase();
    const studentId = req.user.id;

    // First, find the quiz by its code to get its ID, ensuring it's published
    const quiz = await Quiz.findOne({ quizCode: quizCode, published: true }).select('_id');

    if (!quiz) {
        // If the quiz is not found or not published, then implicitly the student hasn't attempted it via this flow.
        return res.json({ hasAttempted: false, quizFound: false, message: 'Quiz not found or not published.' });
    }

    // Now, check for an existing attempt by this student for this quiz's ID
    const existingAttempt = await QuizAttempt.findOne({ student: studentId, quiz: quiz._id });

    if (existingAttempt) {
        // Student has attempted this quiz
        return res.json({ hasAttempted: true, quizFound: true, lastAttemptId: existingAttempt._id });
    } else {
        // Student has not attempted this quiz
        return res.json({ hasAttempted: false, quizFound: true });
    }
});


/**
 * @function submitStudentQuizAttempt
 * @description Processes a student's quiz submission, calculates score, and saves the attempt.
 * Includes generating Gemini AI analysis for the attempt.
 * Route: POST /api/student/quizzes/submit
 * Access: Private (Student only)
 * @param {object} req - Express request object (expects quizId, answers, proctoringEvents, isSuspicious in body)
 * @param {object} res - Express response object
 */
export const submitStudentQuizAttempt = asyncHandler(async (req, res) => {
    const { quizId, answers, proctoringEvents, isSuspicious } = req.body;
    const studentId = req.user.id;

    if (!quizId || !answers || !Array.isArray(answers)) {
        res.status(400);
        throw new Error('Invalid quiz submission data: missing quizId or answers array.');
    }

    const quiz = await Quiz.findById(quizId);

    if (!quiz || !quiz.published) {
        res.status(404);
        throw new new Error('Quiz not found or not available for submission.');
    }

    // Final server-side check to prevent duplicate submissions
    const existingAttempt = await QuizAttempt.findOne({ student: studentId, quiz: quizId });
    if (existingAttempt) {
        res.status(409); // Conflict status
        throw new Error('Duplicate submission detected: You have already completed this quiz.');
    }

    let score = 0;
    const totalQuestions = quiz.questions.length;
    const studentDetailedAnswers = answers.map(submittedAns => {
        // Find the corresponding question from the quiz to check correctness
        const question = quiz.questions.find(q => q.id === submittedAns.questionId);
        const isCorrect = question && question.correctAnswerId === submittedAns.selectedOptionId;
        if (isCorrect) {
            score++;
        }
        return {
            questionId: submittedAns.questionId,
            selectedOptionId: submittedAns.selectedOptionId,
            isCorrect: isCorrect,
        };
    });

    const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;

    // Generate AI analysis for the quiz attempt
    const geminiAnalytics = await generateQuizAttemptAnalysis(
        quiz.questions, // Full questions with correct answers
        studentDetailedAnswers,
        score,
        totalQuestions,
        isSuspicious,
        proctoringEvents
    );

    const newAttempt = new QuizAttempt({
        student: studentId,
        quiz: quiz._id,
        quizTitle: quiz.quizTitle,
        quizSubject: quiz.subject,
        quizTopic: quiz.userProvidedTopic,
        answers: studentDetailedAnswers,
        score: score,
        totalQuestions: totalQuestions,
        percentage: percentage,
        proctoringEvents: proctoringEvents || [],
        isSuspicious: isSuspicious || false,
        geminiAnalytics: geminiAnalytics,
    });

    const savedAttempt = await newAttempt.save();
    res.status(201).json(savedAttempt); // Return the saved attempt object
});

/**
 * @function getStudentQuizAttempts
 * @description Retrieves all quiz attempts made by the authenticated student.
 * Route: GET /api/student/quizzes/attempts
 * Access: Private (Student only)
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const getStudentQuizAttempts = asyncHandler(async (req, res) => {
    const studentId = req.user.id;
    console.log(`[quiz2.controller] Fetching quiz attempts for student ID: ${studentId}`);
    const attempts = await QuizAttempt.find({ student: studentId })
                                       .sort({ submittedAt: -1 }) // Sort by most recent first
                                       .select('quizTitle quizSubject quizTopic score totalQuestions percentage submittedAt isSuspicious');
    res.json(attempts);
});

/**
 * @function getStudentIndividualQuizReport
 * @description Retrieves details of a single quiz attempt by its ID for the authenticated student.
 * Route: GET /api/student/quizzes/attempts/:attemptId
 * Access: Private (Student only)
 * @param {object} req - Express request object (expects attempt ID in params)
 * @param {object} res - Express response object
 */
export const getStudentIndividualQuizReport = asyncHandler(async (req, res) => {
    const attemptId = req.params.attemptId;
    const studentId = req.user.id;

    const attempt = await QuizAttempt.findOne({ _id: attemptId, student: studentId })
                                       .populate('quiz', 'quizTitle questions'); // Populate quiz details to show questions

    if (!attempt) {
        res.status(404);
        throw new Error('Quiz attempt report not found or you are not authorized to view it.');
    }

    res.json(attempt);
});
