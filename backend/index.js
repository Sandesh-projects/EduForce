// backend/index.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; // Make sure cors is imported
import connectDB from './src/config/db.js';
import authRoutes from './src/routes/auth.routes.js';
import quizRoutes from './src/routes/quiz.routes.js';

dotenv.config();

connectDB();

const app = express();

// Allow larger payload sizes for JSON and URL-encoded bodies (as previously configured)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS configuration: ALLOW YOUR FRONTEND'S ORIGIN
app.use(cors({
  origin: 'http://localhost:5173', // <--- UPDATED THIS LINE
  credentials: true,
}));

// Define routes
app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));