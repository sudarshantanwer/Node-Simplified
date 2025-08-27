
const JWTUtils = require('../utils/jwtUtils');
const UserModel = require('../models/userModel');

// Import token blacklist from auth controller
let tokenBlacklist = new Set();

// Function to set blacklist reference (called from auth controller)
const setTokenBlacklist = (blacklist) => {
    tokenBlacklist = blacklist;
};

/**
 * Authentication middleware - verifies JWT tokens
 */
const authMiddleware = async (req, res, next) => {
    try {
        // Skip authentication for specific routes
        const publicRoutes = [
            '/api/auth/register',
            '/api/auth/login',
            '/api/auth/refresh',
            '/api/auth/verify'
        ];

        const currentRoute = req.path;
        
        // Skip auth for public routes
        if (publicRoutes.includes(currentRoute)) {
            return next();
        }

        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        const token = JWTUtils.extractTokenFromHeader(authHeader);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token required',
                timestamp: new Date().toISOString()
            });
        }

        // Check if token is blacklisted
        if (tokenBlacklist.has(token)) {
            return res.status(401).json({
                success: false,
                message: 'Token has been revoked',
                timestamp: new Date().toISOString()
            });
        }

        // Verify token
        const decoded = JWTUtils.verifyAccessToken(token);

        // Get user from database to ensure they still exist and are active
        const user = await UserModel.findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found or inactive',
                timestamp: new Date().toISOString()
            });
        }

        // Add user info and token to request object
        req.user = decoded;
        req.accessToken = token;
        req.userProfile = user;

        next();

    } catch (error) {
        console.error('Auth middleware error:', error);
        
        if (error.message.includes('expired')) {
            return res.status(401).json({
                success: false,
                message: 'Access token expired',
                timestamp: new Date().toISOString()
            });
        }
        
        if (error.message.includes('Invalid')) {
            return res.status(401).json({
                success: false,
                message: 'Invalid access token',
                timestamp: new Date().toISOString()
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error during authentication',
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
const optionalAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = JWTUtils.extractTokenFromHeader(authHeader);

        if (!token) {
            return next(); // Continue without authentication
        }

        // Check if token is blacklisted
        if (tokenBlacklist.has(token)) {
            return next(); // Continue without authentication
        }

        try {
            const decoded = JWTUtils.verifyAccessToken(token);
            const user = await UserModel.findById(decoded.userId);
            
            if (user) {
                req.user = decoded;
                req.userProfile = user;
                req.accessToken = token;
            }
        } catch (tokenError) {
            // Token invalid, continue without authentication
            console.log('Optional auth - invalid token:', tokenError.message);
        }

        next();

    } catch (error) {
        console.error('Optional auth middleware error:', error);
        next(); // Continue even if there's an error
    }
};

/**
 * Role-based authorization middleware
 */
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
                timestamp: new Date().toISOString()
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions',
                requiredRoles: allowedRoles,
                userRole: req.user.role,
                timestamp: new Date().toISOString()
            });
        }

        next();
    };
};

/**
 * Ownership check middleware - ensures user can only access their own resources
 */
const requireOwnership = (resourceUserIdField = 'userId') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
                timestamp: new Date().toISOString()
            });
        }

        // Admin can access all resources
        if (req.user.role === 'admin') {
            return next();
        }

        // Get resource user ID from different sources
        let resourceUserId;
        
        if (req.params[resourceUserIdField]) {
            resourceUserId = parseInt(req.params[resourceUserIdField]);
        } else if (req.body[resourceUserIdField]) {
            resourceUserId = parseInt(req.body[resourceUserIdField]);
        } else if (req.query[resourceUserIdField]) {
            resourceUserId = parseInt(req.query[resourceUserIdField]);
        }

        // If no resource user ID found, check if resource belongs to current user
        if (!resourceUserId) {
            // This middleware should be used with caution when resourceUserId is not available
            return next();
        }

        if (resourceUserId !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only access your own resources.',
                timestamp: new Date().toISOString()
            });
        }

        next();
    };
};

/**
 * Rate limiting middleware for sensitive operations
 */
const sensitiveOperationLimiter = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
    const attempts = new Map();
    
    return (req, res, next) => {
        const userId = req.user ? req.user.userId : req.ip;
        const now = Date.now();
        const userAttempts = attempts.get(userId) || { count: 0, resetTime: now + windowMs };

        // Reset counter if window has passed
        if (now > userAttempts.resetTime) {
            userAttempts.count = 0;
            userAttempts.resetTime = now + windowMs;
        }

        // Check if limit exceeded
        if (userAttempts.count >= maxAttempts) {
            const remainingTime = Math.ceil((userAttempts.resetTime - now) / 1000);
            return res.status(429).json({
                success: false,
                message: 'Too many attempts. Please try again later.',
                retryAfter: remainingTime,
                timestamp: new Date().toISOString()
            });
        }

        // Increment attempt counter
        userAttempts.count++;
        attempts.set(userId, userAttempts);

        next();
    };
};

module.exports = {
    authMiddleware,
    optionalAuthMiddleware,
    requireRole,
    requireOwnership,
    sensitiveOperationLimiter,
    setTokenBlacklist
};