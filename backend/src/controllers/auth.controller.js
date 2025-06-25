// backend/controllers/auth.controller.js
import User from '../models/auth.model.js'; // Import the User model (assuming it uses 'export default')
import jwt from 'jsonwebtoken';
// bcryptjs is used by the userSchema.methods.matchPassword, so it's not directly needed here unless you plan
// to hash passwords directly in the controller instead of the model's pre-save hook.
// For clarity, I'll keep it here as it's often used for comparison.
import bcrypt from 'bcryptjs';

/**
 * @function generateToken
 * @description Generates a JWT token for the given user ID.
 * @param {string} id - User ID
 * @returns {string} JWT token
 */
export const generateToken = (id) => {
    // Ensure JWT_SECRET_KEY is loaded from .env
    if (!process.env.JWT_SECRET_KEY) {
        console.error('JWT_SECRET_KEY is not defined in environment variables.');
        throw new Error('JWT secret key is missing.');
    }
    return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
        expiresIn: '1h', // Token expires in 1 hour
    });
};

/**
 * @function registerUser
 * @description Registers a new user.
 * Route: POST /api/auth/register
 * Access: Public
 */
export const registerUser = async (req, res) => {
    // Destructure 'role' along with other fields
    const { fullName, email, password, role } = req.body;

    // Basic validation
    if (!fullName || !email || !password || !role) {
        return res.status(400).json({ message: "Please fill in all fields." });
    }

    // Validate the role against allowed values
    const allowedRoles = ["student", "teacher"];
    if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role specified." });
    }

    try {
        // Check if user already exists by email
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: "User with this email already exists." });
        }

        // Create new user (password hashing is handled by the pre-save hook in auth.model.js)
        const user = await User.create({
            fullName,
            email,
            password,
            role, // Save the role received from the frontend
        });

        if (user) {
            res.status(201).json({
                message: "User registered successfully",
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role, // Send back the role in the response
                token: generateToken(user._id), // Generate and send token for immediate login
            });
        } else {
            res.status(400).json({ message: "Invalid user data" });
        }
    } catch (error) {
        console.error("Error during user registration:", error);
        // More specific error handling for Mongoose validation or duplicate key errors could be added here
        if (error.code === 11000) { // MongoDB duplicate key error code
            return res.status(400).json({ message: 'A user with this email already exists.' });
        }
        res.status(500).json({ message: "Server error during registration." });
    }
};

/**
 * @function loginUser
 * @description Authenticates a user and returns a token.
 * Route: POST /api/auth/login
 * Access: Public
 */
export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please enter email and password' });
    }

    try {
        // Find user by email
        const user = await User.findOne({ email });

        // Check if user exists and password matches using the model's method
        if (user && (await user.matchPassword(password))) {
            res.status(200).json({
                message: 'Logged in successfully',
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role, // Include role in login response
                token: generateToken(user._id), // Generate and send token
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Error during user login:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

/**
 * @function getMe
 * @description Gets the current authenticated user's profile.
 * Route: GET /api/auth/me
 * Access: Private (requires token)
 */
export const getMe = async (req, res) => {
    // req.user is populated by the protect middleware
    if (req.user) {
        res.status(200).json({
            _id: req.user._id,
            fullName: req.user.fullName,
            email: req.user.email,
            role: req.user.role, // Include role in the 'getMe' response
        });
    } else {
        // This case should ideally not be reached if 'protect' middleware works correctly
        res.status(404).json({ message: 'User not found or not authenticated.' });
    }
};

/**
 * @function logoutUser
 * @description Provides a confirmation for client-side logout.
 * Route: POST /api/auth/logout
 * Access: Public (or Private, depending on desired server-side invalidation)
 */
export const logoutUser = async (req, res) => {
    // For stateless JWTs, logout is primarily client-side (removing token).
    // This endpoint can be used for logging or if you implement token blacklisting.
    res.status(200).json({ message: 'Logged out successfully (client-side token cleared).' });
};

// No need for 'export { ... }' at the end if using 'export const' for each function
// but keeping it if you prefer a single export statement.
// If you use 'export const' for each, remove this.
// export { registerUser, loginUser, getMe };