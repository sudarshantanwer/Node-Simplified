/**
 * Environment Configuration
 * This file centralizes all environment variables and provides defaults
 */

const config = {
    // Server Configuration
    server: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || '0.0.0.0',
        nodeEnv: process.env.NODE_ENV || 'development'
    },

    // JWT Configuration
    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET || 'your-super-secret-access-key-change-this-in-production-minimum-32-characters',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-this-in-production-minimum-32-characters',
        accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || '15m',
        refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d',
        issuer: process.env.JWT_ISSUER || 'node-simplified-app',
        audience: process.env.JWT_AUDIENCE || 'node-simplified-users'
    },

    // Security Configuration
    security: {
        bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12,
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
        lockoutTimeMinutes: parseInt(process.env.LOCKOUT_TIME) || 15,
        maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb',
        enableHttps: process.env.ENABLE_HTTPS === 'true',
        trustProxy: process.env.TRUST_PROXY === 'true',
        secureCookies: process.env.SECURE_COOKIES === 'true' || process.env.NODE_ENV === 'production'
    },

    // CORS Configuration
    cors: {
        allowedOrigins: process.env.ALLOWED_ORIGINS ? 
            process.env.ALLOWED_ORIGINS.split(',') : 
            ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    },

    // Rate Limiting Configuration
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
        authWindowMs: 15 * 60 * 1000, // 15 minutes for auth endpoints
        authMaxRequests: 5,
        registerWindowMs: 60 * 60 * 1000, // 1 hour for registration
        registerMaxRequests: 3
    },

    // Cookie Configuration
    cookies: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    },

    // Logging Configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        logToFile: process.env.LOG_TO_FILE === 'true',
        enableDetailedErrors: process.env.ENABLE_DETAILED_ERRORS === 'true' || process.env.NODE_ENV === 'development'
    },

    // Session Configuration
    session: {
        timeout: process.env.SESSION_TIMEOUT || '24h',
        refreshTokenRotation: process.env.REFRESH_TOKEN_ROTATION !== 'false'
    },

    // Development Configuration
    development: {
        debugMode: process.env.DEBUG_MODE === 'true' || process.env.NODE_ENV === 'development',
        enableDetailedErrors: process.env.NODE_ENV === 'development'
    }
};

// Validation function to ensure required environment variables are set
const validateConfig = () => {
    const requiredForProduction = [
        'JWT_ACCESS_SECRET',
        'JWT_REFRESH_SECRET'
    ];

    if (config.server.nodeEnv === 'production') {
        for (const envVar of requiredForProduction) {
            if (!process.env[envVar]) {
                throw new Error(`Required environment variable ${envVar} is not set for production`);
            }
        }

        // Warn about using default secrets in production
        if (config.jwt.accessSecret.includes('change-this-in-production')) {
            throw new Error('Default JWT secrets detected in production environment. Please set secure JWT secrets.');
        }

        if (config.jwt.refreshSecret.includes('change-this-in-production')) {
            throw new Error('Default JWT refresh secrets detected in production environment. Please set secure JWT secrets.');
        }
    }

    // Validate JWT secret strength
    if (config.jwt.accessSecret.length < 32) {
        console.warn('Warning: JWT access secret should be at least 32 characters long for security');
    }

    if (config.jwt.refreshSecret.length < 32) {
        console.warn('Warning: JWT refresh secret should be at least 32 characters long for security');
    }

    return true;
};

// Environment-specific overrides
if (config.server.nodeEnv === 'production') {
    // Production-specific configurations
    config.security.secureCookies = true;
    config.logging.enableDetailedErrors = false;
    config.development.debugMode = false;
} else if (config.server.nodeEnv === 'test') {
    // Test-specific configurations
    config.jwt.accessTokenExpiry = '1m';
    config.rateLimit.maxRequests = 1000; // Higher limits for testing
}

// Initialize configuration
try {
    validateConfig();
    console.log(`✓ Configuration loaded for ${config.server.nodeEnv} environment`);
} catch (error) {
    console.error('❌ Configuration validation failed:', error.message);
    process.exit(1);
}

module.exports = config;
