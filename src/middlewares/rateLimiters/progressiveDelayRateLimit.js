const slowDown = require('express-slow-down');

/**
 * Progressive Delay Rate Limiter
 * 
 * Instead of immediately blocking requests when limits are exceeded,
 * this technique gradually increases response delays. This provides
 * a more graceful degradation of service and can deter abuse while
 * still allowing legitimate users to complete their requests.
 * 
 * Benefits:
 * - Graceful degradation instead of hard blocks
 * - Can deter automated abuse
 * - Better user experience for legitimate users
 * - Configurable delay strategies
 */

// Basic progressive delay - starts slowing down after threshold
const basicSlowDown = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 20, // Allow 20 requests per windowMs without delay
    delayMs: (used, req) => {
        // Progressive delay: 100ms * (requests over limit)
        const excess = used - 20;
        return Math.min(excess * 100, 2000); // Cap at 2 seconds
    },
    maxDelayMs: 2000, // Maximum delay of 2 seconds
    skipFailedRequests: false, // Don't skip failed requests
    skipSuccessfulRequests: false, // Don't skip successful requests
    onLimitReached: (req, res, options) => {
        console.log(`Progressive delay limit reached for IP: ${req.ip}`);
    }
});

// Aggressive slowdown for write operations
const aggressiveSlowDown = slowDown({
    windowMs: 10 * 60 * 1000, // 10 minutes
    delayAfter: 5, // Allow only 5 requests without delay
    delayMs: (used, req) => {
        // Exponential delay for write operations
        const excess = used - 5;
        return Math.min(Math.pow(2, excess) * 200, 10000); // Exponential growth, cap at 10 seconds
    },
    maxDelayMs: 10000, // Maximum delay of 10 seconds
    skipFailedRequests: true, // Skip failed requests (don't penalize errors)
    skipSuccessfulRequests: false,
    onLimitReached: (req, res, options) => {
        console.log(`Aggressive slowdown triggered for IP: ${req.ip}, method: ${req.method}`);
    }
});

// Gentle slowdown for read operations
const gentleSlowDown = slowDown({
    windowMs: 5 * 60 * 1000, // 5 minutes
    delayAfter: 50, // Allow 50 requests without delay
    delayMs: (used, req) => {
        // Linear delay for read operations
        const excess = used - 50;
        return Math.min(excess * 50, 1000); // Linear growth, cap at 1 second
    },
    maxDelayMs: 1000, // Maximum delay of 1 second
    skipFailedRequests: true,
    skipSuccessfulRequests: false
});

// Custom progressive delay middleware
class CustomProgressiveDelay {
    constructor(options = {}) {
        this.windowMs = options.windowMs || 60000;
        this.threshold = options.threshold || 10;
        this.baseDelay = options.baseDelay || 100;
        this.maxDelay = options.maxDelay || 5000;
        this.delayMultiplier = options.delayMultiplier || 1.5;
        this.requests = new Map(); // IP -> { count, windowStart, delays }
    }

    getCurrentWindow(now = Date.now()) {
        return Math.floor(now / this.windowMs) * this.windowMs;
    }

    getRequestInfo(ip) {
        const now = Date.now();
        const currentWindow = this.getCurrentWindow(now);
        const existing = this.requests.get(ip);

        if (!existing || existing.windowStart < currentWindow) {
            const newInfo = {
                count: 0,
                windowStart: currentWindow,
                delays: []
            };
            this.requests.set(ip, newInfo);
            return newInfo;
        }

        return existing;
    }

    calculateDelay(requestCount) {
        if (requestCount <= this.threshold) {
            return 0;
        }

        const excess = requestCount - this.threshold;
        let delay = this.baseDelay;

        // Apply multiplier for each excess request
        for (let i = 0; i < excess - 1; i++) {
            delay *= this.delayMultiplier;
        }

        return Math.min(delay, this.maxDelay);
    }

    middleware() {
        return async (req, res, next) => {
            const ip = req.ip || req.connection.remoteAddress;
            const requestInfo = this.getRequestInfo(ip);
            
            requestInfo.count++;
            const delay = this.calculateDelay(requestInfo.count);
            
            if (delay > 0) {
                requestInfo.delays.push({ timestamp: Date.now(), delay });
                
                // Set delay headers
                res.set({
                    'X-Delay-Applied': `${delay}ms`,
                    'X-Request-Count': requestInfo.count,
                    'X-Delay-Threshold': this.threshold,
                    'X-Delay-Type': 'progressive_custom'
                });

                // Apply delay
                await new Promise(resolve => setTimeout(resolve, delay));
            }

            this.requests.set(ip, requestInfo);
            next();
        };
    }

    // Get statistics
    getStats() {
        const stats = {
            totalIPs: this.requests.size,
            windowMs: this.windowMs,
            threshold: this.threshold,
            activeDelays: 0,
            averageDelay: 0
        };

        let totalDelays = 0;
        let delayCount = 0;

        for (const [ip, info] of this.requests.entries()) {
            if (info.delays.length > 0) {
                stats.activeDelays++;
                info.delays.forEach(d => {
                    totalDelays += d.delay;
                    delayCount++;
                });
            }
        }

        stats.averageDelay = delayCount > 0 ? totalDelays / delayCount : 0;
        return stats;
    }
}

// Pre-configured progressive delay instances
const standardProgressiveDelay = new CustomProgressiveDelay({
    windowMs: 60000,
    threshold: 15,
    baseDelay: 100,
    maxDelay: 3000,
    delayMultiplier: 1.5
});

const strictProgressiveDelay = new CustomProgressiveDelay({
    windowMs: 60000,
    threshold: 5,
    baseDelay: 250,
    maxDelay: 8000,
    delayMultiplier: 2
});

// Adaptive delay that adjusts based on system load
class AdaptiveProgressiveDelay extends CustomProgressiveDelay {
    constructor(options = {}) {
        super(options);
        this.loadFactor = 1; // Multiplier based on system load
    }

    // Simulate system load calculation (in real app, this could check CPU, memory, etc.)
    getSystemLoad() {
        const activeConnections = this.requests.size;
        if (activeConnections > 100) return 2;
        if (activeConnections > 50) return 1.5;
        return 1;
    }

    calculateDelay(requestCount) {
        const baseDelay = super.calculateDelay(requestCount);
        this.loadFactor = this.getSystemLoad();
        return Math.min(baseDelay * this.loadFactor, this.maxDelay);
    }
}

const adaptiveDelay = new AdaptiveProgressiveDelay({
    windowMs: 120000, // 2 minutes
    threshold: 20,
    baseDelay: 150,
    maxDelay: 5000,
    delayMultiplier: 1.8
});

module.exports = {
    basicSlowDown,
    aggressiveSlowDown,
    gentleSlowDown,
    CustomProgressiveDelay,
    standardProgressiveDelay: standardProgressiveDelay.middleware(),
    strictProgressiveDelay: strictProgressiveDelay.middleware(),
    AdaptiveProgressiveDelay,
    adaptiveDelay: adaptiveDelay.middleware(),
    // Export instances for monitoring
    instances: {
        standardProgressiveDelay,
        strictProgressiveDelay,
        adaptiveDelay
    }
};
