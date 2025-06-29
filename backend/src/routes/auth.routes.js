// Auth routes for user authentication
import express from 'express';
import {
    registerUser,
    authUser,
    getLoggedInUserProfile,
    updateUserProfile,
    updateUserPassword,
    logoutUser,
} from '../controllers/auth.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', authUser);

// Protected routes (require authentication)
router.post('/logout', authenticateUser, logoutUser);
router.route('/profile')
    .get(authenticateUser, getLoggedInUserProfile)
    .put(authenticateUser, updateUserProfile);

router.put('/profile/password', authenticateUser, updateUserPassword);

export default router;