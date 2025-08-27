const express = require('express');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

// Import configuration
const config = require('./config/environment');

// Import routes
const todoRoutes = require('./routes/todoRoutes');
const authRoutes = require('./routes/authRoutes');

// Import middleware
const { authMiddleware } = require('./middlewares/authMiddleware');
const logMiddleware = require('./middlewares/logMiddleware');
const {
    globalErrorHandler,
    notFoundHandler,
    timeoutHandler,
    requestSizeLimitHandler,
    securityHeaders,
    errorLogger
} = require('./middlewares/errorMiddleware');

// Trust proxy if configured
if (config.security.trustProxy) {
    app.set('trust proxy', 1);
}

// Request timeout middleware
app.use(timeoutHandler(30000)); // 30 seconds timeout

// Security headers middleware
app.use(securityHeaders);

// CORS configuration
app.use(cors(config.cors));

// Body parsing middleware with size limits
app.use(express.json({ limit: config.security.maxRequestSize }));
app.use(express.urlencoded({ extended: true, limit: config.security.maxRequestSize }));

// Handle request size limit errors
app.use(requestSizeLimitHandler);

// Cookie parser middleware
app.use(cookieParser());

// Request logging middleware
app.use(logMiddleware);

// Global rate limiting
const globalLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/health' || req.path === '/api/auth/health';
    }
});

app.use(globalLimiter);

// Serve static files from public directory
app.use(express.static('public'));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/todo', authMiddleware, todoRoutes); // Protect todo routes

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Node-Simplified API is healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: config.server.nodeEnv,
        uptime: process.uptime(),
        memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100
        }
    });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
    res.json({
        success: true,
        message: 'Node-Simplified API Documentation',
        version: '1.0.0',
        baseUrl: `${req.protocol}://${req.get('host')}`,
        endpoints: {
            authentication: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                logout: 'POST /api/auth/logout',
                refresh: 'POST /api/auth/refresh',
                profile: 'GET /api/auth/profile',
                changePassword: 'PUT /api/auth/change-password'
            },
            todos: {
                getAll: 'GET /api/todo',
                getOne: 'GET /api/todo/:id',
                create: 'POST /api/todo',
                update: 'PUT /api/todo/:id',
                delete: 'DELETE /api/todo/:id',
                deleteAll: 'DELETE /api/todo',
                stats: 'GET /api/todo/stats'
            },
            admin: {
                users: 'GET /api/auth/users',
                authStats: 'GET /api/auth/admin/stats',
                allTodos: 'GET /api/todo/admin/all'
            }
        },
        authentication: {
            type: 'Bearer Token',
            header: 'Authorization: Bearer <token>',
            description: 'Include JWT token in Authorization header for protected routes'
        },
        rateLimit: {
            global: `${config.rateLimit.maxRequests} requests per ${config.rateLimit.windowMs / 1000} seconds`,
            auth: '5 requests per 15 minutes for authentication endpoints',
            registration: '3 requests per hour for registration'
        },
        timestamp: new Date().toISOString()
    });
});

// Catch 404 errors for undefined routes
app.all('*', notFoundHandler);

// Error logging middleware
app.use(errorLogger);

// Global error handling middleware (must be last)
app.use(globalErrorHandler);

module.exports = app;