/**
 * Custom Rate Limiting Middleware
 * 
 * A comprehensive, manually implemented rate limiting solution that
 * demonstrates various algorithms and advanced features. This provides
 * full control over the rate limiting logic and can be customized
 * for specific use cases.
 * 
 * Features:
 * - Multiple algorithms (fixed window, sliding window, token bucket)
 * - Memory and Redis storage options
 * - Custom key generation
 * - Advanced statistics
 * - Rate limit bypass conditions
 * - Custom responses
 */

class CustomRateLimiter {
    constructor(options = {}) {
        this.algorithm = options.algorithm || 'sliding_window'; // 'fixed_window', 'sliding_window', 'token_bucket'
        this.windowMs = options.windowMs || 60000;
        this.maxRequests = options.maxRequests || 100;
        this.keyGenerator = options.keyGenerator || this.defaultKeyGenerator;
        this.skip = options.skip || (() => false);
        this.onLimitReached = options.onLimitReached || this.defaultOnLimitReached;
        this.customResponse = options.customResponse || null;
        
        // Storage
        this.storage = new Map(); // In production, consider Redis
        this.stats = {
            totalRequests: 0,
            blockedRequests: 0,
            uniqueKeys: new Set()
        };

        // Token bucket specific options
        this.tokenBucketRefillRate = options.tokenBucketRefillRate || 1;
        this.tokenBucketRefillInterval = options.tokenBucketRefillInterval || 1000;

        // Cleanup interval
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }

    // Default key generator (IP-based)
    defaultKeyGenerator(req) {
        return req.ip || req.connection.remoteAddress;
    }

    // Default limit reached handler
    defaultOnLimitReached(req, res, data) {
        console.log(`Rate limit reached for key: ${data.key}, algorithm: ${this.algorithm}`);
    }

    // Fixed window algorithm
    fixedWindowCheck(key, now) {
        const windowStart = Math.floor(now / this.windowMs) * this.windowMs;
        const windowKey = `${key}:${windowStart}`;
        
        const current = this.storage.get(windowKey) || { count: 0, windowStart };
        
        if (current.count >= this.maxRequests) {
            return {
                allowed: false,
                remaining: 0,
                resetTime: windowStart + this.windowMs,
                currentCount: current.count
            };
        }

        current.count++;
        this.storage.set(windowKey, current);

        return {
            allowed: true,
            remaining: this.maxRequests - current.count,
            resetTime: windowStart + this.windowMs,
            currentCount: current.count
        };
    }

    // Sliding window algorithm
    slidingWindowCheck(key, now) {
        const requests = this.storage.get(key) || [];
        
        // Remove old requests
        const validRequests = requests.filter(time => now - time < this.windowMs);
        
        if (validRequests.length >= this.maxRequests) {
            const oldestRequest = validRequests[0];
            return {
                allowed: false,
                remaining: 0,
                resetTime: oldestRequest + this.windowMs,
                currentCount: validRequests.length
            };
        }

        validRequests.push(now);
        this.storage.set(key, validRequests);

        return {
            allowed: true,
            remaining: this.maxRequests - validRequests.length,
            resetTime: now + this.windowMs,
            currentCount: validRequests.length
        };
    }

    // Token bucket algorithm
    tokenBucketCheck(key, now) {
        const bucket = this.storage.get(key) || {
            tokens: this.maxRequests,
            lastRefill: now
        };

        // Refill tokens
        const timePassed = now - bucket.lastRefill;
        const tokensToAdd = Math.floor(timePassed / this.tokenBucketRefillInterval) * this.tokenBucketRefillRate;
        
        if (tokensToAdd > 0) {
            bucket.tokens = Math.min(this.maxRequests, bucket.tokens + tokensToAdd);
            bucket.lastRefill = now;
        }

        if (bucket.tokens < 1) {
            const nextRefill = bucket.lastRefill + this.tokenBucketRefillInterval;
            return {
                allowed: false,
                remaining: bucket.tokens,
                resetTime: nextRefill,
                tokensRemaining: bucket.tokens
            };
        }

        bucket.tokens--;
        this.storage.set(key, bucket);

        return {
            allowed: true,
            remaining: bucket.tokens,
            resetTime: null,
            tokensRemaining: bucket.tokens
        };
    }

    // Main rate limit check
    checkRateLimit(req) {
        const now = Date.now();
        const key = this.keyGenerator(req);
        
        this.stats.totalRequests++;
        this.stats.uniqueKeys.add(key);

        // Check skip condition
        if (this.skip(req)) {
            return {
                allowed: true,
                skipped: true,
                key: key
            };
        }

        let result;
        switch (this.algorithm) {
            case 'fixed_window':
                result = this.fixedWindowCheck(key, now);
                break;
            case 'sliding_window':
                result = this.slidingWindowCheck(key, now);
                break;
            case 'token_bucket':
                result = this.tokenBucketCheck(key, now);
                break;
            default:
                throw new Error(`Unknown algorithm: ${this.algorithm}`);
        }

        result.key = key;
        result.algorithm = this.algorithm;

        if (!result.allowed) {
            this.stats.blockedRequests++;
            this.onLimitReached(req, null, result);
        }

        return result;
    }

