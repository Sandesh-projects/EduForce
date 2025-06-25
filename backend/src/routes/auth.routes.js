// backend/routes/auth.routes.js
import express from 'express';
import { registerUser, loginUser, getMe, logoutUser } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', protect, logoutUser);

// Protected route
router.get('/me', protect, getMe);

export default router;