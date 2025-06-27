// backend/src/controllers/quiz.controller.js
import Quiz from '../models/quiz.model.js';
import QuizAttempt from '../models/QuizAttempt.model.js'; // Import QuizAttempt model
import User from '../models/auth.model.js'; // Import User model from auth.model.js (Assuming you have this import for user details)
import { extractTextFromPdf } from '../services/pdfParse.js'; // <-- CORRECTED IMPORT: USE extractTextFromPdf
import { generateMCQsFromText } from '../services/gemini.services.js'; // Import generateMCQsFromText from your main Gemini service
import { generateQuizAttemptAnalysis } from '../services/gemini.services.student.submit.js'; // Import new analysis service
import randomstring from 'randomstring';
import asyncHandler from 'express-async-handler'; // Import express-async-handler
import mongoose from 'mongoose'; // Ensure mongoose is imported for ObjectId in aggregate

/**
 * Helper function to generate a unique quiz code
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
 * @function generateQuizFromPdf
 * @description Generates MCQs from a PDF and saves the quiz to the database.
 * Route: POST /api/quizzes/generate
 * Access: Private (Teacher only, via protect middleware)
 */
export const generateQuizFromPdf = asyncHandler(async (req, res) => {
    const { pdfBase64, numQuestions, subject, userProvidedTopic } = req.body;
    const teacherId = req.user._id;

    if (!pdfBase64 || !subject || !userProvidedTopic) {
        res.status(400);
        throw new Error('PDF content (Base64), Subject, and Topic are required.');
    }

    try {
        // --- CRITICAL FIX APPLIED HERE ---
        // REMOVED THE LINE: const pdfBuffer = Buffer.from(pdfBase64, 'base64');
        // Now directly passing the pdfBase64 (string) to extractTextFromPdf.
        // The pdfParse.js service is responsible for handling the Buffer conversion internally.
        const textContent = await extractTextFromPdf(pdfBase64); // <-- CORRECTED CALL: Pass pdfBase64 string to extractTextFromPdf

        // This check is now correctly applied to the string output from extractTextFromPdf
        if (typeof textContent !== 'string' || textContent.trim().length === 0) {
            res.status(400);
            throw new Error('Could not extract meaningful text from PDF. Please ensure the PDF contains selectable text.');
        }

        const quizCode = await generateUniqueQuizCode();
        // Call generateMCQsFromText with the extracted text content (which is now a string)
        const mcqsData = await generateMCQsFromText(textContent, numQuestions, subject, userProvidedTopic);

        if (!mcqsData || !mcqsData.questions || mcqsData.questions.length === 0) {
            res.status(500);
            throw new Error('Gemini did not generate any valid questions. Please try with different content.');
        }

        const newQuiz = await Quiz.create({
            teacher: teacherId,
            quizTitle: mcqsData.quizTitle || `${subject} Quiz`,
            subject: subject,
            userProvidedTopic: userProvidedTopic,
            quizCode: quizCode,
            quizInstructions: mcqsData.quizInstructions || 'Answer carefully based on the provided text.',
            questions: mcqsData.questions,
            published: false, // Default to unpublished
        });

        res.status(201).json({
            message: 'Quiz generated and saved successfully!',
            quiz: newQuiz,
        });
    } catch (error) {
        console.error('Error generating and saving quiz:', error);
        if (!res.headersSent) {
            res.status(error.statusCode || 500).json({ message: error.message || 'Failed to generate and save quiz.' });
        }
    }
});

/**
 * @function getTeacherQuizzes
 * @description Fetches all quizzes created by the authenticated teacher.
 * Route: GET /api/quizzes/teacher
 * Access: Private (Teacher only)
 */
export const getTeacherQuizzes = asyncHandler(async (req, res) => {
    const teacherId = req.user._id;

    try {
        const quizzes = await Quiz.find({ teacher: teacherId }).sort({ createdAt: -1 });
        res.status(200).json(quizzes);
    } catch (error) {
        console.error('Error fetching teacher quizzes:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Failed to retrieve quizzes.' });
        }
    }
});

/**
 * @function getQuizById
 * @description Fetches a single quiz by its ID.
 * Route: GET /api/quizzes/:id
 * Access: Private (accessible if the quiz belongs to the teacher, or potentially public for students taking it, based on future logic)
 */
