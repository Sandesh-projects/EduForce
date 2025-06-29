// Middleware for authentication and authorization
import jwt from 'jsonwebtoken';
import User from '../models/auth.model.js';

// Middleware to verify JWT token and attach user data
const authenticateUser = async (req, res, next) => {
    let token;

    // Check for authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);

            // Find user by ID and exclude password
            const user = await User.findById(decodedToken.id).select('-password');

            if (!user) {
                return res.status(401).json({ message: 'Authentication failed: User not found.' });
            }

            req.user = user;
            next();

        } catch (error) {
            // Handle token-related errors
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Authentication failed: Token has expired.' });
            }
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Authentication failed: Invalid token.' });
            }
            res.status(401).json({ message: 'Authentication failed: Token invalid or missing.' });
        }
    } else {
        res.status(401).json({ message: 'Authentication required: No token provided.' });
    }
};

// Middleware to restrict access based on user roles
const restrictToRoles = (allowedRoles = []) => {
    if (typeof allowedRoles === 'string') {
        allowedRoles = [allowedRoles];
    }

    return (req, res, next) => {
        // Check if user and role are present
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: 'Authorization failed: User role information unavailable.' });
        }

        // Check if user's role is allowed
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access forbidden: Your role (${req.user.role}) is not authorized for this action.`
            });
        }

        next();
    };
};

// Middleware to only check if a user is authenticated
const allowAuthenticated = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
            const user = await User.findById(decodedToken.id).select('-password');

            if (!user) {
                return res.status(401).json({ message: 'Authentication failed: User not found.' });
            }

            req.user = user;
            next();
        } catch (error) {
            res.status(401).json({ message: 'Authentication required: Invalid or expired token.' });
        }
    } else {
        res.status(401).json({ message: 'Authentication required: No token provided.' });
    }
};

export { authenticateUser, restrictToRoles, allowAuthenticated };