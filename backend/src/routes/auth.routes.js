// backend/routes/auth.routes.js
import express from 'express';
import { registerUser, loginUser, getMe, logoutUser } from '../controllers/auth.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js'; // Updated import from 'protect' to 'authenticateUser'

const router = express.Router();

// Public routes (no authentication required)
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes (authentication required)
router.post('/logout', authenticateUser, logoutUser); // Using authenticateUser
router.get('/me', authenticateUser, getMe);         // Using authenticateUser

export default router;
