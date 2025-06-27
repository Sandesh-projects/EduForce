// backend/src/models/quiz.model.js
import mongoose from 'mongoose';

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
        // New fields to store user-provided subject and topic
        subject: {
            type: String,
            required: [true, 'Subject is required'],
            trim: true,
        },
        userProvidedTopic: { // Renamed from 'topic' to avoid conflict with 'topic' in questions array
            type: String,
            required: [true, 'Topic is required'],
            trim: true,
        },
        quizCode: { // New field for the unique quiz code
            type: String,
            required: [true, 'Quiz code is required'],
            unique: true, // Ensure quiz codes are unique
            trim: true,
            minlength: 6, // Minimum length for the code
            maxlength: 10, // Maximum length for the code
        },
        quizInstructions: {
            type: String,
            default: 'Answer carefully based on the provided text.',
        },
        published: { // <--- MODIFIED: Default changed to true
            type: Boolean,
            default: true, // Quizzes are published by default when created
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
                topic: { type: String }, // This 'topic' is for individual question topics from Gemini
            },
        ],
    },
    {
        timestamps: true,
    }
);

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;