export const getQuizById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    try {
        const quiz = await Quiz.findById(id);

        if (!quiz) {
            res.status(404);
            throw new Error('Quiz not found.');
        }

        // Allow teachers to access their own quizzes (for editing/reviewing)
        // Allow students to access published quizzes (without correct answers)
        if (req.user.role === 'teacher') {
            if (quiz.teacher.toString() !== userId.toString()) {
                res.status(403);
                throw new Error('Not authorized to access this quiz.');
            }
        } else if (req.user.role === 'student') {
            if (!quiz.published) {
                res.status(403);
                throw new Error('Quiz is not published and cannot be accessed by students.');
            }
            // If it's a student, filter out correct answers before sending
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
                    // DO NOT SEND correctAnswerId HERE
                })),
            };
            return res.status(200).json(quizForStudent);
        } else {
            // Catch-all for other roles if they exist
            res.status(403);
            throw new Error('Not authorized to access this quiz.');
        }

        // If the user is the teacher, return the full quiz object
        res.status(200).json(quiz);
    } catch (error) {
        console.error('Error fetching quiz by ID:', error);
        if (!res.headersSent) {
            res.status(error.statusCode || 500).json({ message: error.message || 'Failed to retrieve quiz.' });
        }
    }
});


/**
 * @function deleteQuizById
 * @description Deletes a quiz by its ID.
 * Route: DELETE /api/quizzes/:id
 * Access: Private (Teacher only)
 */
export const deleteQuizById = asyncHandler(async (req, res) => {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found.');
    }

    if (quiz.teacher.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to delete this quiz.');
    }

    await quiz.deleteOne();
    res.status(200).json({ message: 'Quiz removed successfully!' });
});
/**
 * @function updateQuiz
 * @description Updates an existing quiz.
 * Route: PUT /api/quizzes/:id
 * Access: Private (Teacher only)
 */
export const updateQuiz = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updatedQuizData = req.body;
    const userId = req.user._id;

    if (!updatedQuizData || !updatedQuizData.questions || !Array.isArray(updatedQuizData.questions)) {
        res.status(400);
        throw new Error('Invalid quiz data provided. Questions array is missing or malformed.');
    }

    try {
        const quiz = await Quiz.findById(id);

        if (!quiz) {
            res.status(404);
            throw new Error('Quiz not found.');
        }

        if (quiz.teacher.toString() !== userId.toString()) {
            res.status(403);
            throw new Error('Not authorized to update this quiz.');
        }

        // Update fields directly
        quiz.quizTitle = updatedQuizData.quizTitle || quiz.quizTitle;
        quiz.subject = updatedQuizData.subject || quiz.subject;
        quiz.userProvidedTopic = updatedQuizData.userProvidedTopic || quiz.userProvidedTopic;
        quiz.quizInstructions = updatedQuizData.quizInstructions || quiz.quizInstructions;
        quiz.questions = updatedQuizData.questions; // Replace the questions array entirely
        quiz.published = typeof updatedQuizData.published === 'boolean' ? updatedQuizData.published : quiz.published; // Allow updating published status


        // IMPORTANT: Mark 'questions' array as modified if you're replacing it directly
        quiz.markModified('questions');

        await quiz.save(); // Save the updated document

        res.status(200).json({ message: 'Quiz updated successfully', quiz });
    } catch (error) {
        console.error('Error updating quiz:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: error.message || 'Failed to update quiz.' });
        }
    }
});


// @desc     Publish/Unpublish a quiz
// @route    PATCH /api/quizzes/:id/publish
// @access   Private/Teacher
export const publishQuiz = asyncHandler(async (req, res) => {
    const { published } = req.body; // Expect `published: true` or `published: false`

    const quiz = await Quiz.findOne({ _id: req.params.id, teacher: req.user.id });

    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found or you are not authorized to modify this quiz.');
    }

    quiz.published = published;
    const updatedQuiz = await quiz.save();
    res.json(updatedQuiz);
});


// --- Student Specific Controllers ---

// @desc     Get all published quizzes available for students
// @route    GET /api/quizzes/student/published
// @access   Private/Student
export const getPublishedQuizzes = asyncHandler(async (req, res) => {
    const quizzes = await Quiz.find({ published: true })
                               .select('quizTitle subject userProvidedTopic quizCode createdAt questions'); // Include questions to get length on frontend
    res.json(quizzes);
});

