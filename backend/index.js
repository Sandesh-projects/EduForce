// backend/index.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './src/config/db.js';
import authRoutes from './src/routes/auth.routes.js';
import quizRoutes from './src/routes/quiz.routes.js';
import quiz2Routes from './src/routes/quiz2.routes.js';

dotenv.config();

connectDB();

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS configuration - IMPORTANT CHANGES FOR DEPLOYMENT AND DYNAMIC VERCEL URLs
const allowedOrigins = [
    // 'http://localhost:5173', // For local frontend development
    'https://eduforce-frontend.vercel.app', // Your main Vercel frontend URL
    // Crucially, allow any subdomain of Vercel for dynamic deployments
    /^https:\/\/eduforce-frontend(-\w+)*\.vercel\.app$/ // Regex to match eduforce-frontend.vercel.app AND eduforce-frontend-xxxx.vercel.app
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true); // Allow requests with no origin (e.g., Postman)

        // Check if the origin exactly matches an allowed string OR matches the regex pattern
        const isAllowed = allowedOrigins.some(allowed => {
            if (typeof allowed === 'string') {
                return allowed === origin;
            } else if (allowed instanceof RegExp) {
                return allowed.test(origin);
            }
            return false;
        });

        if (isAllowed) {
            callback(null, true);
        } else {
            const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
            callback(new Error(msg), false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Define routes
app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/student/quizzes', quiz2Routes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log("Backend routes initialized:");
});