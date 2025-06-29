// backend/index.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './src/config/db.js';
import authRoutes from './src/routes/auth.routes.js';
import quizRoutes from './src/routes/quiz.routes.js';
import quiz2Routes from './src/routes/quiz2.routes.js';
import fetch from 'node-fetch';

dotenv.config();

connectDB();

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS configuration - IMPORTANT CHANGES FOR DEPLOYMENT AND DYNAMIC VERCEL URLs
const allowedOrigins = [
    'http://localhost:5173', // For local frontend development
    'https://eduforce-frontend.vercel.app', // Your main Vercel frontend URL
    // Crucially, allow any subdomain of Vercel for dynamic deployments
    /^https:\/\/eduforce-frontend(-\w+)*\.vercel\.app$/ // Regex to match eduforce-frontend.vercel.app AND eduforce-frontend-xxxx.vercel.app
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

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

// --- Dedicated Ping/Health Check Endpoint ---
app.get('/ping', (req, res) => {
    res.status(200).send('Pong!');
});
// --- END NEW ---

const PORT = process.env.PORT || 5000;

// --- START: Keep-Alive (Ping) Logic ---
const PING_INTERVAL_MS = 10 * 60 * 1000; // Ping every 10 minutes (Render free plan is 15min inactivity)

const startPinging = () => {
    // Explicitly using the provided Render URL as requested
    const backendUrl = 'https://eduforce.onrender.com';

    const pingUrl = `${backendUrl}/ping`;

    console.log(`Starting keep-alive pings to: ${pingUrl} every ${PING_INTERVAL_MS / 60000} minutes.`);

    setInterval(async () => {
        try {
            const response = await fetch(pingUrl);
            if (response.ok) {
                console.log(`Keep-alive ping successful to ${pingUrl} at ${new Date().toLocaleString()}`);
            } else {
                console.error(`Keep-alive ping failed to ${pingUrl}: Status ${response.status} at ${new Date().toLocaleString()}`);
            }
        } catch (error) {
            console.error(`Keep-alive ping error to ${pingUrl}: ${error.message} at ${new Date().toLocaleString()}`);
        }
    }, PING_INTERVAL_MS);
};

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log("Backend routes initialized:");
    if (process.env.MONGODB_URI) {
        console.log("MongoDB Connected:", process.env.MONGODB_URI.split('@')[1].split('/')[0]);
    } else {
        console.log("MongoDB URI not set in environment variables.");
    }

    // --- IMPORTANT CHANGE HERE ---
    // Start the pinging mechanism only if NODE_ENV is 'production'
    // For this to work correctly, ensure your local .env sets NODE_ENV=development
    // And your Render environment variables set NODE_ENV=production
    if (process.env.NODE_ENV === 'production') {
        startPinging();
    }
});
// --- END: Keep-Alive (Ping) Logic ---