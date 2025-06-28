// backend/index.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './src/config/db.js';
import authRoutes from './src/routes/auth.routes.js';
import quizRoutes from './src/routes/quiz.routes.js'; // Existing teacher quiz routes
import quiz2Routes from './src/routes/quiz2.routes.js'; // NEW: Student quiz routes

dotenv.config();

connectDB();

const app = express();

// Allow larger payload sizes for JSON and URL-encoded bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS configuration
app.use(cors({
    origin: 'http://localhost:5173', // <--- Ensure this matches your frontend URL
    credentials: true,
}));

// Define routes
app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes); // Teacher quiz routes
app.use('/api/student/quizzes', quiz2Routes); // NEW: Student quiz routes will use this prefix

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log("Backend routes initialized:");
});
