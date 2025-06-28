// backend/src/controllers/auth.controller.js
import User from '../models/auth.model.js';
import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';

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
 * @description Registers a new user with a hashed password and generates a JWT token.
 * Route: POST /api/auth/register
 * Access: Public
 * @param {object} req - Express request object (expects fullName, email, password, role in body)
 * @param {object} res - Express response object
 */
export const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, password, role } = req.body;

    // Only basic required fields are validated for registration
    if (!fullName || !email || !password || !role) {
        res.status(400);
        throw new Error("Please fill in all required fields: Full Name, Email, Password, and Role.");
    }

    // Validate the role against allowed values
    const allowedRoles = ["student", "teacher"];
    if (!allowedRoles.includes(role)) {
        res.status(400);
        throw new Error("Invalid role specified. Role must be 'student' or 'teacher'.");
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400); // Bad Request
        throw new Error('User with that email already exists.');
    }

    // Create new user (optional fields will default to null/empty array if not provided)
    const user = await User.create({
        fullName,
        email,
        password, // Password will be hashed by pre-save hook in model
        role, // Use the provided role after validation
        // New optional fields are not included here, so they will take their defaults
    });

    if (user) {
        // Respond with user details and a generated token
        res.status(201).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            token: generateToken(user._id), // Call the local generateToken
            message: 'Registration successful!',
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data received.');
    }
});

/**
 * @function authUser
 * @description Authenticates a user (login) and generates a JWT token.
 * Route: POST /api/auth/login
 * Access: Public
 * @param {object} req - Express request object (expects email, password in body)
 * @param {object} res - Express response object
 */
export const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400);
        throw new Error('Please enter email and password.');
    }

    // Find user by email
    const user = await User.findOne({ email });

    // Check if user exists and password matches
    if (user && (await user.matchPassword(password))) {
        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            // Include optional fields in login response
            phoneNumber: user.phoneNumber,
            dateOfBirth: user.dateOfBirth,
            bio: user.bio,
            interests: user.interests,
            token: generateToken(user._id), // Call the local generateToken
            message: 'Login successful!',
        });
    } else {
        res.status(401); // Unauthorized
        throw new Error('Invalid email or password.');
    }
});

/**
 * @function getLoggedInUserProfile
 * @description Get the profile of the currently logged-in user.
 * Route: GET /api/auth/profile
 * Access: Private (Authenticated users)
 * @param {object} req - Express request object (user object available from auth middleware)
 * @param {object} res - Express response object
 */
export const getLoggedInUserProfile = asyncHandler(async (req, res) => {
    // req.user is populated by the authenticateUser middleware
    const user = await User.findById(req.user._id).select('-password'); // Exclude password

    if (user) {
        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            phoneNumber: user.phoneNumber,
            dateOfBirth: user.dateOfBirth,
            bio: user.bio,
            interests: user.interests,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        });
    } else {
        res.status(404);
        throw new Error('User not found.');
    }
});


/**
 * @function updateUserProfile
 * @description Update the profile of the currently logged-in user (fullName, email, and new optional fields).
 * Route: PUT /api/auth/profile
 * Access: Private (Authenticated users)
 * @param {object} req - Express request object (expects new profile data in body)
 * @param {object} res - Express response object
 */
export const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        // Update required fields
        if (req.body.fullName !== undefined) { // Check for undefined, allowing empty string
            user.fullName = req.body.fullName;
        }

        // Update email - check for uniqueness if email is changed
        if (req.body.email !== undefined && req.body.email !== user.email) {
            const emailExists = await User.findOne({ email: req.body.email });
            if (emailExists && emailExists._id.toString() !== user._id.toString()) {
                res.status(400);
                throw new Error('This email is already in use by another account.');
            }
            user.email = req.body.email;
        }

        // Update new optional fields
        if (req.body.phoneNumber !== undefined) {
            user.phoneNumber = req.body.phoneNumber === '' ? null : req.body.phoneNumber;
        }
        if (req.body.dateOfBirth !== undefined) {
            // Convert string date to Date object; handle empty string as null
            user.dateOfBirth = req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : null;
        }
        if (req.body.bio !== undefined) {
            user.bio = req.body.bio === '' ? null : req.body.bio;
        }
        if (req.body.interests !== undefined) {
            // Assume interests come as a comma-separated string from frontend, convert to array
            if (typeof req.body.interests === 'string') {
                user.interests = req.body.interests.split(',').map(interest => interest.trim()).filter(interest => interest !== '');
            } else if (Array.isArray(req.body.interests)) {
                user.interests = req.body.interests.map(interest => interest.trim()).filter(interest => interest !== '');
            } else {
                user.interests = []; // Default to empty array if unexpected type
            }
        }

        const updatedUser = await user.save();

        res.status(200).json({
            _id: updatedUser._id,
            fullName: updatedUser.fullName,
            email: updatedUser.email,
            role: updatedUser.role,
            phoneNumber: updatedUser.phoneNumber,
            dateOfBirth: updatedUser.dateOfBirth,
            bio: updatedUser.bio,
            interests: updatedUser.interests,
            message: 'Profile updated successfully!',
        });
    } else {
        res.status(404);
        throw new Error('User not found.');
    }
});


/**
 * @function updateUserPassword
 * @description Update the password of the currently logged-in user.
 * Route: PUT /api/auth/profile/password
 * Access: Private (Authenticated users)
 * @param {object} req - Express request object (expects currentPassword, newPassword in body)
 * @param {object} res - Express response object
 */
export const updateUserPassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (user) {
        // Check if current password matches
        if (!(await user.matchPassword(currentPassword))) {
            res.status(401);
            throw new Error('Current password incorrect.');
        }

        // Set new password (pre-save hook will hash it)
        user.password = newPassword;
        await user.save(); // This will trigger the pre('save') hook to hash the new password

        res.status(200).json({ message: 'Password updated successfully!' });
    } else {
        res.status(404);
        throw new Error('User not found.');
    }
});

/**
 * @function logoutUser
 * @description Provides a success response for logout. Frontend handles token removal.
 * Route: POST /api/auth/logout
 * Access: Private (Authenticated users)
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const logoutUser = asyncHandler(async (req, res) => {
    res.status(200).json({ message: 'User logged out successfully.' });
});
