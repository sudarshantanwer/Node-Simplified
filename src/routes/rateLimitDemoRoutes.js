const express = require('express');
const router = express.Router();

// Import all rate limiting middleware
const { generalRateLimit, strictRateLimit, lenientRateLimit } = require('../middlewares/rateLimiters/basicRateLimit');
const { slidingWindow60Sec, slidingWindow5Min, slidingWindowStrict } = require('../middlewares/rateLimiters/slidingWindowRateLimit');
const { standardTokenBucket, burstTokenBucket, strictTokenBucket, heavyOperationLimiter } = require('../middlewares/rateLimiters/tokenBucketRateLimit');
const { fixedWindow1Min, fixedWindow5Min, apiCallsLimiter, authAttemptsLimiter } = require('../middlewares/rateLimiters/fixedWindowRateLimit');
const { basicSlowDown, aggressiveSlowDown, gentleSlowDown, standardProgressiveDelay } = require('../middlewares/rateLimiters/progressiveDelayRateLimit');
const { ipRateLimiter, geoRateLimiter } = require('../middlewares/rateLimiters/ipBasedRateLimit');
const { customSlidingWindow, customFixedWindow, customTokenBucket, userBasedLimiter, endpointSpecificLimiter } = require('../middlewares/rateLimiters/customRateLimit');

/**
 * Route-Specific Rate Limiting Demonstration
 * 
 * This router demonstrates how to apply different rate limiting
 * techniques to different types of routes based on their
 * characteristics and requirements.
 */

// =====================================
// READ OPERATIONS (More Lenient)
// =====================================

// General read endpoint with lenient limits
router.get('/data', 
    lenientRateLimit,
    gentleSlowDown,
    (req, res) => {
        res.json({
            message: 'Data retrieved successfully',
            technique: 'Lenient rate limiting with gentle slowdown',
            timestamp: new Date().toISOString(),
            rateLimit: req.rateLimit
        });
    }
);

// High-frequency read endpoint with sliding window
router.get('/stream', 
    slidingWindow60Sec,
    (req, res) => {
        res.json({
            message: 'Stream data',
            technique: 'Sliding window rate limiting (30 req/min)',
            timestamp: new Date().toISOString(),
            clientInfo: req.ipInfo
        });
    }
);

// Public API endpoint with token bucket (allows bursts)
router.get('/public-api',
    burstTokenBucket,
    (req, res) => {
        res.json({
            message: 'Public API response',
            technique: 'Token bucket (allows burst traffic)',
            timestamp: new Date().toISOString(),
            tokenBucket: req.tokenBucket
        });
    }
);

// =====================================
// WRITE OPERATIONS (More Strict)
// =====================================

// Create operations with strict limits
router.post('/create',
    strictRateLimit,
    aggressiveSlowDown,
    strictTokenBucket,
    (req, res) => {
        res.status(201).json({
            message: 'Resource created successfully',
            technique: 'Multiple strict rate limits + aggressive slowdown',
            timestamp: new Date().toISOString(),
            data: req.body
        });
    }
);

// Update operations with moderate limits
router.put('/update/:id',
    apiCallsLimiter,
    standardTokenBucket,
    (req, res) => {
        res.json({
            message: `Resource ${req.params.id} updated successfully`,
            technique: 'API calls limiter + standard token bucket',
            timestamp: new Date().toISOString(),
            data: req.body
        });
    }
);

// Delete operations with very strict limits
router.delete('/delete/:id',
    heavyOperationLimiter, // Consumes 3 tokens
    fixedWindow1Min,
    (req, res) => {
        res.json({
            message: `Resource ${req.params.id} deleted successfully`,
            technique: 'Heavy operation limiter (3 tokens) + fixed window',
            timestamp: new Date().toISOString()
        });
    }
);

// =====================================
// AUTHENTICATION ROUTES
// =====================================

// Login endpoint with auth-specific rate limiting
router.post('/auth/login',
    authAttemptsLimiter, // 5 attempts per 15 minutes
    basicSlowDown,
    (req, res) => {
        // Simulate authentication
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                error: 'Username and password required',
                technique: 'Auth rate limiting (5 attempts/15min)'
            });
        }

        // Simulate login success
        res.json({
            message: 'Login successful',
            technique: 'Authentication rate limiting with progressive slowdown',
            user: { username, id: Date.now() },
            timestamp: new Date().toISOString()
        });
    }
);

// Password reset with very strict limits
router.post('/auth/reset-password',
    slidingWindowStrict, // 5 requests per minute
    aggressiveSlowDown,
    (req, res) => {
        res.json({
            message: 'Password reset email sent',
            technique: 'Strict sliding window + aggressive slowdown',
            timestamp: new Date().toISOString()
        });
    }
);

// =====================================
// ALGORITHM-SPECIFIC DEMOS
// =====================================

// Fixed Window Algorithm Demo
router.get('/demo/fixed-window',
    fixedWindow1Min,
    (req, res) => {
        res.json({
            algorithm: 'Fixed Window',
            description: 'Resets counter at fixed intervals',
            windowInfo: req.rateLimitWindow,
            timestamp: new Date().toISOString()
        });
    }
);

