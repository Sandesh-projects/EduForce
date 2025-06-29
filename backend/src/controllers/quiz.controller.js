// Quiz controller for teacher operations
import Quiz from '../models/quiz.model.js';
import QuizAttempt from '../models/QuizAttempt.model.js';
import { extractTextFromPdf } from '../services/pdfParse.js';
import { generateMCQsFromText } from '../services/gemini.services.js';
import randomstring from 'randomstring';
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';


// Generates a unique quiz code
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


// Creates a quiz from PDF content
export const createQuizFromPdfContent = asyncHandler(async (req, res) => {
    const { pdfBase64, numQuestions, subject, userProvidedTopic } = req.body;
    const teacherId = req.user._id;

    // Check for required input
    if (!pdfBase64 || !subject || !userProvidedTopic) {
        res.status(400);
        throw new Error('PDF content (Base64), Subject, and Topic are all required to generate a quiz.');
    }

    try {
        // Extract text from PDF
        const textContent = await extractTextFromPdf(pdfBase64);

        if (typeof textContent !== 'string' || textContent.trim().length === 0) {
            res.status(400);
            throw new Error('Failed to extract meaningful text from the PDF. Please ensure the PDF contains selectable text.');
        }

        // Generate unique quiz code and MCQs
        const quizCode = await generateUniqueQuizCode();
        const mcqsData = await generateMCQsFromText(textContent, numQuestions, subject, userProvidedTopic);

        // Check if MCQs were generated
        if (!mcqsData || !mcqsData.questions || mcqsData.questions.length === 0) {
            res.status(500);
            throw new Error('The AI model could not generate valid questions from the provided text. Please try different content or parameters.');
        }

        // Create and save the new quiz
        const newQuiz = await Quiz.create({
            teacher: teacherId,
            quizTitle: mcqsData.quizTitle || `${subject} Quiz`,
            subject: subject,
            userProvidedTopic: userProvidedTopic,
            quizCode: quizCode,
            quizInstructions: mcqsData.quizInstructions || 'Answer carefully based on the provided text.',
            questions: mcqsData.questions,
            published: true,
        });

        res.status(201).json({
            message: 'Quiz successfully generated and saved!',
            quiz: newQuiz,
        });
    } catch (error) {
        console.error('Error in createQuizFromPdfContent:', error);
        if (!res.headersSent) {
            res.status(error.statusCode || 500).json({ message: error.message || 'Failed to generate quiz.' });
        }
    }
});

// Retrieves all quizzes created by the teacher
export const retrieveTeacherQuizzes = asyncHandler(async (req, res) => {
    const teacherId = req.user._id;

    try {
        const quizzes = await Quiz.find({ teacher: teacherId }).sort({ createdAt: -1 });
        res.status(200).json(quizzes);
    } catch (error) {
        console.error('Error in retrieveTeacherQuizzes:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Failed to retrieve quizzes for the teacher.' });
        }
    }
});

// Fetches a single quiz by ID with role-based access
export const getQuizDetailsById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    try {
        const quiz = await Quiz.findById(id);

        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found.' });
        }

        // Teacher access
        if (userRole === 'teacher') {
            if (quiz.teacher.toString() !== userId.toString()) {
                return res.status(403).json({ message: 'Access denied: You are not authorized to view this quiz.' });
            }
            return res.status(200).json(quiz);
        }

        // Student access
        if (userRole === 'student') {
            if (!quiz.published) {
                return res.status(403).json({ message: 'Quiz is not published and therefore not accessible.' });
            }
            // Filter out sensitive info for students
            const quizForStudent = {
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
            return res.status(200).json(quizForStudent);
        }

        // Unauthorized role fallback
        return res.status(403).json({ message: 'Access denied: Your role is not authorized.' });

    } catch (error) {
        console.error('Error in getQuizDetailsById:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: error.message || 'Failed to retrieve quiz details.' });
        }
    }
});

// Deletes a quiz by its ID
export const removeQuizById = asyncHandler(async (req, res) => {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found.');
    }

    // Check if the teacher owns the quiz
    if (quiz.teacher.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Unauthorized: You are not permitted to delete this quiz.');
    }

    await quiz.deleteOne();
    res.status(200).json({ message: 'Quiz successfully deleted.' });
});

// Updates an existing quiz
export const updateExistingQuiz = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updatedQuizData = req.body;
    const userId = req.user._id;

    // Validate input data
    if (!updatedQuizData || !Array.isArray(updatedQuizData.questions)) {
        res.status(400);
        throw new Error('Invalid quiz data provided. Questions array is required and must be an array.');
    }

    try {
        const quiz = await Quiz.findById(id);

        if (!quiz) {
            res.status(404);
            throw new Error('Quiz not found for update.');
        }

        // Verify teacher ownership
        if (quiz.teacher.toString() !== userId.toString()) {
            res.status(403);
            throw new Error('Forbidden: You are not authorized to update this quiz.');
        }

        // Apply updates
        quiz.quizTitle = updatedQuizData.quizTitle || quiz.quizTitle;
        quiz.subject = updatedQuizData.subject || quiz.subject;
        quiz.userProvidedTopic = updatedQuizData.userProvidedTopic || quiz.userProvidedTopic;
        quiz.quizInstructions = updatedQuizData.quizInstructions || quiz.quizInstructions;
        quiz.questions = updatedQuizData.questions;
        quiz.published = typeof updatedQuizData.published === 'boolean' ? updatedQuizData.published : quiz.published;

        // Mark questions array as modified for Mongoose
        quiz.markModified('questions');

        const savedQuiz = await quiz.save();
        res.status(200).json({ message: 'Quiz updated successfully.', quiz: savedQuiz });
    } catch (error) {
        console.error('Error in updateExistingQuiz:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: error.message || 'Failed to update quiz.' });
        }
    }
});


