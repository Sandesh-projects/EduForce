// Auth controller for user authentication
import User from '../models/auth.model.js';
import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';

// Generates a JWT token
export const generateToken = (id) => {
    // Check if secret key is available
    if (!process.env.JWT_SECRET_KEY) {
        console.error('JWT_SECRET_KEY is not defined in environment variables.');
        throw new Error('JWT secret key is missing.');
    }
    return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
        expiresIn: '1h', // Token expires in 1 hour
    });
};

// Registers a new user
export const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, password, role } = req.body;

    // Check for all required fields
    if (!fullName || !email || !password || !role) {
        res.status(400);
        throw new Error("Please fill in all required fields: Full Name, Email, Password, and Role.");
    }

    // Validate the user role
    const allowedRoles = ["student", "teacher"];
    if (!allowedRoles.includes(role)) {
        res.status(400);
        throw new Error("Invalid role specified. Role must be 'student' or 'teacher'.");
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User with that email already exists.');
    }

    // Create a new user
    const user = await User.create({
        fullName,
        email,
        password,
        role,
    });

    // Respond with user data and token
    if (user) {
        res.status(201).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
            message: 'Registration successful!',
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data received.');
    }
});

// Authenticates a user (login)
export const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Check for email and password
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
            phoneNumber: user.phoneNumber,
            dateOfBirth: user.dateOfBirth,
            bio: user.bio,
            interests: user.interests,
            token: generateToken(user._id),
            message: 'Login successful!',
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password.');
    }
});

// Gets the logged-in user's profile
export const getLoggedInUserProfile = asyncHandler(async (req, res) => {
    // Find user by ID and exclude password
    const user = await User.findById(req.user._id).select('-password');

    // Respond with user profile
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


// Updates the logged-in user's profile
export const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        // Update full name if provided
        if (req.body.fullName !== undefined) {
            user.fullName = req.body.fullName;
        }

        // Update email and check for uniqueness
        if (req.body.email !== undefined && req.body.email !== user.email) {
            const emailExists = await User.findOne({ email: req.body.email });
            if (emailExists && emailExists._id.toString() !== user._id.toString()) {
                res.status(400);
                throw new Error('This email is already in use by another account.');
            }
            user.email = req.body.email;
        }

        // Update optional fields
        if (req.body.phoneNumber !== undefined) {
            user.phoneNumber = req.body.phoneNumber === '' ? null : req.body.phoneNumber;
        }
        if (req.body.dateOfBirth !== undefined) {
            user.dateOfBirth = req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : null;
        }
        if (req.body.bio !== undefined) {
            user.bio = req.body.bio === '' ? null : req.body.bio;
        }
        if (req.body.interests !== undefined) {
            if (typeof req.body.interests === 'string') {
                user.interests = req.body.interests.split(',').map(interest => interest.trim()).filter(interest => interest !== '');
            } else if (Array.isArray(req.body.interests)) {
                user.interests = req.body.interests.map(interest => interest.trim()).filter(interest => interest !== '');
            } else {
                user.interests = [];
            }
        }

        // Save updated user
        const updatedUser = await user.save();

        // Respond with updated user data
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


// Updates the logged-in user's password
export const updateUserPassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (user) {
        // Check if current password is correct
        if (!(await user.matchPassword(currentPassword))) {
            res.status(401);
            throw new Error('Current password incorrect.');
        }

        // Set new password and save
        user.password = newPassword;
        await user.save();

        res.status(200).json({ message: 'Password updated successfully!' });
    } else {
        res.status(404);
        throw new Error('User not found.');
    }
});

// Logs out a user
export const logoutUser = asyncHandler(async (req, res) => {
    res.status(200).json({ message: 'User logged out successfully.' });
});