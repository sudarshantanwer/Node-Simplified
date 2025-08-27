# 🔐 State-of-the-Art Authentication System

This Node.js application now includes a comprehensive, production-ready authentication system with modern security practices.

## 🚀 Features

### Core Authentication Features
- ✅ **JWT Token-based Authentication** with access and refresh tokens
- ✅ **Secure Password Hashing** using bcrypt with configurable salt rounds
- ✅ **User Registration & Login** with input validation
- ✅ **Token Refresh Mechanism** for seamless user experience
- ✅ **Logout & Logout All Devices** functionality
- ✅ **Password Change** with current password verification

### Security Features
- ✅ **Rate Limiting** on all endpoints with customizable limits
- ✅ **Input Validation** using Joi schemas with detailed error messages
- ✅ **CORS Protection** with configurable origins
- ✅ **Security Headers** (XSS, CSRF, Content-Type, etc.)
- ✅ **Token Blacklisting** for secure logout
- ✅ **Role-based Access Control** (User, Admin, Moderator)
- ✅ **Request Timeout Protection**
- ✅ **Request Size Limiting**

### Advanced Features
- ✅ **Environment Configuration** with validation
- ✅ **Comprehensive Error Handling** with custom error types
- ✅ **User-specific Todo Management** with ownership validation
- ✅ **Admin Panel** with user management and statistics
- ✅ **API Documentation** endpoint
- ✅ **Health Check** with system metrics

## 📋 API Endpoints

### Authentication Endpoints

#### Public Endpoints
```http
POST   /api/auth/register      # Register new user
POST   /api/auth/login         # Login user
POST   /api/auth/refresh       # Refresh access token
GET    /api/auth/verify        # Verify token validity
GET    /api/auth/health        # Auth service health check
```

#### Protected Endpoints
```http
GET    /api/auth/profile       # Get user profile
PUT    /api/auth/profile       # Update user profile
PUT    /api/auth/change-password # Change password
POST   /api/auth/logout        # Logout (invalidate tokens)
POST   /api/auth/logout-all    # Logout from all devices
```

#### Admin Endpoints
```http
GET    /api/auth/users         # Get all users (admin only)
PUT    /api/auth/users/:id/deactivate # Deactivate user (admin only)
GET    /api/auth/admin/stats   # Authentication statistics (admin only)
```

### Todo Endpoints (All Protected)

#### User Endpoints
```http
GET    /api/todo               # Get user's todos (with pagination & search)
GET    /api/todo/stats         # Get user's todo statistics
GET    /api/todo/:id           # Get specific todo
POST   /api/todo               # Create new todo
PUT    /api/todo/:id           # Update todo
DELETE /api/todo/:id           # Delete specific todo
DELETE /api/todo               # Delete all user's todos
```

#### Admin Endpoints
```http
GET    /api/todo/admin/all     # Get all todos from all users (admin only)
DELETE /api/todo/admin/all     # Delete all todos from all users (admin only)
```

### System Endpoints
```http
GET    /health                 # System health check
GET    /api/docs               # API documentation
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# JWT Configuration (REQUIRED FOR PRODUCTION)
JWT_ACCESS_SECRET=your-super-secret-access-key-minimum-32-characters
JWT_REFRESH_SECRET=your-super-secret-refresh-key-minimum-32-characters
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Security Configuration
BCRYPT_SALT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_TIME=15
MAX_REQUEST_SIZE=10mb

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Production Settings
ENABLE_HTTPS=true
TRUST_PROXY=true
SECURE_COOKIES=true
```

### Default Users

The system comes with a default admin user:
- **Username**: `admin`
- **Email**: `admin@example.com`
- **Password**: `admin123`
- **Role**: `admin`

## 🚀 Quick Start

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the Server**:
   ```bash
   npm start
   ```

3. **Test the API**:
   ```bash
   # Health check
   curl http://localhost:3000/health
   
   # View API documentation
   curl http://localhost:3000/api/docs
   ```

## 📖 Usage Examples

### 1. User Registration
```javascript
const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        username: 'johndoe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!'
    })
});

const data = await response.json();
console.log(data.data.tokens.accessToken); // JWT access token
```

### 2. User Login
```javascript
const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        emailOrUsername: 'john@example.com',
        password: 'SecurePass123!',
        rememberMe: true
    })
});

const data = await response.json();
const token = data.data.tokens.accessToken;
```

### 3. Accessing Protected Routes
```javascript
const response = await fetch('/api/todo', {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`
    }
});

const todos = await response.json();
```

### 4. Creating a Todo
```javascript
const response = await fetch('/api/todo', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        task: 'Learn Node.js Authentication',
        status: false
    })
});
```

### 5. Token Refresh
```javascript
const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        refreshToken: refreshToken
    })
});

const data = await response.json();
const newAccessToken = data.data.tokens.accessToken;
```

## 🔒 Security Features

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter  
- At least one number
- At least one special character (@$!%*?&)

### Rate Limiting
- **Global**: 100 requests per 15 minutes per IP
- **Authentication**: 5 requests per 15 minutes per IP
- **Registration**: 3 requests per hour per IP
- **Password Change**: 3 requests per hour per IP

### JWT Token Security
- **Access tokens**: Short-lived (15 minutes)
- **Refresh tokens**: Long-lived (7 days)
- **Token rotation**: New refresh token on each refresh
- **Token blacklisting**: Immediate invalidation on logout

### Input Validation
- All inputs are validated using Joi schemas
- SQL injection protection
- XSS protection through input sanitization
- Request size limiting

## 🛡️ Security Headers

The application automatically sets the following security headers:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'...
Strict-Transport-Security: max-age=31536000 (HTTPS only)
```

## 📊 Monitoring & Logging

### Health Check Information
```json
{
  "success": true,
  "message": "Node-Simplified API is healthy",
  "environment": "development",
  "uptime": 125.67,
  "memory": {
    "used": 45.23,
    "total": 67.89
  }
}
```

### Error Logging
- Automatic error logging with request context
- Different log levels for development and production
- Request tracking with user identification

## 🔧 Customization

### Adding New Roles
Edit the validation schema in `src/validations/authValidation.js`:
```javascript
const roleSchema = Joi.string()
    .valid('user', 'admin', 'moderator', 'newrole')
    .default('user');
```

### Custom Rate Limits
Modify rate limiting in `src/routes/authRoutes.js`:
```javascript
const customLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 20, // limit each IP to 20 requests per windowMs
    message: 'Custom rate limit message'
});
```

### Adding New Validation Rules
Create new validation schemas in `src/validations/authValidation.js`:
```javascript
const customSchema = Joi.object({
    field: Joi.string().required(),
    // Add more validation rules
});
```

## 📝 Production Deployment

### Environment Checklist
- [ ] Set strong JWT secrets (minimum 32 characters)
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS
- [ ] Set secure cookie flags
- [ ] Configure rate limiting for your use case
- [ ] Set up proper logging and monitoring
- [ ] Configure database (when migrating from in-memory storage)

### Security Checklist
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS in production
- [ ] Set up proper firewall rules
- [ ] Configure reverse proxy (nginx/apache)
- [ ] Enable request logging
- [ ] Set up monitoring and alerting
- [ ] Regular security updates

## 🤝 Contributing

When adding new features:
1. Follow the existing error handling patterns
2. Add proper input validation
3. Include appropriate rate limiting
4. Add comprehensive logging
5. Update this documentation

## 📄 License

This authentication system is part of the Node-Simplified project and follows the same licensing terms.

---

**🎉 Congratulations!** You now have a production-ready authentication system with state-of-the-art security features!
