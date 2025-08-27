# 🔐 Authentication System Documentation

**Node.js Simplified - Complete Authentication System**

This documentation provides comprehensive details about the state-of-the-art authentication system implemented in this Node.js application.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [API Endpoints](#api-endpoints)
4. [Authentication Flow](#authentication-flow)
5. [Security Features](#security-features)
6. [Frontend Integration](#frontend-integration)
7. [Configuration](#configuration)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)
10. [Deployment Guide](#deployment-guide)
11. [Code Examples](#code-examples)
12. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The authentication system is built with modern security practices and includes:

- **JWT-based authentication** with short-lived access tokens and long-lived refresh tokens
- **Secure password hashing** using bcrypt with 12 salt rounds
- **Input validation** using Joi schemas with detailed error messages
- **Rate limiting** to prevent brute force attacks
- **Role-based access control** (User, Admin, Moderator)
- **Token blacklisting** for secure logout
- **Comprehensive error handling** with custom error types
- **Frontend integration** with responsive UI

---

## 🏗️ Architecture

### Backend Components

```
src/
├── controllers/
│   └── authController.js      # Authentication logic
├── middlewares/
│   ├── authMiddleware.js      # JWT verification & authorization
│   └── errorMiddleware.js     # Error handling
├── models/
│   └── userModel.js          # User data management
├── routes/
│   └── authRoutes.js         # Authentication endpoints
├── utils/
│   └── jwtUtils.js           # JWT token utilities
├── validations/
│   └── authValidation.js     # Input validation schemas
└── config/
    └── environment.js        # Environment configuration
```

### Frontend Components

```
public/
├── index.html               # Login/Register page
├── dashboard.html           # Main dashboard
├── css/
│   └── styles.css          # Responsive styling
└── js/
    ├── auth.js             # Authentication manager
    ├── main.js             # Login/register logic
    ├── dashboard.js        # Dashboard functionality
    └── todos.js            # Todo management
```

---

## 📚 API Endpoints

### Base URL
```
http://localhost:3001/api/auth
```

### Public Endpoints

#### 1. User Registration
```http
POST /register
```

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "role": "user"  // Optional: "user" (default), "admin", "moderator"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 2,
      "username": "johndoe",
      "email": "john@example.com",
      "role": "user",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "tokenType": "Bearer",
      "expiresIn": "15m"
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Validation Errors (400):**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "password",
      "message": "Password must contain at least one uppercase letter",
      "value": "weakpassword"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 2. User Login
```http
POST /login
```

**Request Body:**
```json
{
  "emailOrUsername": "john@example.com",  // Email or username
  "password": "SecurePass123!",
  "rememberMe": false  // Optional: extends refresh token life
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 2,
      "username": "johndoe",
      "email": "john@example.com",
      "role": "user",
      "lastLogin": "2024-01-15T10:30:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "tokenType": "Bearer",
      "expiresIn": "15m"
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Invalid Credentials (401):**
```json
{
  "success": false,
  "message": "Invalid credentials",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 3. Token Refresh
```http
POST /refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "tokenType": "Bearer",
      "expiresIn": "15m"
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 4. Token Verification
```http
GET /verify
```

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "user": {
      "id": 2,
      "username": "johndoe",
      "email": "john@example.com",
      "role": "user"
    },
    "tokenExpiration": "2024-01-15T10:45:00.000Z"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Protected Endpoints

#### 5. User Logout
```http
POST /logout
```

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  // Optional
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logout successful",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 6. Logout All Devices
```http
POST /logout-all
```

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out from all devices successfully",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 7. Get User Profile
```http
GET /profile
```

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "id": 2,
      "username": "johndoe",
      "email": "john@example.com",
      "role": "user",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "lastLogin": "2024-01-15T10:30:00.000Z"
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 8. Update User Profile
```http
PUT /profile
```

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "username": "johnsmith",  // Optional
  "email": "johnsmith@example.com"  // Optional
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": 2,
      "username": "johnsmith",
      "email": "johnsmith@example.com",
      "role": "user"
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 9. Change Password
```http
PUT /change-password
```

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "currentPassword": "SecurePass123!",
  "newPassword": "NewSecurePass456!",
  "confirmNewPassword": "NewSecurePass456!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully. Please log in again.",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Admin Endpoints

#### 10. Get All Users (Admin Only)
```http
GET /users
```

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "role": "admin",
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "lastLogin": "2024-01-15T10:30:00.000Z"
      }
    ],
    "count": 1
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 11. Deactivate User (Admin Only)
```http
PUT /users/:userId/deactivate
```

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User account deactivated successfully",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 12. Authentication Statistics (Admin Only)
```http
GET /admin/stats
```

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Authentication statistics retrieved successfully",
  "data": {
    "stats": {
      "totalUsers": 5,
      "activeUsers": 4,
      "inactiveUsers": 1,
      "adminUsers": 1,
      "regularUsers": 3,
      "moderatorUsers": 0,
      "recentRegistrations": 2,
      "blacklistedTokens": 3
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 🔄 Authentication Flow

### 1. Registration Flow
```mermaid
sequenceDiagram
    participant Client
    participant Frontend
    participant API
    participant Database

    Client->>Frontend: Fill registration form
    Frontend->>Frontend: Validate input (real-time)
    Frontend->>API: POST /api/auth/register
    API->>API: Validate with Joi schema
    API->>API: Hash password (bcrypt)
    API->>Database: Store user
    API->>API: Generate JWT tokens
    API->>Frontend: Return user + tokens
    Frontend->>Frontend: Store tokens
    Frontend->>Client: Redirect to dashboard
```

### 2. Login Flow
```mermaid
sequenceDiagram
    participant Client
    participant Frontend
    participant API
    participant Database

    Client->>Frontend: Enter credentials
    Frontend->>API: POST /api/auth/login
    API->>Database: Find user
    API->>API: Verify password
    API->>API: Generate JWT tokens
    API->>Database: Update last login
    API->>Frontend: Return user + tokens
    Frontend->>Frontend: Store tokens
    Frontend->>Client: Redirect to dashboard
```

### 3. Token Refresh Flow
```mermaid
sequenceDiagram
    participant Frontend
    participant API
    participant Database

    Frontend->>Frontend: Access token expires
    Frontend->>API: POST /api/auth/refresh
    API->>API: Verify refresh token
    API->>Database: Check token validity
    API->>API: Generate new tokens
    API->>Database: Update token storage
    API->>Frontend: Return new tokens
    Frontend->>Frontend: Update stored tokens
```

### 4. Protected Request Flow
```mermaid
sequenceDiagram
    participant Frontend
    participant Middleware
    participant API
    participant Database

    Frontend->>Middleware: Request with Bearer token
    Middleware->>Middleware: Extract & verify JWT
    Middleware->>Database: Check user status
    Middleware->>API: Forward request with user info
    API->>API: Process request
    API->>Frontend: Return response
```

---

## 🛡️ Security Features

### Password Requirements
- **Minimum 8 characters**
- **At least one uppercase letter** (A-Z)
- **At least one lowercase letter** (a-z)
- **At least one number** (0-9)
- **At least one special character** (@$!%*?&)

**Validation Regex:**
```javascript
/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
```

### JWT Token Security

#### Access Tokens
- **Lifespan:** 15 minutes (configurable)
- **Algorithm:** HS256
- **Payload includes:** userId, username, email, role, type
- **Issuer:** node-simplified-app
- **Audience:** node-simplified-users

#### Refresh Tokens
- **Lifespan:** 7 days (configurable, 30 days with "Remember Me")
- **Algorithm:** HS256
- **Unique token ID** for each token
- **Stored in user model** for validation
- **Automatic rotation** on refresh

#### Token Blacklisting
- **Immediate invalidation** on logout
- **In-memory storage** (Redis recommended for production)
- **Automatic cleanup** of expired tokens

### Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|---------|
| Global | 100 requests | 15 minutes |
| Authentication | 5 requests | 15 minutes |
| Registration | 3 requests | 1 hour |
| Password Change | 3 requests | 1 hour |
| Token Refresh | 10 requests | 5 minutes |

### Security Headers
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=31536000 (HTTPS only)
```

---

## 🎨 Frontend Integration

### Authentication Manager (auth.js)

The `AuthManager` class handles all authentication operations:

```javascript
// Initialize
const auth = new AuthManager();

// Check if user is authenticated
if (auth.isAuthenticated()) {
    // User is logged in
}

// Login
await auth.login('user@example.com', 'password', false);

// Register
await auth.register('username', 'email', 'password', 'confirmPassword');

// Logout
await auth.logout();

// Change password
await auth.changePassword('current', 'new', 'confirm');
```

### Token Management

```javascript
// Automatic token refresh
auth.setupTokenRefresh(); // Called automatically

// Manual token verification
const isValid = await auth.verifyToken();

// Get user info
const user = auth.user; // Current user object
const isAdmin = auth.isAdmin(); // Check admin role
```

### API Request Helper

```javascript
// Authenticated API requests
const response = await auth.apiRequest('/api/todo', {
    method: 'POST',
    body: JSON.stringify({ task: 'Learn Node.js' })
});
```

### Form Validation

Real-time validation with visual feedback:

```javascript
// Password strength validation
function validatePassword() {
    const input = document.getElementById('password');
    const password = input.value;
    
    if (isValidPassword(password)) {
        showValidationFeedback(input, 'Strong password!', 'success');
    } else {
        showValidationFeedback(input, 'Password requirements not met', 'error');
    }
}
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Server Configuration
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# JWT Configuration
JWT_ACCESS_SECRET=your-super-secret-access-key-minimum-32-characters
JWT_REFRESH_SECRET=your-super-secret-refresh-key-minimum-32-characters
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Security Configuration
BCRYPT_SALT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_TIME=15

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Configuration Validation

The system automatically validates configuration on startup:

```javascript
// Environment validation
const config = require('./src/config/environment');

// Production requirements
if (NODE_ENV === 'production') {
    // Ensures JWT secrets are set
    // Validates secret strength
    // Enables secure settings
}
```

---

## 🚨 Error Handling

### Custom Error Types

```javascript
// Validation Error
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address",
      "value": "invalid-email"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}

// Authentication Error
{
  "success": false,
  "message": "Invalid credentials",
  "timestamp": "2024-01-15T10:30:00.000Z"
}

// Authorization Error
{
  "success": false,
  "message": "Insufficient permissions",
  "requiredRoles": ["admin"],
  "userRole": "user",
  "timestamp": "2024-01-15T10:30:00.000Z"
}

// Rate Limit Error
{
  "success": false,
  "message": "Too many requests. Please try again later.",
  "retryAfter": 300,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Error Logging

```javascript
// Client errors (4xx)
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "method": "POST",
  "url": "/api/auth/login",
  "ip": "127.0.0.1",
  "userAgent": "Mozilla/5.0...",
  "userId": null,
  "error": {
    "message": "Invalid credentials",
    "statusCode": 401
  }
}

// Server errors (5xx)
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "method": "POST",
  "url": "/api/auth/register",
  "ip": "127.0.0.1",
  "userAgent": "Mozilla/5.0...",
  "userId": null,
  "error": {
    "message": "Internal server error",
    "stack": "Error: ...",
    "statusCode": 500
  }
}
```

---

## 🚥 Rate Limiting

### Implementation

```javascript
const rateLimit = require('express-rate-limit');

// Global rate limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP',
        retryAfter: 900
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Authentication rate limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true // Don't count successful requests
});
```

### Bypass Conditions

- Health check endpoints (`/health`)
- Static file serving
- Successful authentication requests (for auth limiter)

---

## 🚀 Deployment Guide

### Production Configuration

1. **Environment Setup:**
```bash
export NODE_ENV=production
export JWT_ACCESS_SECRET=$(openssl rand -base64 32)
export JWT_REFRESH_SECRET=$(openssl rand -base64 32)
export ENABLE_HTTPS=true
export SECURE_COOKIES=true
```

2. **Security Hardening:**
```javascript
// Production-specific settings
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
    // Enable HTTPS redirect
    // Set secure cookie flags
    // Disable detailed error messages
}
```

3. **Database Migration:**
```javascript
// Replace in-memory storage with database
// PostgreSQL, MySQL, or MongoDB
const User = require('./models/User'); // Database model
```

4. **Redis for Token Storage:**
```javascript
const redis = require('redis');
const client = redis.createClient();

// Store refresh tokens
await client.setex(`refresh_token:${userId}`, 604800, refreshToken);

// Token blacklisting
await client.setex(`blacklist:${token}`, expiryTime, 'true');
```

### Docker Deployment

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 3001

USER node
CMD ["npm", "start"]
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
    depends_on:
      - redis
      - postgres
  
  redis:
    image: redis:alpine
    
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: node_simplified
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASS}
```

---

## 💻 Code Examples

### Backend Integration

#### Custom Middleware
```javascript
const { requireRole, requireOwnership } = require('./middlewares/authMiddleware');

// Protect admin routes
router.get('/admin/users', requireRole('admin'), getUsersController);

// Protect user resources
router.get('/profile/:userId', requireOwnership('userId'), getProfileController);
```

#### Manual Token Verification
```javascript
const { verifyAccessToken } = require('./utils/jwtUtils');

try {
    const decoded = verifyAccessToken(token);
    console.log('User ID:', decoded.userId);
    console.log('Role:', decoded.role);
} catch (error) {
    console.error('Invalid token:', error.message);
}
```

### Frontend Integration

#### React Component Example
```javascript
import { useEffect, useState } from 'react';

function AuthenticatedComponent() {
    const [user, setUser] = useState(null);
    
    useEffect(() => {
        // Check authentication on component mount
        if (auth.isAuthenticated()) {
            setUser(auth.user);
        } else {
            window.location.href = '/login';
        }
    }, []);
    
    const handleLogout = async () => {
        await auth.logout();
        window.location.href = '/login';
    };
    
    return user ? (
        <div>
            <h1>Welcome, {user.username}!</h1>
            <button onClick={handleLogout}>Logout</button>
        </div>
    ) : null;
}
```

#### Vue.js Integration
```javascript
// auth.js plugin
export default {
    install(app) {
        app.config.globalProperties.$auth = new AuthManager();
        
        app.mixin({
            beforeCreate() {
                if (this.$options.requiresAuth && !this.$auth.isAuthenticated()) {
                    this.$router.push('/login');
                }
            }
        });
    }
};

// Component
export default {
    requiresAuth: true,
    data() {
        return {
            user: this.$auth.user
        };
    },
    methods: {
        async logout() {
            await this.$auth.logout();
            this.$router.push('/login');
        }
    }
};
```

#### API Client Integration
```javascript
class ApiClient {
    constructor() {
        this.baseURL = 'http://localhost:3001/api';
    }
    
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };
        
        // Add auth token
        if (auth.isAuthenticated()) {
            config.headers.Authorization = `Bearer ${auth.token}`;
        }
        
        const response = await fetch(url, config);
        
        // Handle token expiry
        if (response.status === 401) {
            const refreshed = await auth.refreshAccessToken();
            if (refreshed) {
                // Retry request
                config.headers.Authorization = `Bearer ${auth.token}`;
                return fetch(url, config);
            } else {
                auth.logout();
                throw new Error('Authentication required');
            }
        }
        
        return response.json();
    }
}
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Token Expiry Issues
**Problem:** Users getting logged out frequently
**Solution:**
- Check token expiry settings
- Ensure refresh token mechanism is working
- Verify token storage in localStorage

```javascript
// Debug token expiry
const payload = JSON.parse(atob(token.split('.')[1]));
const expiryTime = new Date(payload.exp * 1000);
console.log('Token expires at:', expiryTime);
```

#### 2. CORS Errors
**Problem:** Frontend can't connect to API
**Solution:**
- Update CORS configuration
- Check allowed origins
- Verify credentials setting

```javascript
// CORS configuration
const corsOptions = {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
};
```

#### 3. Rate Limiting Issues
**Problem:** Users hitting rate limits too quickly
**Solution:**
- Adjust rate limit settings
- Implement user-specific limiting
- Add rate limit headers

```javascript
// Check rate limit headers
const remaining = response.headers.get('X-RateLimit-Remaining');
const resetTime = response.headers.get('X-RateLimit-Reset');
```

#### 4. Password Validation Errors
**Problem:** Valid passwords being rejected
**Solution:**
- Check regex pattern
- Verify character encoding
- Update validation message

```javascript
// Test password validation
const password = 'TestPassword123!';
const isValid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
console.log('Password valid:', isValid);
```

### Debug Mode

Enable debug mode for detailed logging:

```javascript
// Environment variable
DEBUG_MODE=true

// In code
if (process.env.DEBUG_MODE === 'true') {
    console.log('Authentication debug info:', {
        userId: req.user?.userId,
        token: req.headers.authorization,
        timestamp: new Date().toISOString()
    });
}
```

### Health Checks

Monitor authentication system health:

```javascript
// Health check endpoint
app.get('/api/auth/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        features: {
            registration: true,
            login: true,
            tokenRefresh: true,
            passwordReset: false // Not implemented yet
        }
    });
});
```

---

## 📊 Performance Considerations

### Token Storage
- **localStorage:** Simple but vulnerable to XSS
- **httpOnly cookies:** More secure but requires CSRF protection
- **Memory storage:** Most secure but lost on refresh

### Database Optimization
```sql
-- Index for user lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_active ON users(is_active);

-- Index for token management
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token_hash);
```

### Caching Strategy
```javascript
// Redis cache for user sessions
const userSession = await redis.get(`session:${userId}`);
if (!userSession) {
    const user = await User.findById(userId);
    await redis.setex(`session:${userId}`, 3600, JSON.stringify(user));
}
```

---

## 🔮 Future Enhancements

### Planned Features
- [ ] **Email verification** on registration
- [ ] **Password reset** via email
- [ ] **Two-factor authentication** (2FA)
- [ ] **OAuth integration** (Google, GitHub, etc.)
- [ ] **Session management** dashboard
- [ ] **Audit logging** for security events
- [ ] **Account lockout** after failed attempts
- [ ] **Password history** to prevent reuse

### Security Enhancements
- [ ] **CAPTCHA** for registration/login
- [ ] **Device fingerprinting** for suspicious activity
- [ ] **Geolocation tracking** for login alerts
- [ ] **Brute force protection** with progressive delays
- [ ] **Anomaly detection** for unusual patterns

---

## 📚 Additional Resources

### Documentation
- [JWT.io](https://jwt.io/) - JWT token debugger
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

### Tools
- [Postman Collection](./postman/Node-Simplified-Auth.json) - API testing
- [Insomnia Workspace](./insomnia/auth-workspace.json) - Alternative API client
- [OpenAPI Specification](./docs/openapi.yml) - API documentation

---

**📝 Last Updated:** January 2024  
**🔖 Version:** 1.0.0  
**👨‍💻 Maintainer:** Node Simplified Team

For questions or support, please refer to the troubleshooting section or create an issue in the repository.

