const express = require('express');
const app = express();
const cors = require('cors');
const todoRoutes = require('./routes/todoRoutes');
const rateLimitDemoRoutes = require('./routes/rateLimitDemoRoutes');
const authMiddleware = require('./middlewares/authMiddleware');
const logMiddleware = require('./middlewares/logMiddleware');

// Import rate limiting middleware
const rateLimiters = require('./middlewares/rateLimiters');

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Apply global rate limiting with IP-based tiers
app.use(rateLimiters.ipBased.standard);

app.use(logMiddleware);
app.use(authMiddleware);

// Routes
app.use('/api/todo', todoRoutes);
app.use('/api/rate-limit-demo', rateLimitDemoRoutes);

// Root endpoint with basic info
app.get('/', rateLimiters.basic.lenient, (req, res) => {
    res.json({
        message: 'Node.js Rate Limiting Demo API',
        version: '1.0.0',
        endpoints: {
            todos: '/api/todo',
            rateLimitDemo: '/api/rate-limit-demo',
            stats: '/api/rate-limit-demo/stats',
            health: '/api/rate-limit-demo/health'
        },
        rateLimitingTechniques: [
            'Basic Rate Limiting (express-rate-limit)',
            'Sliding Window Rate Limiting',
            'Token Bucket Rate Limiting',
            'Fixed Window Rate Limiting',
            'Progressive Delay Rate Limiting',
            'IP-based Rate Limiting with Tiers',
            'Custom Rate Limiting Middleware'
        ],
        documentation: 'Visit /api/rate-limit-demo for interactive examples',
        timestamp: new Date().toISOString()
    });
});

module.exports = app;