// Sliding Window Algorithm Demo
router.get('/demo/sliding-window',
    customSlidingWindow,
    (req, res) => {
        res.json({
            algorithm: 'Sliding Window',
            description: 'Continuous time window that slides forward',
            rateLimit: req.rateLimit,
            timestamp: new Date().toISOString()
        });
    }
);

// Token Bucket Algorithm Demo
router.get('/demo/token-bucket',
    customTokenBucket,
    (req, res) => {
        res.json({
            algorithm: 'Token Bucket',
            description: 'Allows burst traffic up to bucket capacity',
            tokenBucket: req.tokenBucket,
            rateLimit: req.rateLimit,
            timestamp: new Date().toISOString()
        });
    }
);

// =====================================
// IP-BASED RATE LIMITING
// =====================================

// IP-based rate limiting demo
router.get('/demo/ip-based',
    ipRateLimiter,
    (req, res) => {
        res.json({
            technique: 'IP-based rate limiting with tiers',
            ipInfo: req.ipInfo,
            description: 'Different limits based on IP reputation',
            timestamp: new Date().toISOString()
        });
    }
);

// Geolocation-based rate limiting demo
router.get('/demo/geo-based',
    geoRateLimiter,
    (req, res) => {
        res.json({
            technique: 'Geolocation-based rate limiting',
            ipInfo: req.ipInfo,
            description: 'Different limits based on geographic location',
            timestamp: new Date().toISOString()
        });
    }
);

// =====================================
// PROGRESSIVE DELAY DEMOS
// =====================================

// Basic progressive delay
router.get('/demo/progressive-delay',
    standardProgressiveDelay,
    (req, res) => {
        res.json({
            technique: 'Progressive Delay',
            description: 'Gradually increases response delay instead of blocking',
            timestamp: new Date().toISOString()
        });
    }
);

// =====================================
// COMBINED TECHNIQUES
// =====================================

// Multi-layer protection
router.post('/protected/multi-layer',
    generalRateLimit,        // Basic rate limit
    ipRateLimiter,          // IP-based limits
    slidingWindow5Min,      // Sliding window
    basicSlowDown,          // Progressive delay
    (req, res) => {
        res.status(201).json({
            message: 'Multi-layer protection endpoint',
            technique: 'Combines multiple rate limiting techniques',
            description: 'Basic + IP-based + Sliding window + Progressive delay',
            timestamp: new Date().toISOString(),
            layers: [
                'General rate limit (100 req/15min)',
                'IP-based rate limiting',
                'Sliding window (100 req/5min)',
                'Progressive delay (20+ requests)'
            ]
        });
    }
);

// User-based rate limiting (requires mock user)
router.get('/demo/user-based',
    (req, res, next) => {
        // Mock user authentication
        req.user = {
            id: req.headers['x-user-id'] || 'anonymous',
            tier: req.headers['x-user-tier'] || 'standard'
        };
        next();
    },
    userBasedLimiter,
    (req, res) => {
        res.json({
            technique: 'User-based rate limiting',
            user: req.user,
            description: 'Different limits per authenticated user',
            rateLimit: req.rateLimit,
            timestamp: new Date().toISOString()
        });
    }
);

// Endpoint-specific rate limiting
router.get('/demo/endpoint-specific',
    endpointSpecificLimiter,
    (req, res) => {
        res.json({
            technique: 'Endpoint-specific rate limiting',
            endpoint: `${req.method} ${req.path}`,
            description: 'Rate limits specific to this exact endpoint',
            rateLimit: req.rateLimit,
            timestamp: new Date().toISOString()
        });
    }
);

// =====================================
// MONITORING AND STATISTICS
// =====================================

// Get rate limiting statistics
router.get('/stats', (req, res) => {
    const { instances: ipInstances } = require('../middlewares/rateLimiters/ipBasedRateLimit');
    const { instances: fixedWindowInstances } = require('../middlewares/rateLimiters/fixedWindowRateLimit');
    const { instances: customInstances } = require('../middlewares/rateLimiters/customRateLimit');
    const { instances: progressiveInstances } = require('../middlewares/rateLimiters/progressiveDelayRateLimit');

    const stats = {
        timestamp: new Date().toISOString(),
        ipBasedStats: ipInstances.ipRateLimiter.getOverallStats(),
        fixedWindowStats: {
            fixedWindow1Min: fixedWindowInstances.fixedWindow1Min.getStats(),
            apiCallsLimiter: fixedWindowInstances.apiCallsLimiter.getStats()
        },
        customStats: {
            customSlidingWindow: customInstances.customSlidingWindow.getStats(),
            customFixedWindow: customInstances.customFixedWindow.getStats(),
            customTokenBucket: customInstances.customTokenBucket.getStats()
        },
        progressiveDelayStats: {
            standard: progressiveInstances.standardProgressiveDelay.getStats(),
            adaptive: progressiveInstances.adaptiveDelay.getStats()
        }
    };

    res.json(stats);
});

// Health check endpoint (no rate limiting)
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        message: 'Rate limiting demo service is running'
    });
});

module.exports = router;
