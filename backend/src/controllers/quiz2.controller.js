// Quiz controller for student operations
import Quiz from '../models/quiz.model.js';
import QuizAttempt from '../models/QuizAttempt.model.js';
import { generateQuizAttemptAnalysis } from '../services/gemini.services.student.submit.js';
import asyncHandler from 'express-async-handler';


// Retrieves all published quizzes available to students
export const getAvailablePublishedQuizzes = asyncHandler(async (req, res) => {
    const quizzes = await Quiz.find({ published: true })
        .select('quizTitle subject userProvidedTopic quizCode createdAt questions.length');
    res.json(quizzes);
});

// Retrieves a specific published quiz by code for a student
export const getQuizForStudentByCode = asyncHandler(async (req, res) => {
    const quizCode = req.params.quizCode.toUpperCase();
    const studentId = req.user.id;

    // Find the quiz
    const quiz = await Quiz.findOne({ quizCode: quizCode, published: true })
        .select('-teacher -createdAt -updatedAt -__v');

    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found or not currently published with this code.');
    }

    // Check for existing attempts by the student
    const existingAttempt = await QuizAttempt.findOne({ student: studentId, quiz: quiz._id });
    if (existingAttempt) {
        res.status(409);
        throw new Error('You have already completed this quiz. Re-attempts are not permitted.');
    }

    // Prepare quiz data for student, excluding correct answers
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

// Checks if a student has already attempted a quiz by its code
export const checkStudentQuizStatus = asyncHandler(async (req, res) => {
    const quizCode = req.params.quizCode.toUpperCase();
    const studentId = req.user.id;

    // Find the quiz
    const quiz = await Quiz.findOne({ quizCode: quizCode, published: true }).select('_id');

    if (!quiz) {
        return res.json({ hasAttempted: false, quizFound: false, message: 'Quiz not found or not published.' });
    }

    // Check for an existing attempt
    const existingAttempt = await QuizAttempt.findOne({ student: studentId, quiz: quiz._id });

    if (existingAttempt) {
        return res.json({ hasAttempted: true, quizFound: true, lastAttemptId: existingAttempt._id });
    } else {
        return res.json({ hasAttempted: false, quizFound: true });
    }
});


// Processes a student's quiz submission
export const submitStudentQuizAttempt = asyncHandler(async (req, res) => {
    const { quizId, answers, proctoringEvents, isSuspicious } = req.body;
    const studentId = req.user.id;

    // Validate input
    if (!quizId || !answers || !Array.isArray(answers)) {
        res.status(400);
        throw new Error('Invalid quiz submission data: missing quizId or answers array.');
    }

    // Find the quiz
    const quiz = await Quiz.findById(quizId);

    if (!quiz || !quiz.published) {
        res.status(404);
        throw new new Error('Quiz not found or not available for submission.');
    }

    // Prevent duplicate submissions
    const existingAttempt = await QuizAttempt.findOne({ student: studentId, quiz: quizId });
    if (existingAttempt) {
        res.status(409);
        throw new Error('Duplicate submission detected: You have already completed this quiz.');
    }

    let score = 0;
    const totalQuestions = quiz.questions.length;
    // Calculate score and prepare detailed answers
    const studentDetailedAnswers = answers.map(submittedAns => {
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

    // Generate AI analysis
    const geminiAnalytics = await generateQuizAttemptAnalysis(
        quiz.questions,
        studentDetailedAnswers,
        score,
        totalQuestions,
        isSuspicious,
        proctoringEvents
    );

    // Create and save new quiz attempt
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
    res.status(201).json(savedAttempt);
});

// Retrieves all quiz attempts made by the student
export const getStudentQuizAttempts = asyncHandler(async (req, res) => {
    const studentId = req.user.id;
    const attempts = await QuizAttempt.find({ student: studentId })
        .sort({ submittedAt: -1 })
        .select('quizTitle quizSubject quizTopic score totalQuestions percentage submittedAt isSuspicious');
    res.json(attempts);
});

// Retrieves details of a single quiz attempt by ID for the student
export const getStudentIndividualQuizReport = asyncHandler(async (req, res) => {
    const attemptId = req.params.attemptId;
    const studentId = req.user.id;

    // Find and populate quiz attempt
    const attempt = await QuizAttempt.findOne({ _id: attemptId, student: studentId })
        .populate('quiz', 'quizTitle questions');

    if (!attempt) {
        res.status(404);
        throw new Error('Quiz attempt report not found or you are not authorized to view it.');
    }

    res.json(attempt);
});