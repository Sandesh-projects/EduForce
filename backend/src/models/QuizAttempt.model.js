// Quiz Attempt model definition
import mongoose from 'mongoose';

// Define the schema for a quiz attempt
const QuizAttemptSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // References the User model
        required: true,
    },
    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz', // References the Quiz model
        required: true,
    },
    quizTitle: {
        type: String,
        required: true,
    },
    quizSubject: {
        type: String,
        required: true,
    },
    quizTopic: {
        type: String,
        required: true,
    },
    answers: [
        {
            questionId: {
                type: String,
                required: true,
            },
            selectedOptionId: {
                type: String,
                default: null, // Null if unanswered
            },
            isCorrect: {
                type: Boolean,
                default: false,
            },
        },
    ],
    score: {
        type: Number,
        default: 0,
    },
    totalQuestions: {
        type: Number,
        required: true,
    },
    percentage: {
        type: Number,
        default: 0,
    },
    submittedAt: {
        type: Date,
        default: Date.now,
    },
    // AI-generated analysis of the attempt
    geminiAnalytics: {
        type: mongoose.Schema.Types.Mixed, // Flexible object to store AI analysis
        default: {},
    },
    // Proctoring events recorded during the attempt
    proctoringEvents: [
        {
            timestamp: { type: Date, default: Date.now },
            eventType: { type: String, enum: ['fullscreen_exit', 'window_blur', 'copy_paste_attempt', 'other_suspicious_activity'] },
            description: { type: String },
        },
    ],
    isSuspicious: {
        type: Boolean,
        default: false,
    },
});

const QuizAttempt = mongoose.model('QuizAttempt', QuizAttemptSchema);

export default QuizAttempt;