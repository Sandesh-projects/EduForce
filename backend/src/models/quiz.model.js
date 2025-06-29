// Quiz model definition
import mongoose from 'mongoose';

// Define the quiz schema
const quizSchema = mongoose.Schema(
    {
        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Quiz must belong to a teacher'],
        },
        quizTitle: {
            type: String,
            required: [true, 'Quiz title is required'],
            trim: true,
        },
        // Subject of the quiz
        subject: {
            type: String,
            required: [true, 'Subject is required'],
            trim: true,
        },
        // User-provided topic for the quiz
        userProvidedTopic: {
            type: String,
            required: [true, 'Topic is required'],
            trim: true,
        },
        // Unique code for the quiz
        quizCode: {
            type: String,
            required: [true, 'Quiz code is required'],
            unique: true,
            trim: true,
            minlength: 6,
            maxlength: 10,
        },
        quizInstructions: {
            type: String,
            default: 'Answer carefully based on the provided text.',
        },
        // Quiz publishing status
        published: {
            type: Boolean,
            default: true, // Quizzes are published by default
        },
        questions: [
            {
                id: { type: String, required: true },
                questionText: { type: String, required: true },
                options: [
                    {
                        id: { type: String, required: true },
                        text: { type: String, required: true },
                    },
                ],
                correctAnswerId: { type: String, required: true },
                explanation: { type: String },
                difficulty: {
                    type: String,
                    enum: ['Easy', 'Medium', 'Hard'],
                    default: 'Medium',
                },
                topic: { type: String }, // Topic for individual question
            },
        ],
    },
    {
        timestamps: true, // Adds createdAt and updatedAt fields
    }
);

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;