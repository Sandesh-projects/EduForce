// backend/src/models/quiz.model.js
import mongoose from 'mongoose';

/**
 * @typedef QuizQuestionOption
 * @property {string} id - Unique ID for the option.
 * @property {string} text - Text of the option.
 */

/**
 * @typedef QuizQuestion
 * @property {string} id - Unique ID for the question.
 * @property {string} questionText - The text of the question.
 * @property {QuizQuestionOption[]} options - Array of answer options.
 * @property {string} correctAnswerId - ID of the correct option.
 * @property {string} explanation - Explanation for the correct answer.
 * @property {('Easy'|'Medium'|'Hard')} difficulty - Difficulty level.
 * @property {string} topic - Specific topic covered.
 */

/**
 * @typedef Quiz
 * @property {mongoose.Schema.Types.ObjectId} teacher - The ID of the teacher who created the quiz. Required.
 * @property {string} quizTitle - Title of the quiz.
 * @property {string} quizInstructions - Instructions for the quiz.
 * @property {QuizQuestion[]} questions - Array of quiz questions.
 * @property {Date} createdAt - Timestamp of creation.
 * @property {Date} updatedAt - Timestamp of last update.
 */
const quizSchema = mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId, // Links to the User model
      ref: 'User', // Reference to the 'User' model
      required: [true, 'Quiz must belong to a teacher'],
    },
    quizTitle: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true,
    },
    quizInstructions: {
      type: String,
      default: 'Answer carefully based on the provided text.',
    },
    questions: [
      {
        id: { type: String, required: true }, // Unique ID for question (from Gemini)
        questionText: { type: String, required: true },
        options: [
          {
            id: { type: String, required: true }, // Unique ID for option
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
        topic: { type: String },
      },
    ],
    // You might add a field for the original PDF URL/filename here later
    // originalPdfRef: { type: String },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;