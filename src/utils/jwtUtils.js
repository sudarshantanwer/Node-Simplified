const jwt = require('jsonwebtoken');

// In production, these should be in environment variables
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'your-super-secret-access-key-change-this-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-this-in-production';

// Token expiration times
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

class JWTUtils {
    /**
     * Generate access token
     * @param {Object} payload - User data to encode
     * @returns {string} Access token
     */
    static generateAccessToken(payload) {
        const tokenPayload = {
            userId: payload.id,
            username: payload.username,
            email: payload.email,
            role: payload.role,
            type: 'access'
        };

        return jwt.sign(tokenPayload, JWT_ACCESS_SECRET, {
            expiresIn: ACCESS_TOKEN_EXPIRY,
            issuer: 'node-simplified-app',
            audience: 'node-simplified-users',
            subject: payload.id.toString()
        });
    }

    /**
     * Generate refresh token
     * @param {Object} payload - User data to encode
     * @returns {string} Refresh token
     */
    static generateRefreshToken(payload) {
        const tokenPayload = {
            userId: payload.id,
            username: payload.username,
            type: 'refresh',
            tokenId: Date.now() + Math.random() // Unique token identifier
        };

        return jwt.sign(tokenPayload, JWT_REFRESH_SECRET, {
            expiresIn: REFRESH_TOKEN_EXPIRY,
            issuer: 'node-simplified-app',
            audience: 'node-simplified-users',
            subject: payload.id.toString()
        });
    }

    /**
     * Generate both access and refresh tokens
     * @param {Object} user - User object
     * @returns {Object} Object containing both tokens
     */
    static generateTokenPair(user) {
        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);

        return {
            accessToken,
            refreshToken,
            tokenType: 'Bearer',
            expiresIn: ACCESS_TOKEN_EXPIRY
        };
    }

    /**
     * Verify access token
     * @param {string} token - JWT token
     * @returns {Object} Decoded token payload
     */
    static verifyAccessToken(token) {
        try {
            const decoded = jwt.verify(token, JWT_ACCESS_SECRET, {
                issuer: 'node-simplified-app',
                audience: 'node-simplified-users'
            });

            if (decoded.type !== 'access') {
                throw new Error('Invalid token type');
            }

            return decoded;
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Access token expired');
            } else if (error.name === 'JsonWebTokenError') {
                throw new Error('Invalid access token');
            } else if (error.name === 'NotBeforeError') {
                throw new Error('Access token not active');
            }
            throw error;
        }
    }

    /**
     * Verify refresh token
     * @param {string} token - JWT refresh token
     * @returns {Object} Decoded token payload
     */
    static verifyRefreshToken(token) {
        try {
            const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
                issuer: 'node-simplified-app',
                audience: 'node-simplified-users'
            });

            if (decoded.type !== 'refresh') {
                throw new Error('Invalid token type');
            }

            return decoded;
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Refresh token expired');
            } else if (error.name === 'JsonWebTokenError') {
                throw new Error('Invalid refresh token');
            } else if (error.name === 'NotBeforeError') {
                throw new Error('Refresh token not active');
            }
            throw error;
        }
    }

    /**
     * Extract token from Authorization header
     * @param {string} authHeader - Authorization header value
     * @returns {string|null} Token or null if not found
     */
    static extractTokenFromHeader(authHeader) {
        if (!authHeader) {
            return null;
        }

        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return null;
        }

        return parts[1];
    }

    /**
     * Get token expiration time
     * @param {string} token - JWT token
     * @returns {Date|null} Expiration date or null if invalid
     */
    static getTokenExpiration(token) {
        try {
            const decoded = jwt.decode(token);
            if (decoded && decoded.exp) {
                return new Date(decoded.exp * 1000);
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Check if token is expired
     * @param {string} token - JWT token
     * @returns {boolean} True if expired
     */
    static isTokenExpired(token) {
        const expiration = this.getTokenExpiration(token);
        if (!expiration) {
            return true;
        }
        return expiration < new Date();
    }

    /**
     * Decode token without verification (for debugging)
     * @param {string} token - JWT token
     * @returns {Object|null} Decoded payload or null
     */
    static decodeToken(token) {
        try {
            return jwt.decode(token);
        } catch (error) {
            return null;
        }
    }

    /**
     * Get token time until expiration in seconds
     * @param {string} token - JWT token
     * @returns {number|null} Seconds until expiration or null
     */
    static getTimeUntilExpiration(token) {
        const expiration = this.getTokenExpiration(token);
        if (!expiration) {
            return null;
        }
        const now = new Date();
        return Math.max(0, Math.floor((expiration - now) / 1000));
    }

    /**
     * Create token blacklist entry (for logout)
     * @param {string} token - JWT token to blacklist
     * @returns {Object} Blacklist entry
     */
    static createBlacklistEntry(token) {
        const decoded = this.decodeToken(token);
        if (!decoded) {
            throw new Error('Invalid token for blacklisting');
        }

        return {
            token,
            userId: decoded.userId,
            exp: decoded.exp,
            blacklistedAt: new Date(),
            reason: 'logout'
        };
    }
}

module.exports = JWTUtils;
