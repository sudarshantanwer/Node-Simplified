const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Import controllers, middleware, and validators
const AuthController = require('../controllers/authController');
const { 
    authMiddleware, 
    optionalAuthMiddleware, 
    requireRole, 
    requireOwnership,
    sensitiveOperationLimiter,
    setTokenBlacklist 
} = require('../middlewares/authMiddleware');

const {
    validateRegister,
    validateLogin,
    validateRefreshToken,
    validateChangePassword,
    validateUpdateProfile,
    validateSensitiveOperation
} = require('../validations/authValidation');

// Set token blacklist reference for middleware
setTokenBlacklist(AuthController.tokenBlacklist);

// Rate limiting configurations
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later.',
        retryAfter: 900 // 15 minutes in seconds
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true // Don't count successful requests
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 registration attempts per hour
    message: {
        success: false,
        message: 'Too many registration attempts, please try again later.',
        retryAfter: 3600 // 1 hour in seconds
    },
    standardHeaders: true,
    legacyHeaders: false
});

const refreshLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // limit each IP to 10 refresh requests per 5 minutes
    message: {
        success: false,
        message: 'Too many token refresh attempts, please try again later.',
        retryAfter: 300 // 5 minutes in seconds
    },
    standardHeaders: true,
    legacyHeaders: false
});

const passwordChangeLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 password change attempts per hour
    message: {
        success: false,
        message: 'Too many password change attempts, please try again later.',
        retryAfter: 3600 // 1 hour in seconds
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Public routes (no authentication required)

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', 
    registerLimiter,
    validateRegister,
    AuthController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', 
    authLimiter,
    validateLogin,
    AuthController.login
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', 
    refreshLimiter,
    validateRefreshToken,
    AuthController.refreshToken
);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify if token is valid
 * @access  Public
 */
router.get('/verify', 
    optionalAuthMiddleware,
    AuthController.verifyToken
);

// Protected routes (authentication required)

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (invalidate tokens)
 * @access  Private
 */
router.post('/logout', 
    authMiddleware,
    AuthController.logout
);

/**
 * @route   POST /api/auth/logout-all
 * @desc    Logout from all devices
 * @access  Private
 */
router.post('/logout-all', 
    authMiddleware,
    sensitiveOperationLimiter(3, 15 * 60 * 1000), // 3 attempts per 15 minutes
    AuthController.logoutAll
);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', 
    authMiddleware,
    AuthController.getProfile
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', 
    authMiddleware,
    validateUpdateProfile,
    AuthController.updateProfile
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', 
    authMiddleware,
    passwordChangeLimiter,
    validateChangePassword,
    sensitiveOperationLimiter(3, 60 * 60 * 1000), // 3 attempts per hour
    AuthController.changePassword
);

// Admin only routes

/**
 * @route   GET /api/auth/users
 * @desc    Get all users (admin only)
 * @access  Private (Admin)
 */
router.get('/users', 
    authMiddleware,
    requireRole('admin'),
    async (req, res) => {
        try {
            const users = await require('../models/userModel').getAllUsers();
            res.json({
                success: true,
                message: 'Users retrieved successfully',
                data: { users, count: users.length },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while retrieving users',
                timestamp: new Date().toISOString()
            });
        }
    }
);

/**
 * @route   PUT /api/auth/users/:userId/deactivate
 * @desc    Deactivate user account (admin only)
 * @access  Private (Admin)
 */
router.put('/users/:userId/deactivate', 
    authMiddleware,
    requireRole('admin'),
    sensitiveOperationLimiter(5, 60 * 60 * 1000), // 5 attempts per hour
    async (req, res) => {
        try {
            const userId = parseInt(req.params.userId);
            
            if (userId === req.user.userId) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot deactivate your own account',
                    timestamp: new Date().toISOString()
                });
            }

            const UserModel = require('../models/userModel');
            const success = await UserModel.deactivateUser(userId);
            
            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                    timestamp: new Date().toISOString()
                });
            }

            res.json({
                success: true,
                message: 'User account deactivated successfully',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Deactivate user error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while deactivating user',
                timestamp: new Date().toISOString()
            });
        }
    }
);

/**
 * @route   GET /api/auth/admin/stats
 * @desc    Get authentication statistics (admin only)
 * @access  Private (Admin)
 */
router.get('/admin/stats', 
    authMiddleware,
    requireRole('admin'),
    async (req, res) => {
        try {
            const UserModel = require('../models/userModel');
            const users = await UserModel.getAllUsers();
            
            const stats = {
                totalUsers: users.length,
                activeUsers: users.filter(user => user.isActive).length,
                inactiveUsers: users.filter(user => !user.isActive).length,
                adminUsers: users.filter(user => user.role === 'admin' && user.isActive).length,
                regularUsers: users.filter(user => user.role === 'user' && user.isActive).length,
                moderatorUsers: users.filter(user => user.role === 'moderator' && user.isActive).length,
                recentRegistrations: users.filter(user => {
                    const dayAgo = new Date();
                    dayAgo.setDate(dayAgo.getDate() - 1);
                    return new Date(user.createdAt) > dayAgo;
                }).length,
                blacklistedTokens: AuthController.tokenBlacklist.size
            };

            res.json({
                success: true,
                message: 'Authentication statistics retrieved successfully',
                data: { stats },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Get auth stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while retrieving statistics',
                timestamp: new Date().toISOString()
            });
        }
    }
);

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Authentication service is healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

module.exports = router;
