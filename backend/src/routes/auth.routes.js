// backend/src/routes/auth.routes.js
import express from 'express';
import {
    registerUser,
    authUser, // Renamed from loginUser for consistency
    getLoggedInUserProfile, // Renamed from getMe for clarity
    updateUserProfile,
    updateUserPassword,
    logoutUser, // Added logoutUser
} from '../controllers/auth.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js'; // Ensure authenticateUser is imported

// --- !!! IMPORTANT VERIFICATION LOG !!! ---
// WHEN YOUR BACKEND SERVER STARTS, YOU *MUST* SEE THIS EXACT MESSAGE IN ITS TERMINAL.
console.log("Loading auth.routes.js (Version Check: 2025-06-27 Final Profile and Logout Routes)");

const router = express.Router();

// Public routes (no authentication required)
router.post('/register', registerUser);
router.post('/login', authUser); // Using authUser

// Protected routes (authentication required)
router.post('/logout', authenticateUser, logoutUser); // Added logout route
router.route('/profile')
    .get(authenticateUser, getLoggedInUserProfile) // Get user profile
    .put(authenticateUser, updateUserProfile);    // Update user profile (name, email)

router.put('/profile/password', authenticateUser, updateUserPassword); // Update user password

export default router;
