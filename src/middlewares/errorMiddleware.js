const config = require('../config/environment');

/**
 * Error types for consistent error handling
 */
class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message, details = null) {
        super(message, 400);
        this.type = 'ValidationError';
        this.details = details;
    }
}

class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
        super(message, 401);
        this.type = 'AuthenticationError';
    }
}

class AuthorizationError extends AppError {
    constructor(message = 'Access denied') {
        super(message, 403);
        this.type = 'AuthorizationError';
    }
}

class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404);
        this.type = 'NotFoundError';
    }
}

class ConflictError extends AppError {
    constructor(message = 'Resource conflict') {
        super(message, 409);
        this.type = 'ConflictError';
    }
}

class RateLimitError extends AppError {
    constructor(message = 'Too many requests', retryAfter = null) {
        super(message, 429);
        this.type = 'RateLimitError';
        this.retryAfter = retryAfter;
    }
}

/**
 * Handle different types of errors and convert them to AppError
 */
const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new ValidationError(message);
};

const handleDuplicateFieldsDB = (err) => {
    const value = err.errmsg ? err.errmsg.match(/(["'])(\\?.)*?\1/)[0] : 'duplicate value';
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new ConflictError(message);
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new ValidationError(message, errors);
};

const handleJWTError = () => new AuthenticationError('Invalid token. Please log in again!');

const handleJWTExpiredError = () => new AuthenticationError('Your token has expired! Please log in again.');

const handleMulterError = (err) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
        return new ValidationError('File too large');
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
        return new ValidationError('Too many files');
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return new ValidationError('Unexpected file field');
    }
    return new ValidationError('File upload error');
};

/**
 * Send error response for development environment
 */
const sendErrorDev = (err, req, res) => {
    // API Error
    if (req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode).json({
            success: false,
            error: {
                message: err.message,
                type: err.type || 'Error',
                stack: err.stack,
                statusCode: err.statusCode,
                isOperational: err.isOperational
            },
            timestamp: new Date().toISOString()
        });
    }

    // Rendered website error (if you have frontend rendering)
    console.error('ERROR 💥', err);
    return res.status(err.statusCode).json({
        success: false,
        message: 'Something went wrong!',
        error: err.message,
        timestamp: new Date().toISOString()
    });
};

/**
 * Send error response for production environment
 */
const sendErrorProd = (err, req, res) => {
    // API Error
    if (req.originalUrl.startsWith('/api')) {
        // Operational, trusted error: send message to client
        if (err.isOperational) {
            const response = {
                success: false,
                message: err.message,
                type: err.type || 'Error',
                timestamp: new Date().toISOString()
            };

            // Add specific error details for certain error types
            if (err.type === 'ValidationError' && err.details) {
                response.details = err.details;
            }

            if (err.type === 'RateLimitError' && err.retryAfter) {
                response.retryAfter = err.retryAfter;
                res.set('Retry-After', err.retryAfter);
            }

            return res.status(err.statusCode).json(response);
        }

        // Programming or other unknown error: don't leak error details
        console.error('ERROR 💥', err);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong!',
            timestamp: new Date().toISOString()
        });
    }

    // Rendered website error
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            timestamp: new Date().toISOString()
        });
    }

    // Programming or other unknown error
    console.error('ERROR 💥', err);
    return res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        timestamp: new Date().toISOString()
    });
};

/**
 * Global error handling middleware
 */
const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (config.server.nodeEnv === 'development') {
        sendErrorDev(err, req, res);
    } else {
        let error = { ...err };
        error.message = err.message;

        // Handle specific error types
        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
        if (error.name === 'JsonWebTokenError') error = handleJWTError();
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
        if (error.name === 'MulterError') error = handleMulterError(error);

        sendErrorProd(error, req, res);
    }
};

/**
 * Handle unhandled routes
 */
const notFoundHandler = (req, res, next) => {
    const err = new NotFoundError(`Can't find ${req.originalUrl} on this server!`);
    next(err);
};

/**
 * Async error wrapper to catch async errors automatically
 */
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

/**
 * Request timeout middleware
 */
const timeoutHandler = (timeout = 30000) => {
    return (req, res, next) => {
        res.setTimeout(timeout, () => {
            const err = new AppError('Request timeout', 408);
            next(err);
        });
        next();
    };
};

/**
 * Request size limit handler
 */
const requestSizeLimitHandler = (err, req, res, next) => {
    if (err.type === 'entity.too.large') {
        const error = new ValidationError('Request entity too large');
        return next(error);
    }
    next(err);
};

/**
 * Security headers middleware
 */
const securityHeaders = (req, res, next) => {
    // Remove or modify server header
    res.removeHeader('X-Powered-By');
    
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Content Security Policy (basic)
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;");
    
    // HSTS (HTTP Strict Transport Security) for HTTPS
    if (config.security.enableHttps) {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    
    next();
};

/**
 * Log errors for monitoring
 */
const errorLogger = (err, req, res, next) => {
    // Log error details
    const errorInfo = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user ? req.user.userId : null,
        error: {
            message: err.message,
            stack: err.stack,
            statusCode: err.statusCode
        }
    };

    // Log based on error severity
    if (err.statusCode >= 500) {
        console.error('🚨 Server Error:', JSON.stringify(errorInfo, null, 2));
    } else if (err.statusCode >= 400) {
        console.warn('⚠️ Client Error:', JSON.stringify(errorInfo, null, 2));
    }

    next(err);
};

module.exports = {
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    RateLimitError,
    globalErrorHandler,
    notFoundHandler,
    catchAsync,
    timeoutHandler,
    requestSizeLimitHandler,
    securityHeaders,
    errorLogger
};
