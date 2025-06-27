// backend/src/controllers/quiz.controller.js
import Quiz from '../models/quiz.model.js';
import QuizAttempt from '../models/QuizAttempt.model.js';
import User from '../models/auth.model.js';
import { extractTextFromPdf } from '../services/pdfParse.js';
import { generateMCQsFromText } from '../services/gemini.services.js';
import { generateQuizAttemptAnalysis } from '../services/gemini.services.student.submit.js';
import randomstring from 'randomstring';
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose'; // Used for ObjectId in aggregation pipeline


/**
 * Helper function: Generates a unique, uppercase alphanumeric quiz code.
 * @returns {Promise<string>} A unique 8-character quiz code.
 */
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


/**
 * @function createQuizFromPdfContent
 * @description Generates MCQs from uploaded PDF content and saves the quiz.
 * Route: POST /api/quizzes/generate
 * Access: Private (Teacher only)
 * @param {object} req - Express request object (expects pdfBase64, numQuestions, subject, userProvidedTopic in body)
 * @param {object} res - Express response object
 */
export const createQuizFromPdfContent = asyncHandler(async (req, res) => {
    const { pdfBase64, numQuestions, subject, userProvidedTopic } = req.body;
    const teacherId = req.user._id; // Extracted from authenticated user

    if (!pdfBase64 || !subject || !userProvidedTopic) {
        res.status(400);
        throw new Error('PDF content (Base64), Subject, and Topic are all required to generate a quiz.');
    }

    try {
        const textContent = await extractTextFromPdf(pdfBase64);

        if (typeof textContent !== 'string' || textContent.trim().length === 0) {
            res.status(400);
            throw new Error('Failed to extract meaningful text from the PDF. Please ensure the PDF contains selectable text.');
        }

        const quizCode = await generateUniqueQuizCode();
        const mcqsData = await generateMCQsFromText(textContent, numQuestions, subject, userProvidedTopic);

        if (!mcqsData || !mcqsData.questions || mcqsData.questions.length === 0) {
            res.status(500);
            throw new Error('The AI model could not generate valid questions from the provided text. Please try different content or parameters.');
        }

        const newQuiz = await Quiz.create({
            teacher: teacherId,
            quizTitle: mcqsData.quizTitle || `${subject} Quiz`,
            subject: subject,
            userProvidedTopic: userProvidedTopic,
            quizCode: quizCode,
            quizInstructions: mcqsData.quizInstructions || 'Answer carefully based on the provided text.',
            questions: mcqsData.questions,
            published: true, // Default to published on creation
        });

        res.status(201).json({
            message: 'Quiz successfully generated and saved!',
            quiz: newQuiz,
        });
    } catch (error) {
        console.error('Error in createQuizFromPdfContent:', error);
        // Ensure response is sent only if no headers have been sent yet
        if (!res.headersSent) {
            res.status(error.statusCode || 500).json({ message: error.message || 'Failed to generate quiz.' });
        }
    }
});

/**
 * @function retrieveTeacherQuizzes
 * @description Fetches all quizzes created by the currently authenticated teacher.
 * Route: GET /api/quizzes/teacher
 * Access: Private (Teacher only)
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
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

/**
 * @function getQuizDetailsById
 * @description Fetches a single quiz by its ID, with role-based access control.
 * Teachers can access their own quizzes. Students can access published quizzes.
 * Route: GET /api/quizzes/:id
 * Access: Private (Teacher or Student)
 * @param {object} req - Express request object (expects quiz ID in params)
 * @param {object} res - Express response object
 */
export const getQuizDetailsById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    try {
        const quiz = await Quiz.findById(id);

        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found.' });
        }

        // Teacher access: Can view any of their own quizzes (published or not)
        if (userRole === 'teacher') {
            if (quiz.teacher.toString() !== userId.toString()) {
                return res.status(403).json({ message: 'Access denied: You are not authorized to view this quiz.' });
            }
            // Return full quiz details for the teacher
            return res.status(200).json(quiz);
        }

        // Student access: Can view only published quizzes
        if (userRole === 'student') {
            if (!quiz.published) {
                return res.status(403).json({ message: 'Quiz is not published and therefore not accessible.' });
            }
            // For students, filter out sensitive information like correct answers
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
                    options: q.options, // Options are needed for display
                })),
            };
            return res.status(200).json(quizForStudent);
        }

        // Fallback for unauthorized roles
        return res.status(403).json({ message: 'Access denied: Your role is not authorized.' });

    } catch (error) {
        console.error('Error in getQuizDetailsById:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: error.message || 'Failed to retrieve quiz details.' });
        }
    }
});