// @desc     Get a specific quiz by quizCode for students to take
// @route    GET /api/quizzes/student/take/:quizCode
// @access   Private/Student
export const getQuizByCode = asyncHandler(async (req, res) => {
    const quizCode = req.params.quizCode.toUpperCase();
    // Debugging: Log the quizCode received
    console.log(`Attempting to find quiz with code: ${quizCode}`);

    // Fetch quiz, ensuring it's published
    const quiz = await Quiz.findOne({ quizCode: quizCode, published: true }).select('-teacher -createdAt -updatedAt');

    // Debugging: Log the result of the quiz query
    console.log(`Quiz found: ${quiz ? quiz.quizTitle : 'None'} (Published: ${quiz ? quiz.published : 'N/A'})`);


    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found or not published with this code.');
    }

    // Prepare quiz data to send to student, omitting correct answers
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
            // DO NOT SEND correctAnswerId HERE
        })),
    };

    res.json(quizForStudent);
});

// @desc     Submit a quiz attempt by a student
// @route    POST /api/quizzes/student/submit
// @access   Private/Student
export const submitQuizAttempt = asyncHandler(async (req, res) => {
    const { quizId, answers, proctoringEvents, isSuspicious } = req.body;
    const studentId = req.user.id;

    if (!quizId || !answers || !Array.isArray(answers)) {
        res.status(400);
        throw new Error('Invalid quiz submission data.');
    }

    const quiz = await Quiz.findById(quizId);

    if (!quiz || !quiz.published) {
        res.status(404);
        throw new Error('Quiz not found or not available for submission.');
    }

    let score = 0;
    const totalQuestions = quiz.questions.length;
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

    // Generate AI analysis for the attempt
    const geminiAnalytics = await generateQuizAttemptAnalysis(
        quiz.questions, // Pass full questions including correct answers for analysis
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
        quizTopic: quiz.userProvidedTopic, // Use userProvidedTopic from Quiz
        answers: studentDetailedAnswers,
        score: score,
        totalQuestions: totalQuestions,
        percentage: percentage,
        proctoringEvents: proctoringEvents || [],
        isSuspicious: isSuspicious || false,
        geminiAnalytics: geminiAnalytics, // Store the generated analysis
    });

    const savedAttempt = await newAttempt.save();
    res.status(201).json(savedAttempt);
});

// @desc     Get all quiz attempts for the logged-in student
// @route    GET /api/quizzes/student/attempts
// @access   Private/Student
export const getQuizAttemptsByStudent = asyncHandler(async (req, res) => {
    const studentId = req.user.id;
    const attempts = await QuizAttempt.find({ student: studentId })
                                   .sort({ submittedAt: -1 })
                                   .select('quizTitle quizSubject quizTopic score totalQuestions percentage submittedAt isSuspicious');
    res.json(attempts);
});

// @desc     Get details of a single quiz attempt by ID
// @route    GET /api/quizzes/student/attempts/:attemptId
// @access   Private/Student
export const getQuizAttemptById = asyncHandler(async (req, res) => {
    const attemptId = req.params.attemptId;
    const studentId = req.user.id;

    const attempt = await QuizAttempt.findOne({ _id: attemptId, student: studentId })
                                   .populate('quiz', 'quizTitle questions'); // Populate quiz details if needed

    if (!attempt) {
        res.status(404);
        throw new Error('Quiz attempt not found or you are not authorized to view this report.');
    }

    res.json(attempt);
});


// --- NEW TEACHER ROUTES ---

// @desc     Get all quiz attempts for a specific quiz (for teacher's report)
// @route    GET /api/quizzes/:quizId/attempts-by-quiz
// @access   Private/Teacher
export const getQuizAttemptsForTeacherByQuizId = asyncHandler(async (req, res) => {
    const { quizId } = req.params;
    const teacherId = req.user.id;

    // First, verify that the quiz belongs to the teacher
    const quiz = await Quiz.findOne({ _id: quizId, teacher: teacherId });

    if (!quiz) {
        res.status(404);
        throw new Error('Quiz not found or you are not authorized to view reports for this quiz.');
    }

    // Now, fetch all attempts for this quiz, populating student details
    const attempts = await QuizAttempt.find({ quiz: quizId })
                                     .populate('student', 'firstName lastName email') // Populate student's name
                                     .sort({ submittedAt: 1 }); // Sort by submission date

    // Map attempts to include student's full name for easier display
    const formattedAttempts = attempts.map(attempt => ({
        _id: attempt._id,
        studentId: attempt.student._id,
        // Now using firstName and lastName from the User model (auth.model.js)
        studentName: `${attempt.student.firstName} ${attempt.student.lastName}`.trim(),
        studentEmail: attempt.student.email,
        quizTitle: attempt.quizTitle,
        quizSubject: attempt.quizSubject,
        quizTopic: attempt.quizTopic,
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        percentage: attempt.percentage,
        isSuspicious: attempt.isSuspicious,
        submittedAt: attempt.submittedAt,
        geminiAnalytics: attempt.geminiAnalytics,
        // Add any other fields you need for the report table
    }));

    res.status(200).json(formattedAttempts);
});

