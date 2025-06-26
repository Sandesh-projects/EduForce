// backend/middleware/auth.middleware.js
import jwt from 'jsonwebtoken';
import User from '../models/auth.model.js'; // Adjust path if necessary

/**
 * @function protect
 * @description Middleware to protect routes.
 * Verifies JWT token from authorization header and attaches user to req object.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const protect = async (req, res, next) => {
    let token;

    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

            // Attach user to the request object (without the password)
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next(); // Proceed to the next middleware/route handler
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else { // Added else block to handle case where no token is provided but header exists
        if (!token) {
            res.status(401).json({ message: 'Not authorized, no token' });
        }
    }
};

/**
 * @function authorize
 * @description Middleware to authorize users based on roles.
 * @param {Array<string>} roles - Array of roles allowed to access the route (e.g., ['teacher', 'admin'])
 * @returns {function} Express middleware function
 */
const authorize = (roles = []) => {
    // roles can be a single string or an array of strings
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        // req.user is set by the 'protect' middleware
        if (!req.user) {
            // This case should ideally be caught by 'protect' before 'authorize' runs,
            // but it's a good safeguard.
            return res.status(401).json({ message: 'Not authorized, user not authenticated' });
        }

        // Check if the user's role is included in the allowed roles
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `User role ${req.user.role} is not authorized to access this route.`
            });
        }

        next(); // User is authorized, proceed
    };
};

// Export both protect and authorize
export { protect, authorize };