/**
 * @function removeQuizById
 * @description Deletes a quiz by its ID. Only the creating teacher can delete it.
 * Route: DELETE /api/quizzes/:id
 * Access: Private (Teacher only)
 * @param {object} req - Express request object (expects quiz ID in params)
 * @param {object} res - Express response object
 */
export const removeQuizById = asyncHandler(async (req, res) => {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found.');
    }

    // Ensure the logged-in teacher is the creator of the quiz
    if (quiz.teacher.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Unauthorized: You are not permitted to delete this quiz.');
    }

    await quiz.deleteOne();
    res.status(200).json({ message: 'Quiz successfully deleted.' });
});

/**
 * @function updateExistingQuiz
 * @description Updates an existing quiz's details, including questions.
 * Route: PUT /api/quizzes/:id
 * Access: Private (Teacher only)
 * @param {object} req - Express request object (expects quiz ID in params and updated data in body)
 * @param {object} res - Express response object
 */
export const updateExistingQuiz = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updatedQuizData = req.body;
    const userId = req.user._id;

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

        // Verify that the teacher attempting the update is the quiz creator
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

        // Mark questions array as modified to ensure Mongoose saves changes within the array
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


/**
 * @function publishOrUnpublishQuiz
 * @description Publishes or unpublishes a quiz based on the provided status.
 * Route: PATCH /api/quizzes/:id/publish
 * Access: Private (Teacher only)
 * @param {object} req - Express request object (expects quiz ID in params, published status in body)
 * @param {object} res - Express response object
 */
export const publishOrUnpublishQuiz = asyncHandler(async (req, res) => {
    const { published } = req.body; // Expects a boolean
    const teacherId = req.user.id;

    const quiz = await Quiz.findOne({ _id: req.params.id, teacher: teacherId });

    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found or you are not authorized to modify its publishing status.');
    }

    quiz.published = published;
    const updatedQuiz = await quiz.save();
    res.json(updatedQuiz);
});


// --- Student Specific Controllers ---

/**
 * @function getAvailablePublishedQuizzes
 * @description Retrieves all quizzes that are currently published and available to students.
 * Route: GET /api/quizzes/student/published
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
 * Route: GET /api/quizzes/student/take/:quizCode
 * Access: Private (Student only)
 * @param {object} req - Express request object (expects quiz code in params)
 * @param {object} res - Express response object
 */