// Publishes or unpublishes a quiz
export const publishOrUnpublishQuiz = asyncHandler(async (req, res) => {
    const { published } = req.body;
    const teacherId = req.user._id;

    // Find quiz and check teacher ownership
    const quiz = await Quiz.findOne({ _id: req.params.id, teacher: teacherId });

    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found or you are not authorized to modify its publishing status.');
    }

    // Update published status and save
    quiz.published = published;
    const updatedQuiz = await quiz.save();
    res.json(updatedQuiz);
});

// --- TEACHER ROUTES for Reports and Analytics ---

// Retrieves all quiz attempts for a specific quiz by the owning teacher
export const getQuizAttemptsOverviewForTeacher = asyncHandler(async (req, res) => {
    const { quizId } = req.params;
    const teacherId = req.user._id;

    // Verify teacher owns the quiz
    const quiz = await Quiz.findOne({ _id: quizId, teacher: teacherId }).lean();

    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found or you are not authorized to view reports for this quiz.');
    }

    // Fetch and populate quiz attempts
    const attempts = await QuizAttempt.find({ quiz: quizId })
        .populate('student', 'fullName email')
        .sort({ submittedAt: 1 });

    // Format attempts for response
    const formattedAttempts = attempts.map(attempt => ({
        _id: attempt._id,
        studentId: attempt.student?._id,
        studentName: attempt.student?.fullName || 'Unknown Student',
        studentEmail: attempt.student?.email || 'N/A',
        quizTitle: attempt.quizTitle,
        quizSubject: attempt.quizSubject,
        quizTopic: attempt.quizTopic,
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        percentage: attempt.percentage,
        isSuspicious: attempt.isSuspicious,
        submittedAt: attempt.submittedAt,
        geminiAnalytics: attempt.geminiAnalytics,
    }));

    res.status(200).json(formattedAttempts);
});


// Retrieves a detailed report of a student's quiz attempt for a teacher
export const getTeacherSpecificStudentAttemptReport = asyncHandler(async (req, res) => {
    const { attemptId } = req.params;
    const teacherId = req.user._id;

    // Find and populate quiz attempt
    const attempt = await QuizAttempt.findById(attemptId)
        .populate('quiz', 'teacher questions')
        .populate('student', 'fullName email');

    if (!attempt) {
        res.status(404);
        throw new Error('Quiz attempt not found.');
    }

    // Authorize: Ensure teacher owns the quiz
    if (!attempt.quiz || attempt.quiz.teacher.toString() !== teacherId.toString()) {
        res.status(403);
        throw new Error('Access denied: You are not authorized to view this quiz attempt report.');
    }

    res.status(200).json(attempt);
});


// Retrieves students for quiz attempts (might be redundant)
export const getStudentsForQuizAttempts = asyncHandler(async (req, res) => {
    const { quizId } = req.params;
    const teacherId = req.user._id;

    // Verify quiz ownership
    const quiz = await Quiz.findById(quizId);
    if (!quiz || quiz.teacher.toString() !== teacherId.toString()) {
        res.status(404);
        throw new Error('Quiz not found or you are not authorized to view its attempts.');
    }
    // Aggregate student attempts
    const studentAttempts = await QuizAttempt.aggregate([
        { $match: { quiz: new mongoose.Types.ObjectId(quizId) } },
        { $sort: { submittedAt: -1 } },
        {
            $group: {
                _id: '$student',
                latestAttemptId: { $first: '$_id' },
                score: { $first: '$score' },
                totalQuestions: { $first: '$totalQuestions' },
                percentage: { $first: '$percentage' },
                isSuspicious: { $first: '$isSuspicious' },
                submittedAt: { $first: '$submittedAt' },
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'studentInfo'
            }
        },
        { $unwind: '$studentInfo' },
        {
            $project: {
                _id: '$latestAttemptId',
                studentId: '$_id',
                studentName: '$studentInfo.fullName',
                email: '$studentInfo.email',
                quizTitle: '$quizTitle',
                quizSubject: '$quizSubject',
                quizTopic: '$quizTopic',
                score: 1,
                totalQuestions: 1,
                percentage: 1,
                isSuspicious: 1,
                submittedAt: 1,
            }
        },
        { $sort: { submittedAt: -1 } }
    ]);
    if (studentAttempts.length === 0) {
        return res.status(200).json([]);
    }
    res.status(200).json(studentAttempts);
});