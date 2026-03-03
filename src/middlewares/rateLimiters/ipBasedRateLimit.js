/**
 * IP-Based Rate Limiting with Tiers
 * 
 * This implements sophisticated IP-based rate limiting with different
 * tiers of service based on IP reputation, user type, or other criteria.
 * It includes whitelisting, blacklisting, and tier-based limits.
 * 
 * Features:
 * - IP whitelisting (trusted IPs)
 * - IP blacklisting (banned IPs)
 * - Tier-based rate limits
 * - Geolocation-based limits
 * - Dynamic tier adjustment
 */

class IPBasedRateLimiter {
    constructor() {
        // IP classification lists
        this.whitelist = new Set([
            '127.0.0.1',
            '::1',
            '10.0.0.0/8',    // Private networks (would need proper CIDR parsing in production)
            '192.168.0.0/16',
            '172.16.0.0/12'
        ]);

        this.blacklist = new Set([
            // Known malicious IPs would go here
        ]);

        // Tier definitions
        this.tiers = {
            premium: {
                windowMs: 60000,
                maxRequests: 1000,
                description: 'Premium users',
                priority: 1
            },
            standard: {
                windowMs: 60000,
                maxRequests: 100,
                description: 'Standard users',
                priority: 2
            },
            limited: {
                windowMs: 60000,
                maxRequests: 20,
                description: 'Limited access users',
                priority: 3
            },
            suspicious: {
                windowMs: 60000,
                maxRequests: 5,
                description: 'Suspicious IPs',
                priority: 4
            },
            default: {
                windowMs: 60000,
                maxRequests: 50,
                description: 'Default tier',
                priority: 3
            }
        };

        // IP tier assignments
        this.ipTiers = new Map(); // IP -> tier name
        this.ipRequests = new Map(); // IP -> { count, windowStart, tier, violations }
        this.ipHistory = new Map(); // IP -> { totalRequests, violations, firstSeen, lastSeen }
    }

    // Check if IP is whitelisted
    isWhitelisted(ip) {
        return this.whitelist.has(ip) || ip === '127.0.0.1' || ip === '::1';
    }

    // Check if IP is blacklisted
    isBlacklisted(ip) {
        return this.blacklist.has(ip);
    }

    // Get tier for IP
    getIPTier(ip) {
        // Whitelisted IPs get premium tier
        if (this.isWhitelisted(ip)) {
            return 'premium';
        }

        // Blacklisted IPs get suspended
        if (this.isBlacklisted(ip)) {
            return null; // Will be blocked
        }

        // Check explicit tier assignment
        if (this.ipTiers.has(ip)) {
            return this.ipTiers.get(ip);
        }

        // Determine tier based on history
        const history = this.ipHistory.get(ip);
        if (history) {
            // Suspicious behavior detection
            if (history.violations > 5) {
                return 'suspicious';
            }
            
            // High-volume legitimate users
            if (history.totalRequests > 10000 && history.violations === 0) {
                return 'standard';
            }
        }

        return 'default';
    }

    // Set tier for IP
    setIPTier(ip, tier) {
        if (this.tiers[tier]) {
            this.ipTiers.set(ip, tier);
        }
    }

    // Add IP to blacklist
    blacklistIP(ip, reason = 'Manual blacklist') {
        this.blacklist.add(ip);
        console.log(`IP ${ip} blacklisted: ${reason}`);
    }

    // Add IP to whitelist
    whitelistIP(ip) {
        this.whitelist.add(ip);
        console.log(`IP ${ip} whitelisted`);
    }

    // Get current window start
    getCurrentWindow(windowMs, now = Date.now()) {
        return Math.floor(now / windowMs) * windowMs;
    }

    // Update IP history
    updateHistory(ip) {
        const now = Date.now();
        if (!this.ipHistory.has(ip)) {
            this.ipHistory.set(ip, {
                totalRequests: 0,
                violations: 0,
                firstSeen: now,
                lastSeen: now
            });
        }

        const history = this.ipHistory.get(ip);
        history.totalRequests++;
        history.lastSeen = now;
        this.ipHistory.set(ip, history);
    }

    // Record violation
    recordViolation(ip) {
        const history = this.ipHistory.get(ip) || {
            totalRequests: 0,
            violations: 0,
            firstSeen: Date.now(),
            lastSeen: Date.now()
        };
        
        history.violations++;
        this.ipHistory.set(ip, history);

        // Auto-blacklist after too many violations
        if (history.violations > 10) {
            this.blacklistIP(ip, 'Too many violations');
        }
    }

    // Check if request is allowed
    isAllowed(ip) {
        const now = Date.now();
        
        // Check blacklist first
        if (this.isBlacklisted(ip)) {
            return {
                allowed: false,
                reason: 'IP blacklisted',
                tier: null,
                resetTime: null
            };
        }

        const tier = this.getIPTier(ip);
        const tierConfig = this.tiers[tier];
        
        if (!tierConfig) {
            return {
                allowed: false,
                reason: 'Invalid tier',
                tier: tier,
                resetTime: null
            };
        }

        const windowStart = this.getCurrentWindow(tierConfig.windowMs, now);
        const existing = this.ipRequests.get(ip);

        // Initialize or reset window
        if (!existing || existing.windowStart < windowStart) {
            const newWindow = {
                count: 1,
                windowStart: windowStart,
                tier: tier,
                violations: existing ? existing.violations : 0
            };
            this.ipRequests.set(ip, newWindow);
            this.updateHistory(ip);

            return {
                allowed: true,
                tier: tier,
                remaining: tierConfig.maxRequests - 1,
                resetTime: windowStart + tierConfig.windowMs,
                tierConfig: tierConfig
            };
        }

        // Check if within limits
        if (existing.count < tierConfig.maxRequests) {
            existing.count++;
            this.ipRequests.set(ip, existing);
            this.updateHistory(ip);

            return {
                allowed: true,
                tier: tier,
                remaining: tierConfig.maxRequests - existing.count,
                resetTime: windowStart + tierConfig.windowMs,
                tierConfig: tierConfig
            };
        }

        // Rate limit exceeded
        this.recordViolation(ip);
        return {
            allowed: false,
            reason: 'Rate limit exceeded',
            tier: tier,
            resetTime: windowStart + tierConfig.windowMs,
            retryAfter: Math.ceil((windowStart + tierConfig.windowMs - now) / 1000),
            tierConfig: tierConfig
        };
    }