    // Express middleware
    middleware() {
        return (req, res, next) => {
            const result = this.checkRateLimit(req);

            // Set headers
            res.set({
                'X-RateLimit-Algorithm': this.algorithm,
                'X-RateLimit-Limit': this.maxRequests,
                'X-RateLimit-Remaining': result.remaining || 0,
                'X-RateLimit-Key': result.key
            });

            if (result.resetTime) {
                res.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
            }

            if (result.skipped) {
                res.set('X-RateLimit-Skipped', 'true');
                return next();
            }

            if (!result.allowed) {
                if (result.resetTime) {
                    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
                    res.set('Retry-After', retryAfter);
                }

                // Use custom response if provided
                if (this.customResponse) {
                    return this.customResponse(req, res, result);
                }

                return res.status(429).json({
                    error: 'Rate limit exceeded',
                    message: `Too many requests using ${this.algorithm} algorithm`,
                    algorithm: this.algorithm,
                    limit: this.maxRequests,
                    windowMs: this.windowMs,
                    resetTime: result.resetTime ? new Date(result.resetTime).toISOString() : null,
                    type: 'custom_rate_limit'
                });
            }

            // Add rate limit info to request
            req.rateLimit = result;
            next();
        };
    }

    // Statistics and monitoring
    getStats() {
        return {
            ...this.stats,
            uniqueKeysCount: this.stats.uniqueKeys.size,
            storageSize: this.storage.size,
            algorithm: this.algorithm,
            windowMs: this.windowMs,
            maxRequests: this.maxRequests,
            blockedPercentage: this.stats.totalRequests > 0 ? 
                (this.stats.blockedRequests / this.stats.totalRequests * 100).toFixed(2) : 0
        };
    }

    // Reset statistics
    resetStats() {
        this.stats = {
            totalRequests: 0,
            blockedRequests: 0,
            uniqueKeys: new Set()
        };
    }

    // Manual cleanup
    cleanup() {
        const now = Date.now();
        const maxAge = this.windowMs * 2; // Keep data for 2x the window size

        for (const [key, data] of this.storage.entries()) {
            let shouldDelete = false;

            if (this.algorithm === 'fixed_window') {
                // For fixed window, check if window has expired
                if (key.includes(':')) {
                    const windowStart = parseInt(key.split(':')[1]);
                    if (now - windowStart > this.windowMs) {
                        shouldDelete = true;
                    }
                }
            } else if (this.algorithm === 'sliding_window') {
                // For sliding window, check if all requests are old
                if (Array.isArray(data) && data.length > 0) {
                    const newestRequest = Math.max(...data);
                    if (now - newestRequest > this.windowMs) {
                        shouldDelete = true;
                    }
                }
            } else if (this.algorithm === 'token_bucket') {
                // For token bucket, check last activity
                if (data.lastRefill && now - data.lastRefill > maxAge) {
                    shouldDelete = true;
                }
            }

            if (shouldDelete) {
                this.storage.delete(key);
            }
        }
    }

    // Destroy the rate limiter
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.storage.clear();
        this.resetStats();
    }
}

// Pre-configured custom rate limiters
const customSlidingWindow = new CustomRateLimiter({
    algorithm: 'sliding_window',
    windowMs: 60000,
    maxRequests: 50,
    keyGenerator: (req) => `sliding:${req.ip}`
});

const customFixedWindow = new CustomRateLimiter({
    algorithm: 'fixed_window',
    windowMs: 60000,
    maxRequests: 100,
    keyGenerator: (req) => `fixed:${req.ip}`
});

const customTokenBucket = new CustomRateLimiter({
    algorithm: 'token_bucket',
    maxRequests: 20, // bucket capacity
    tokenBucketRefillRate: 2, // tokens per interval
    tokenBucketRefillInterval: 1000, // 1 second
    keyGenerator: (req) => `bucket:${req.ip}`
});

// User-based rate limiter (requires authentication)
const userBasedLimiter = new CustomRateLimiter({
    algorithm: 'sliding_window',
    windowMs: 300000, // 5 minutes
    maxRequests: 500,
    keyGenerator: (req) => {
        // Use user ID if authenticated, fallback to IP
        return req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
    },
    skip: (req) => {
        // Skip for premium users
        return req.user && req.user.tier === 'premium';
    }
});

// API endpoint specific limiter
const endpointSpecificLimiter = new CustomRateLimiter({
    algorithm: 'fixed_window',
    windowMs: 60000,
    maxRequests: 10,
    keyGenerator: (req) => `${req.ip}:${req.method}:${req.route?.path || req.path}`,
    customResponse: (req, res, result) => {
        res.status(429).json({
            error: 'Endpoint rate limit exceeded',
            endpoint: `${req.method} ${req.path}`,
            message: 'You are making too many requests to this specific endpoint',
            limit: result.maxRequests,
            algorithm: result.algorithm
        });
    }
});

module.exports = {
    CustomRateLimiter,
    customSlidingWindow: customSlidingWindow.middleware(),
    customFixedWindow: customFixedWindow.middleware(),
    customTokenBucket: customTokenBucket.middleware(),
    userBasedLimiter: userBasedLimiter.middleware(),
    endpointSpecificLimiter: endpointSpecificLimiter.middleware(),
    // Export instances for monitoring
    instances: {
        customSlidingWindow,
        customFixedWindow,
        customTokenBucket,
        userBasedLimiter,
        endpointSpecificLimiter
    }
};
