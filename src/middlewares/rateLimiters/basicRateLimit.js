const rateLimit = require('express-rate-limit');

/**
 * Basic Rate Limiter using express-rate-limit
 * 
 * This is the most common and straightforward rate limiting technique.
 * It implements a fixed window approach with configurable limits.
 */

// General API Rate Limiter - 100 requests per 15 minutes
const generalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        res.status(429).json({
            error: 'Rate limit exceeded',
            message: 'Too many requests from this IP, please try again later.',
            retryAfter: Math.round(req.rateLimit.msBeforeNext / 1000) || 1,
        });
    }
});

// Strict Rate Limiter for write operations - 20 requests per 15 minutes
const strictRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 requests per windowMs
    message: {
        error: 'Too many write requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            error: 'Write operation rate limit exceeded',
            message: 'Too many write requests from this IP, please try again later.',
            retryAfter: Math.round(req.rateLimit.msBeforeNext / 1000) || 1,
        });
    }
});

// Lenient Rate Limiter for read operations - 200 requests per 15 minutes
const lenientRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 requests per windowMs
    message: {
        error: 'Too many read requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for certain conditions
        return req.ip === '127.0.0.1' && process.env.NODE_ENV === 'development';
    }
});

module.exports = {
    generalRateLimit,
    strictRateLimit,
    lenientRateLimit
};