    // Express middleware
    middleware() {
        return (req, res, next) => {
            const ip = req.ip || req.connection.remoteAddress;
            const result = this.isAllowed(ip);

            // Set headers
            if (result.tierConfig) {
                res.set({
                    'X-RateLimit-Tier': result.tier,
                    'X-RateLimit-Limit': result.tierConfig.maxRequests,
                    'X-RateLimit-Remaining': result.remaining || 0,
                    'X-RateLimit-Reset': result.resetTime ? new Date(result.resetTime).toISOString() : '',
                    'X-RateLimit-Window': result.tierConfig.windowMs,
                    'X-IP-Classification': this.isWhitelisted(ip) ? 'whitelisted' : 'standard'
                });
            }

            if (!result.allowed) {
                if (result.retryAfter) {
                    res.set('Retry-After', result.retryAfter);
                }

                return res.status(result.reason === 'IP blacklisted' ? 403 : 429).json({
                    error: result.reason,
                    message: result.reason === 'IP blacklisted' ? 
                        'Your IP has been blacklisted' : 
                        'Rate limit exceeded for your tier',
                    tier: result.tier,
                    retryAfter: result.retryAfter || null,
                    type: 'ip_based_limit'
                });
            }

            // Add IP info to request
            req.ipInfo = {
                tier: result.tier,
                remaining: result.remaining,
                isWhitelisted: this.isWhitelisted(ip),
                tierConfig: result.tierConfig
            };

            next();
        };
    }

    // Admin methods for managing IPs and tiers
    getIPStats(ip) {
        return {
            tier: this.getIPTier(ip),
            history: this.ipHistory.get(ip),
            currentWindow: this.ipRequests.get(ip),
            isWhitelisted: this.isWhitelisted(ip),
            isBlacklisted: this.isBlacklisted(ip)
        };
    }

    // Get overall statistics
    getOverallStats() {
        const tierCounts = {};
        let totalActiveIPs = 0;

        for (const [ip, requests] of this.ipRequests.entries()) {
            const tier = requests.tier;
            tierCounts[tier] = (tierCounts[tier] || 0) + 1;
            totalActiveIPs++;
        }

        return {
            totalActiveIPs,
            tierCounts,
            whitelistedCount: this.whitelist.size,
            blacklistedCount: this.blacklist.size,
            tierDefinitions: this.tiers
        };
    }

    // Cleanup old data
    cleanup() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        // Cleanup old request windows
        for (const [ip, requests] of this.ipRequests.entries()) {
            if (now - requests.windowStart > this.tiers[requests.tier].windowMs) {
                this.ipRequests.delete(ip);
            }
        }

        // Cleanup old history (keep for longer)
        for (const [ip, history] of this.ipHistory.entries()) {
            if (now - history.lastSeen > maxAge) {
                this.ipHistory.delete(ip);
            }
        }
    }
}

// Create instance and setup periodic cleanup
const ipRateLimiter = new IPBasedRateLimiter();

// Cleanup every hour
setInterval(() => ipRateLimiter.cleanup(), 60 * 60 * 1000);

// Geolocation-based rate limiter (simplified - would integrate with GeoIP service)
class GeolocationRateLimiter extends IPBasedRateLimiter {
    constructor() {
        super();
        
        // Country-based tier mapping (example)
        this.countryTiers = {
            'US': 'standard',
            'CA': 'standard',
            'GB': 'standard',
            'DE': 'standard',
            'JP': 'standard',
            // More restrictive for some regions
            'CN': 'limited',
            'RU': 'limited',
            // Suspicious regions might get lower limits
            'XX': 'suspicious' // Unknown/proxy
        };
    }

    // Override getIPTier to include geolocation
    getIPTier(ip) {
        // First check parent class logic
        const baseTier = super.getIPTier(ip);
        
        if (baseTier === 'premium' || baseTier === null) {
            return baseTier; // Don't override premium or blocked
        }

        // In a real implementation, you'd use a GeoIP service here
        const country = this.getCountryFromIP(ip);
        
        if (this.countryTiers[country]) {
            return this.countryTiers[country];
        }

        return baseTier;
    }

    // Placeholder for GeoIP lookup
    getCountryFromIP(ip) {
        // In production, use MaxMind GeoIP2, IP2Location, or similar
        if (ip === '127.0.0.1' || ip === '::1') return 'US';
        return 'XX'; // Unknown
    }
}

const geoRateLimiter = new GeolocationRateLimiter();

module.exports = {
    IPBasedRateLimiter,
    GeolocationRateLimiter,
    ipRateLimiter: ipRateLimiter.middleware(),
    geoRateLimiter: geoRateLimiter.middleware(),
    // Export instances for admin operations
    instances: {
        ipRateLimiter,
        geoRateLimiter
    }
};