// @desc    Get a list of students who have attempted a specific quiz (for Teacher)
// @route   GET /api/quizzes/:quizId/attempts/students
// @access  Private/Teacher
export const getStudentsForQuizAttempts = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const teacherId = req.user._id; // Teacher's ID from authenticated user

  // First, verify that the quiz belongs to the teacher
  const quiz = await Quiz.findById(quizId);
  if (!quiz || quiz.teacher.toString() !== teacherId.toString()) {
    res.status(404);
    throw new Error('Quiz not found or you are not authorized to view its attempts.');
  }

  // Find all quiz attempts for this quizId
  // Group by student and get the latest attempt for each student
  const studentAttempts = await QuizAttempt.aggregate([
    { $match: { quiz: new mongoose.Types.ObjectId(quizId) } }, // Match attempts for the specific quiz
    {
      $sort: { submittedAt: -1 } // Sort by submittedAt in descending order to get the latest attempt first
    },
    {
      $group: {
        _id: '$student', // Group by student
        latestAttemptId: { $first: '$_id' }, // Get the ID of the latest attempt
        studentName: { $first: '$student' }, // This will be the student ObjectId, to be populated
        score: { $first: '$score' }, // Get score of latest attempt
        totalQuestions: { $first: '$totalQuestions' }, // Get totalQuestions of latest attempt
        percentage: { $first: '$percentage' }, // Get percentage of latest attempt
        isSuspicious: { $first: '$isSuspicious' }, // Get suspicious status
        submittedAt: { $first: '$submittedAt' }, // Get submission date
      }
    },
    {
      $lookup: { // Populate student details
        from: 'users', // Collection name for User model
        localField: '_id', // Field from the input documents
        foreignField: '_id', // Field from the "users" collection
        as: 'studentInfo' // Array field to add to the input documents
      }
    },
    {
      $unwind: '$studentInfo' // Deconstruct the studentInfo array
    },
    {
      $project: { // Shape the output
        _id: '$latestAttemptId', // Use the latest attempt ID as the main _id
        studentId: '$_id', // Keep studentId if needed
        studentName: { $concat: ['$studentInfo.firstName', ' ', '$studentInfo.lastName'] }, // Combine first and last name
        email: '$studentInfo.email',
        score: 1,
        totalQuestions: 1,
        percentage: 1,
        isSuspicious: 1,
        submittedAt: 1,
      }
    },
    {
      $sort: { submittedAt: -1 } // Sort final results by submission date
    }
  ]);

  if (studentAttempts.length === 0) {
    return res.status(200).json([]); // Return empty array if no attempts
  }

  res.status(200).json(studentAttempts);
});


// @desc    Get a specific quiz attempt report for a teacher
// @route   GET /api/quizzes/teacher/attempts/:attemptId
// @access  Private/Teacher
export const getStudentQuizAttemptByIdForTeacher = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const teacherId = req.user._id;

  const attempt = await QuizAttempt.findById(attemptId)
    .populate('quiz', 'teacher') // Populate the quiz to check its teacher
    .populate('student', 'firstName lastName email'); // Populate student details

  if (!attempt) {
    res.status(404);
    throw new Error('Quiz attempt not found.');
  }

  // Ensure the teacher is authorized to view this attempt (they own the quiz)
  if (!attempt.quiz || attempt.quiz.teacher.toString() !== teacherId.toString()) {
    res.status(403); // Forbidden
    throw new Error('Not authorized to view this quiz attempt.');
  }

  // If needed, you can re-run Gemini analytics here or just return the stored one
  // For simplicity, we'll return the stored geminiAnalytics
  res.status(200).json(attempt);
});