/**
 * Sliding Window Rate Limiter
 * 
 * Unlike fixed window rate limiting, sliding window maintains a more precise
 * control by tracking requests in a continuous time window that slides forward.
 * This prevents the "burst at window edges" problem of fixed windows.
 */

class SlidingWindowRateLimiter {
    constructor(windowSizeMs = 60000, maxRequests = 10) {
        this.windowSizeMs = windowSizeMs;
        this.maxRequests = maxRequests;
        this.requests = new Map(); // Map of IP -> array of timestamps
    }

    // Clean up old requests outside the sliding window
    cleanupOldRequests(ip, now) {
        const requestTimes = this.requests.get(ip) || [];
        const validRequests = requestTimes.filter(time => now - time < this.windowSizeMs);
        
        if (validRequests.length === 0) {
            this.requests.delete(ip);
        } else {
            this.requests.set(ip, validRequests);
        }
        
        return validRequests;
    }

    // Check if request is allowed
    isAllowed(ip) {
        const now = Date.now();
        const validRequests = this.cleanupOldRequests(ip, now);
        
        if (validRequests.length < this.maxRequests) {
            validRequests.push(now);
            this.requests.set(ip, validRequests);
            return {
                allowed: true,
                remaining: this.maxRequests - validRequests.length,
                resetTime: now + this.windowSizeMs
            };
        }

        // Calculate when the oldest request will expire
        const oldestRequest = validRequests[0];
        const resetTime = oldestRequest + this.windowSizeMs;

        return {
            allowed: false,
            remaining: 0,
            resetTime: resetTime,
            retryAfter: Math.ceil((resetTime - now) / 1000)
        };
    }

    // Express middleware factory
    middleware() {
        return (req, res, next) => {
            const ip = req.ip || req.connection.remoteAddress;
            const result = this.isAllowed(ip);

            // Set rate limit headers
            res.set({
                'X-RateLimit-Limit': this.maxRequests,
                'X-RateLimit-Remaining': result.remaining,
                'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
                'X-RateLimit-Window': `${this.windowSizeMs}ms`
            });

            if (!result.allowed) {
                res.set('Retry-After', result.retryAfter);
                return res.status(429).json({
                    error: 'Rate limit exceeded',
                    message: 'Too many requests in sliding window',
                    type: 'sliding_window_limit',
                    retryAfter: result.retryAfter,
                    windowSize: this.windowSizeMs,
                    maxRequests: this.maxRequests
                });
            }

            next();
        };
    }
}

// Pre-configured sliding window rate limiters
const slidingWindow60Sec = new SlidingWindowRateLimiter(60000, 30); // 30 requests per minute
const slidingWindow5Min = new SlidingWindowRateLimiter(300000, 100); // 100 requests per 5 minutes
const slidingWindowStrict = new SlidingWindowRateLimiter(60000, 5); // 5 requests per minute (strict)

module.exports = {
    SlidingWindowRateLimiter,
    slidingWindow60Sec: slidingWindow60Sec.middleware(),
    slidingWindow5Min: slidingWindow5Min.middleware(),
    slidingWindowStrict: slidingWindowStrict.middleware()
};