export const getQuizForStudentByCode = asyncHandler(async (req, res) => {
    const quizCode = req.params.quizCode.toUpperCase();
    const studentId = req.user.id; // Get student ID from authenticated user

    console.log(`Attempting to find quiz with code: ${quizCode} for student ${studentId}`);

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
 * Route: GET /api/quizzes/student/check-attempt/:quizCode
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
 * Route: POST /api/quizzes/student/submit
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
        throw new Error('Quiz not found or not available for submission.');
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
 * Route: GET /api/quizzes/student/attempts
 * Access: Private (Student only)
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const getStudentQuizAttempts = asyncHandler(async (req, res) => {
    const studentId = req.user.id;
    console.log(`Fetching quiz attempts for student ID: ${studentId}`);
    const attempts = await QuizAttempt.find({ student: studentId })
                                       .sort({ submittedAt: -1 }) // Sort by most recent first
                                       .select('quizTitle quizSubject quizTopic score totalQuestions percentage submittedAt isSuspicious');
    res.json(attempts);
});

/**
 * @function getStudentIndividualQuizReport
 * @description Retrieves details of a single quiz attempt by its ID for the authenticated student.
 * Route: GET /api/quizzes/student/attempts/:attemptId
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


// --- TEACHER ROUTES for Reports and Analytics ---

/**
 * @function getQuizAttemptsOverviewForTeacher
 * @description Retrieves all quiz attempts for a specific quiz, for the teacher who owns it.
 * Includes populated student details.
 * Route: GET /api/quizzes/:quizId/attempts
 * Access: Private (Teacher only)
 * @param {object} req - Express request object (expects quiz ID in params)
 * @param {object} res - Express response object
 */
export const getQuizAttemptsOverviewForTeacher = asyncHandler(async (req, res) => {
    const { quizId } = req.params;
    const teacherId = req.user.id;

    // First, verify the teacher owns the quiz to prevent unauthorized access
    const quiz = await Quiz.findOne({ _id: quizId, teacher: teacherId });

    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found or you are not authorized to view reports for this quiz.');
    }

    // Fetch all attempts related to this quiz, populating student information
    const attempts = await QuizAttempt.find({ quiz: quizId })
                                      .populate('student', 'fullName email') // Populate student details for report
                                      .sort({ submittedAt: 1 }); // Sort by submission time

    // Format attempts for clearer response
    const formattedAttempts = attempts.map(attempt => ({
        _id: attempt._id,
        studentId: attempt.student?._id,
        studentName: attempt.student?.fullName || 'Unknown Student',
        studentEmail: attempt.student?.email || 'N/A',
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        percentage: attempt.percentage,
        isSuspicious: attempt.isSuspicious,
        submittedAt: attempt.submittedAt,
        geminiAnalytics: attempt.geminiAnalytics, // Include AI analysis
    }));

    res.status(200).json(formattedAttempts);
});


/**
 * @function getTeacherSpecificStudentAttemptReport
 * @description Retrieves a detailed report of a specific student's quiz attempt for a teacher.
 * Ensures the teacher owns the quiz associated with the attempt.
 * Route: GET /api/quizzes/teacher/attempts/:attemptId
 * Access: Private (Teacher only)
 * @param {object} req - Express request object (expects attempt ID in params)
 * @param {object} res - Express response object
 */
export const getTeacherSpecificStudentAttemptReport = asyncHandler(async (req, res) => {
    const { attemptId } = req.params;
    const teacherId = req.user._id;

    console.log(`[getTeacherSpecificStudentAttemptReport] Attempting to fetch attemptId: ${attemptId} for teacherId: ${teacherId}`);

    const attempt = await QuizAttempt.findById(attemptId)
      .populate('quiz', 'teacher questions') // Populate quiz details: its owner (teacher) and questions
      .populate('student', 'fullName email'); // Populate student details

    if (!attempt) {
      console.log(`[getTeacherSpecificStudentAttemptReport] Attempt ${attemptId} not found.`);
      res.status(404);
      throw new Error('Quiz attempt not found.');
    }

    // Crucial authorization check: Ensure the teacher owns the quiz this attempt belongs to
    if (!attempt.quiz || attempt.quiz.teacher.toString() !== teacherId.toString()) {
        console.log(`[getTeacherSpecificStudentAttemptReport] Authorization failed: Teacher mismatch or quiz not found for attempt.`);
        res.status(403); // Forbidden
        throw new Error('Access denied: You are not authorized to view this quiz attempt report.');
    }

    console.log(`[getTeacherSpecificStudentAttemptReport] Authorization successful for attemptId: ${attemptId}`);
    res.status(200).json(attempt);
});


// Note: The getStudentsForQuizAttempts function appears redundant given getQuizAttemptsOverviewForTeacher
// which already populates student info. Keeping it here with original logic but it might be refactored.
export const getStudentsForQuizAttempts = asyncHandler(async (req, res) => {
    const { quizId } = req.params;
    const teacherId = req.user._id;

    const quiz = await Quiz.findById(quizId);
    if (!quiz || quiz.teacher.toString() !== teacherId.toString()) {
        res.status(404);
        throw new Error('Quiz not found or you are not authorized to view its attempts.');
    }
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
                from: 'users', // MongoDB collection name for User model, typically lowercase and plural
                localField: '_id',
                foreignField: '_id',
                as: 'studentInfo'
            }
        },
        { $unwind: '$studentInfo' }, // Deconstruct the array created by $lookup
        {
            $project: {
                _id: '$latestAttemptId', // Re-assign _id to the attempt ID
                studentId: '$_id', // Keep original student ID
                studentName: '$studentInfo.fullName',
                email: '$studentInfo.email',
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