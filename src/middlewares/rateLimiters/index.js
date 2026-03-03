/**
 * Rate Limiting Middleware Collection
 * 
 * This file exports all rate limiting middleware and provides
 * easy access to different rate limiting strategies.
 * 
 * Available Techniques:
 * 1. Basic Rate Limiting (express-rate-limit)
 * 2. Sliding Window Rate Limiting
 * 3. Token Bucket Rate Limiting
 * 4. Fixed Window Rate Limiting
 * 5. Progressive Delay Rate Limiting
 * 6. IP-based Rate Limiting with Tiers
 * 7. Custom Rate Limiting Middleware
 */

// Import all rate limiting modules
const basicRateLimit = require('./basicRateLimit');
const slidingWindowRateLimit = require('./slidingWindowRateLimit');
const tokenBucketRateLimit = require('./tokenBucketRateLimit');
const fixedWindowRateLimit = require('./fixedWindowRateLimit');
const progressiveDelayRateLimit = require('./progressiveDelayRateLimit');
const ipBasedRateLimit = require('./ipBasedRateLimit');
const customRateLimit = require('./customRateLimit');

/**
 * Rate Limiting Strategies Overview:
 * 
 * 1. BASIC RATE LIMITING
 *    - Uses express-rate-limit package
 *    - Simple fixed window approach
 *    - Good for general purpose rate limiting
 * 
 * 2. SLIDING WINDOW
 *    - More precise than fixed window
 *    - Prevents burst at window edges
 *    - Better for API endpoints
 * 
 * 3. TOKEN BUCKET
 *    - Allows burst traffic
 *    - Good user experience
 *    - Suitable for variable load patterns
 * 
 * 4. FIXED WINDOW
 *    - Simple and memory efficient
 *    - Predictable reset times
 *    - Good for reporting and monitoring
 * 
 * 5. PROGRESSIVE DELAY
 *    - Graceful degradation
 *    - Better than hard blocks
 *    - Good for user-facing applications
 * 
 * 6. IP-BASED LIMITING
 *    - Tier-based access control
 *    - Whitelist/blacklist support
 *    - Geographic restrictions
 * 
 * 7. CUSTOM RATE LIMITING
 *    - Full control over logic
 *    - Multiple algorithms in one
 *    - Advanced statistics and monitoring
 */

// ===========================================
// EXPORTED MIDDLEWARE FOR COMMON USE CASES
// ===========================================

