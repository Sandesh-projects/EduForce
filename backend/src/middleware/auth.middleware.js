// backend/middleware/auth.middleware.js
import jwt from 'jsonwebtoken';
import User from '../models/auth.model.js'; // Ensure this path is correct for your User model

/**
 * @function authenticateUser
 * @description Middleware to verify JWT token and attach user data to the request.
 * Ensures the user is logged in before accessing protected routes.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const authenticateUser = async (req, res, next) => {
    let token;

    // Check if Authorization header exists and starts with 'Bearer'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
            
            console.log('--- Auth Middleware (authenticateUser) ---');
            console.log('Decoded Token ID:', decodedToken.id);

            // Find the user by ID and exclude the password
            const user = await User.findById(decodedToken.id).select('-password');
            
            if (!user) {
                console.log('Authentication Denied: User not found for ID:', decodedToken.id);
                return res.status(401).json({ message: 'Authentication failed: User not found.' });
            }

            req.user = user;
            console.log('User Authenticated. User ID:', req.user._id, 'Role:', req.user.role);
            console.log('------------------------------------------');
            next(); // Proceed if authenticated

        } catch (error) {
            console.error('--- Auth Middleware (authenticateUser) Error ---');
            console.error('Token verification failed or user lookup error:', error.message);
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Authentication failed: Token has expired.' });
            }
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Authentication failed: Invalid token.' });
            }
            res.status(401).json({ message: 'Authentication failed: Token invalid or missing.' });
        }
    } else {
        console.log('--- Auth Middleware (authenticateUser) ---');
        console.log('Authentication Denied: No token found in Authorization header.');
        console.log('------------------------------------------');
        res.status(401).json({ message: 'Authentication required: No token provided.' });
    }
};

/**
 * @function restrictToRoles
 * @description Middleware to authorize users based on a list of allowed roles.
 * Must be used after authenticateUser to ensure req.user is populated.
 * @param {Array<string>} allowedRoles - Array of roles allowed to access the route
 * @returns {function} Express middleware function
 */
const restrictToRoles = (allowedRoles = []) => {
    if (typeof allowedRoles === 'string') {
        allowedRoles = [allowedRoles];
    }
    console.log(`[Authorization Middleware Factory] Initialized for roles: ${JSON.stringify(allowedRoles)}`);

    return (req, res, next) => {
        console.log('--- Auth Middleware (restrictToRoles) ---');
        console.log('Allowed roles for this route:', allowedRoles);
        
        if (!req.user || !req.user.role) {
            console.log('Authorization Denied: User or user role is missing from req.user.');
            return res.status(403).json({ message: 'Authorization failed: User role information unavailable.' });
        }

        console.log('User\'s current role:', req.user.role);

        if (!allowedRoles.includes(req.user.role)) {
            console.log(`Authorization DENIED: User role '${req.user.role}' is not among allowed roles.`);
            console.log('-------------------------------------------');
            return res.status(403).json({
                message: `Access forbidden: Your role (${req.user.role}) is not authorized for this action.`
            });
        }

        console.log(`Authorization Granted for role: '${req.user.role}'.`);
        console.log('-------------------------------------------');
        next();
    };
};

/**
 * @function allowAuthenticated
 * @description Middleware that only checks if a user is authenticated (has a valid token).
 * It does NOT check roles, simply passes the request along if authenticated.
 * Used for routes where any logged-in user is allowed.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const allowAuthenticated = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
            const user = await User.findById(decodedToken.id).select('-password');

            if (!user) {
                console.log('Authentication (allowAuthenticated) Denied: User not found for ID:', decodedToken.id);
                return res.status(401).json({ message: 'Authentication failed: User not found.' });
            }

            req.user = user; // Attach user data
            console.log('--- Auth Middleware (allowAuthenticated) ---');
            console.log('User Authenticated (no role check). User ID:', req.user._id, 'Role:', req.user.role);
            console.log('------------------------------------------');
            next(); // Crucially, always proceed if authentication is successful
        } catch (error) {
            console.error('--- Auth Middleware (allowAuthenticated) Error ---');
            console.error('Token validation failed:', error.message);
            res.status(401).json({ message: 'Authentication required: Invalid or expired token.' });
        }
    } else {
        console.log('--- Auth Middleware (allowAuthenticated) ---');
        console.log('Authentication (allowAuthenticated) Denied: No token found.');
        console.log('------------------------------------------');
        res.status(401).json({ message: 'Authentication required: No token provided.' });
    }
};

// Export all middleware functions
export { authenticateUser, restrictToRoles, allowAuthenticated };
