/**
 * Fixed Window Rate Limiter
 * 
 * Fixed window rate limiting divides time into fixed intervals (windows)
 * and allows a certain number of requests per window. At the start of each
 * new window, the counter resets.
 * 
 * Characteristics:
 * - Simple to understand and implement
 * - Memory efficient
 * - Can allow bursts at window boundaries
 * - Predictable reset times
 */

class FixedWindowRateLimiter {
    constructor(windowSizeMs = 60000, maxRequests = 10) {
        this.windowSizeMs = windowSizeMs;
        this.maxRequests = maxRequests;
        this.windows = new Map(); // Map of IP -> { count, windowStart }
    }

    // Get current window start time
    getCurrentWindowStart(now = Date.now()) {
        return Math.floor(now / this.windowSizeMs) * this.windowSizeMs;
    }

    // Get window info for IP
    getWindow(ip, now = Date.now()) {
        const windowStart = this.getCurrentWindowStart(now);
        const existing = this.windows.get(ip);

        // If no window exists or it's a new window, reset
        if (!existing || existing.windowStart < windowStart) {
            const newWindow = {
                count: 0,
                windowStart: windowStart,
                windowEnd: windowStart + this.windowSizeMs
            };
            this.windows.set(ip, newWindow);
            return newWindow;
        }

        return existing;
    }

    // Check if request is allowed and increment counter
    isAllowed(ip) {
        const now = Date.now();
        const window = this.getWindow(ip, now);

        if (window.count < this.maxRequests) {
            window.count++;
            this.windows.set(ip, window);

            return {
                allowed: true,
                remaining: this.maxRequests - window.count,
                resetTime: window.windowEnd,
                windowStart: window.windowStart,
                currentCount: window.count
            };
        }

        return {
            allowed: false,
            remaining: 0,
            resetTime: window.windowEnd,
            windowStart: window.windowStart,
            currentCount: window.count,
            retryAfter: Math.ceil((window.windowEnd - now) / 1000)
        };
    }

    // Clean up old windows
    cleanup() {
        const now = Date.now();
        const currentWindowStart = this.getCurrentWindowStart(now);

        for (const [ip, window] of this.windows.entries()) {
            if (window.windowStart < currentWindowStart) {
                this.windows.delete(ip);
            }
        }
    }

    // Express middleware factory
    middleware() {
        // Cleanup old windows every 2 window periods
        setInterval(() => this.cleanup(), this.windowSizeMs * 2);

        return (req, res, next) => {
            const ip = req.ip || req.connection.remoteAddress;
            const result = this.isAllowed(ip);

            // Set rate limit headers
            res.set({
                'X-RateLimit-Limit': this.maxRequests,
                'X-RateLimit-Remaining': result.remaining,
                'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
                'X-RateLimit-Window-Size': `${this.windowSizeMs}ms`,
                'X-RateLimit-Window-Start': new Date(result.windowStart).toISOString(),
                'X-RateLimit-Type': 'fixed_window'
            });

            if (!result.allowed) {
                res.set('Retry-After', result.retryAfter);
                return res.status(429).json({
                    error: 'Rate limit exceeded',
                    message: 'Fixed window rate limit exceeded',
                    type: 'fixed_window_limit',
                    currentCount: result.currentCount,
                    maxRequests: this.maxRequests,
                    windowSizeMs: this.windowSizeMs,
                    windowStart: new Date(result.windowStart).toISOString(),
                    resetTime: new Date(result.resetTime).toISOString(),
                    retryAfter: result.retryAfter
                });
            }

            // Add window info to request for debugging
            req.rateLimitWindow = {
                type: 'fixed_window',
                remaining: result.remaining,
                resetTime: result.resetTime,
                windowStart: result.windowStart
            };

            next();
        };
    }

    // Get statistics for monitoring
    getStats() {
        const now = Date.now();
        const currentWindowStart = this.getCurrentWindowStart(now);
        let totalActiveIPs = 0;
        let totalCurrentRequests = 0;

        for (const [ip, window] of this.windows.entries()) {
            if (window.windowStart === currentWindowStart) {
                totalActiveIPs++;
                totalCurrentRequests += window.count;
            }
        }

        return {
            activeIPs: totalActiveIPs,
            totalCurrentRequests: totalCurrentRequests,
            maxRequestsPerWindow: this.maxRequests,
            windowSizeMs: this.windowSizeMs,
            currentWindowStart: new Date(currentWindowStart).toISOString()
        };
    }
}

// Pre-configured fixed window rate limiters
const fixedWindow1Min = new FixedWindowRateLimiter(60000, 60); // 60 requests per minute
const fixedWindow5Min = new FixedWindowRateLimiter(300000, 200); // 200 requests per 5 minutes
const fixedWindow1Hour = new FixedWindowRateLimiter(3600000, 1000); // 1000 requests per hour
const fixedWindowStrict = new FixedWindowRateLimiter(60000, 10); // 10 requests per minute (strict)

// Specific use cases
const apiCallsLimiter = new FixedWindowRateLimiter(60000, 100); // API calls: 100/min
const authAttemptsLimiter = new FixedWindowRateLimiter(900000, 5); // Auth attempts: 5 per 15 min
const heavyQueriesLimiter = new FixedWindowRateLimiter(300000, 10); // Heavy queries: 10 per 5 min

module.exports = {
    FixedWindowRateLimiter,
    fixedWindow1Min: fixedWindow1Min.middleware(),
    fixedWindow5Min: fixedWindow5Min.middleware(),
    fixedWindow1Hour: fixedWindow1Hour.middleware(),
    fixedWindowStrict: fixedWindowStrict.middleware(),
    apiCallsLimiter: apiCallsLimiter.middleware(),
    authAttemptsLimiter: authAttemptsLimiter.middleware(),
    heavyQueriesLimiter: heavyQueriesLimiter.middleware(),
    // Export instances for stats monitoring
    instances: {
        fixedWindow1Min,
        fixedWindow5Min,
        fixedWindow1Hour,
        fixedWindowStrict,
        apiCallsLimiter,
        authAttemptsLimiter,
        heavyQueriesLimiter
    }
};