module.exports = {
    // Basic rate limiting (express-rate-limit)
    basic: {
        general: basicRateLimit.generalRateLimit,
        strict: basicRateLimit.strictRateLimit,
        lenient: basicRateLimit.lenientRateLimit
    },

    // Sliding window rate limiting
    slidingWindow: {
        oneMinute: slidingWindowRateLimit.slidingWindow60Sec,
        fiveMinutes: slidingWindowRateLimit.slidingWindow5Min,
        strict: slidingWindowRateLimit.slidingWindowStrict
    },

    // Token bucket rate limiting
    tokenBucket: {
        standard: tokenBucketRateLimit.standardTokenBucket,
        burst: tokenBucketRateLimit.burstTokenBucket,
        strict: tokenBucketRateLimit.strictTokenBucket,
        heavyOperation: tokenBucketRateLimit.heavyOperationLimiter
    },

    // Fixed window rate limiting
    fixedWindow: {
        oneMinute: fixedWindowRateLimit.fixedWindow1Min,
        fiveMinutes: fixedWindowRateLimit.fixedWindow5Min,
        oneHour: fixedWindowRateLimit.fixedWindow1Hour,
        strict: fixedWindowRateLimit.fixedWindowStrict,
        apiCalls: fixedWindowRateLimit.apiCallsLimiter,
        authAttempts: fixedWindowRateLimit.authAttemptsLimiter,
        heavyQueries: fixedWindowRateLimit.heavyQueriesLimiter
    },

    // Progressive delay rate limiting
    progressiveDelay: {
        basic: progressiveDelayRateLimit.basicSlowDown,
        aggressive: progressiveDelayRateLimit.aggressiveSlowDown,
        gentle: progressiveDelayRateLimit.gentleSlowDown,
        standard: progressiveDelayRateLimit.standardProgressiveDelay,
        strict: progressiveDelayRateLimit.strictProgressiveDelay,
        adaptive: progressiveDelayRateLimit.adaptiveDelay
    },

    // IP-based rate limiting
    ipBased: {
        standard: ipBasedRateLimit.ipRateLimiter,
        geographic: ipBasedRateLimit.geoRateLimiter
    },

    // Custom rate limiting
    custom: {
        slidingWindow: customRateLimit.customSlidingWindow,
        fixedWindow: customRateLimit.customFixedWindow,
        tokenBucket: customRateLimit.customTokenBucket,
        userBased: customRateLimit.userBasedLimiter,
        endpointSpecific: customRateLimit.endpointSpecificLimiter
    },

    // ===========================================
    // CONVENIENCE COMBINATIONS
    // ===========================================

    // Common combinations for different use cases
    combinations: {
        // For public APIs
        publicAPI: [
            basicRateLimit.generalRateLimit,
            progressiveDelayRateLimit.gentleSlowDown
        ],

        // For write operations
        writeOperations: [
            basicRateLimit.strictRateLimit,
            tokenBucketRateLimit.strictTokenBucket,
            progressiveDelayRateLimit.aggressiveSlowDown
        ],

        // For authentication endpoints
        authentication: [
            fixedWindowRateLimit.authAttemptsLimiter,
            progressiveDelayRateLimit.basicSlowDown,
            ipBasedRateLimit.ipRateLimiter
        ],

        // For read operations
        readOperations: [
            basicRateLimit.lenientRateLimit,
            progressiveDelayRateLimit.gentleSlowDown
        ],

        // For high-security endpoints
        highSecurity: [
            slidingWindowRateLimit.slidingWindowStrict,
            ipBasedRateLimit.ipRateLimiter,
            progressiveDelayRateLimit.aggressiveSlowDown
        ]
    },

    // ===========================================
    // CLASS CONSTRUCTORS FOR CUSTOM INSTANCES
    // ===========================================

    // Export classes for creating custom instances
    classes: {
        SlidingWindowRateLimiter: slidingWindowRateLimit.SlidingWindowRateLimiter,
        TokenBucket: tokenBucketRateLimit.TokenBucket,
        TokenBucketRateLimiter: tokenBucketRateLimit.TokenBucketRateLimiter,
        FixedWindowRateLimiter: fixedWindowRateLimit.FixedWindowRateLimiter,
        CustomProgressiveDelay: progressiveDelayRateLimit.CustomProgressiveDelay,
        AdaptiveProgressiveDelay: progressiveDelayRateLimit.AdaptiveProgressiveDelay,
        IPBasedRateLimiter: ipBasedRateLimit.IPBasedRateLimiter,
        GeolocationRateLimiter: ipBasedRateLimit.GeolocationRateLimiter,
        CustomRateLimiter: customRateLimit.CustomRateLimiter
    },

    // ===========================================
    // MONITORING AND STATISTICS
    // ===========================================

    // Get instances for monitoring
    instances: {
        ipBased: ipBasedRateLimit.instances,
        fixedWindow: fixedWindowRateLimit.instances,
        custom: customRateLimit.instances,
        progressiveDelay: progressiveDelayRateLimit.instances
    },

    // ===========================================
    // UTILITY FUNCTIONS
    // ===========================================

    utils: {
        // Apply multiple rate limiters in sequence
        chain: (...middlewares) => {
            return (req, res, next) => {
                let index = 0;
                
                const runNext = (err) => {
                    if (err) return next(err);
                    
                    if (index >= middlewares.length) {
                        return next();
                    }
                    
                    const middleware = middlewares[index++];
                    middleware(req, res, runNext);
                };
                
                runNext();
            };
        },

        // Apply rate limiters in parallel (first to fail wins)
        parallel: (...middlewares) => {
            return (req, res, next) => {
                let completed = 0;
                let failed = false;
                
                middlewares.forEach(middleware => {
                    middleware(req, res, (err) => {
                        if (failed) return;
                        
                        if (err) {
                            failed = true;
                            return next(err);
                        }
                        
                        completed++;
                        if (completed === middlewares.length) {
                            next();
                        }
                    });
                });
            };
        },

        // Conditional rate limiting
        conditional: (condition, middleware) => {
            return (req, res, next) => {
                if (condition(req)) {
                    middleware(req, res, next);
                } else {
                    next();
                }
            };
        }
    }
};

// ===========================================
// USAGE EXAMPLES
// ===========================================

/*
// Example 1: Basic usage
app.use('/api', rateLimiters.basic.general);

// Example 2: Chaining multiple rate limiters
app.use('/api/write', rateLimiters.utils.chain(
    rateLimiters.basic.strict,
    rateLimiters.progressiveDelay.aggressive
));

// Example 3: Conditional rate limiting
app.use('/api/premium', rateLimiters.utils.conditional(
    (req) => req.user.tier !== 'premium',
    rateLimiters.basic.general
));

// Example 4: Using predefined combinations
app.use('/auth', ...rateLimiters.combinations.authentication);

// Example 5: Creating custom instances
const customLimiter = new rateLimiters.classes.CustomRateLimiter({
    algorithm: 'sliding_window',
    windowMs: 120000,
    maxRequests: 200
});
app.use('/custom', customLimiter.middleware());
*/
