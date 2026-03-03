/**
 * Token Bucket Rate Limiter
 * 
 * The token bucket algorithm allows for burst traffic while maintaining
 * an average rate limit. Each user has a "bucket" that fills with tokens
 * at a steady rate. Each request consumes a token. When the bucket is empty,
 * requests are denied until more tokens are added.
 * 
 * Benefits:
 * - Allows burst traffic up to bucket capacity
 * - Smooth rate limiting over time
 * - More user-friendly than strict fixed windows
 */

class TokenBucket {
    constructor(capacity = 10, refillRate = 1, refillPeriodMs = 1000) {
        this.capacity = capacity; // Maximum tokens in bucket
        this.tokens = capacity; // Current tokens (start full)
        this.refillRate = refillRate; // Tokens added per period
        this.refillPeriodMs = refillPeriodMs; // Period in milliseconds
        this.lastRefill = Date.now();
    }

    // Refill tokens based on time elapsed
    refill() {
        const now = Date.now();
        const timePassed = now - this.lastRefill;
        const tokensToAdd = Math.floor(timePassed / this.refillPeriodMs) * this.refillRate;
        
        if (tokensToAdd > 0) {
            this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
            this.lastRefill = now;
        }
    }

    // Try to consume tokens
    consume(tokens = 1) {
        this.refill();
        
        if (this.tokens >= tokens) {
            this.tokens -= tokens;
            return {
                allowed: true,
                remaining: this.tokens,
                waitTime: 0
            };
        }
        
        // Calculate wait time for next token
        const tokensNeeded = tokens - this.tokens;
        const waitTime = Math.ceil(tokensNeeded * this.refillPeriodMs / this.refillRate);
        
        return {
            allowed: false,
            remaining: this.tokens,
            waitTime: waitTime
        };
    }

    // Get current state
    getState() {
        this.refill();
        return {
            tokens: this.tokens,
            capacity: this.capacity,
            refillRate: this.refillRate,
            refillPeriodMs: this.refillPeriodMs
        };
    }
}

class TokenBucketRateLimiter {
    constructor(capacity = 10, refillRate = 1, refillPeriodMs = 1000) {
        this.capacity = capacity;
        this.refillRate = refillRate;
        this.refillPeriodMs = refillPeriodMs;
        this.buckets = new Map(); // Map of IP -> TokenBucket
    }

    // Get or create bucket for IP
    getBucket(ip) {
        if (!this.buckets.has(ip)) {
            this.buckets.set(ip, new TokenBucket(
                this.capacity,
                this.refillRate,
                this.refillPeriodMs
            ));
        }
        return this.buckets.get(ip);
    }

    // Clean up old buckets periodically
    cleanup() {
        const now = Date.now();
        const maxAge = this.refillPeriodMs * this.capacity * 2; // 2x the time to fill bucket
        
        for (const [ip, bucket] of this.buckets.entries()) {
            if (now - bucket.lastRefill > maxAge) {
                this.buckets.delete(ip);
            }
        }
    }

    // Express middleware factory
    middleware(tokensPerRequest = 1) {
        // Cleanup old buckets every 5 minutes
        setInterval(() => this.cleanup(), 5 * 60 * 1000);

        return (req, res, next) => {
            const ip = req.ip || req.connection.remoteAddress;
            const bucket = this.getBucket(ip);
            const result = bucket.consume(tokensPerRequest);

            // Set custom headers
            res.set({
                'X-TokenBucket-Capacity': this.capacity,
                'X-TokenBucket-Remaining': result.remaining,
                'X-TokenBucket-RefillRate': `${this.refillRate}/${this.refillPeriodMs}ms`,
                'X-TokenBucket-Type': 'token_bucket'
            });

            if (!result.allowed) {
                res.set('Retry-After', Math.ceil(result.waitTime / 1000));
                return res.status(429).json({
                    error: 'Rate limit exceeded',
                    message: 'Token bucket exhausted',
                    type: 'token_bucket_limit',
                    tokensRemaining: result.remaining,
                    tokensRequired: tokensPerRequest,
                    waitTimeMs: result.waitTime,
                    retryAfter: Math.ceil(result.waitTime / 1000)
                });
            }

            // Add bucket info to request for debugging
            req.tokenBucket = bucket.getState();
            next();
        };
    }
}

// Pre-configured token bucket rate limiters
const standardTokenBucket = new TokenBucketRateLimiter(20, 2, 1000); // 20 capacity, refill 2 per second
const burstTokenBucket = new TokenBucketRateLimiter(50, 1, 1000); // 50 capacity, refill 1 per second (allows big bursts)
const strictTokenBucket = new TokenBucketRateLimiter(5, 1, 2000); // 5 capacity, refill 1 per 2 seconds (strict)

// Heavy operation rate limiter (consumes more tokens)
const heavyOperationLimiter = new TokenBucketRateLimiter(10, 1, 5000); // 10 capacity, refill 1 per 5 seconds

module.exports = {
    TokenBucket,
    TokenBucketRateLimiter,
    standardTokenBucket: standardTokenBucket.middleware(1),
    burstTokenBucket: burstTokenBucket.middleware(1),
    strictTokenBucket: strictTokenBucket.middleware(1),
    heavyOperationLimiter: heavyOperationLimiter.middleware(3) // Consumes 3 tokens per request
};
