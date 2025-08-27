# 🚀 Authentication API Quick Reference

**Quick access guide for the Node.js Simplified Authentication System**

---

## 🔑 Demo Credentials

```
Email:    admin@example.com
Username: admin
Password: admin123
Role:     admin
```

---

## 📡 Base URLs

```
Frontend: http://localhost:3001
API:      http://localhost:3001/api/auth
Health:   http://localhost:3001/health
Docs:     http://localhost:3001/api/docs
```

---

## 🔓 Public Endpoints

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com", 
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```

### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "emailOrUsername": "john@example.com",
  "password": "SecurePass123!",
  "rememberMe": false
}
```

### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Verify Token
```http
GET /api/auth/verify
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🔒 Protected Endpoints

### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "newusername",
  "email": "new@example.com"
}
```

### Change Password
```http
PUT /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "SecurePass123!",
  "newPassword": "NewSecure456!",
  "confirmNewPassword": "NewSecure456!"
}
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Logout All Devices
```http
POST /api/auth/logout-all
Authorization: Bearer <token>
```

---

## 👨‍💼 Admin Endpoints

### Get All Users
```http
GET /api/auth/users
Authorization: Bearer <admin-token>
```

### Get Auth Statistics
```http
GET /api/auth/admin/stats
Authorization: Bearer <admin-token>
```

### Deactivate User
```http
PUT /api/auth/users/{userId}/deactivate
Authorization: Bearer <admin-token>
```

---

## 📝 Todo Endpoints

### Get User Todos
```http
GET /api/todo
Authorization: Bearer <token>

# With query parameters:
GET /api/todo?page=1&limit=10&status=false&search=nodejs
```

### Create Todo
```http
POST /api/todo
Authorization: Bearer <token>
Content-Type: application/json

{
  "task": "Learn Node.js authentication",
  "status": false
}
```

### Update Todo
```http
PUT /api/todo/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "task": "Updated task description",
  "status": true
}
```

### Delete Todo
```http
DELETE /api/todo/{id}
Authorization: Bearer <token>
```

### Get Todo Statistics
```http
GET /api/todo/stats
Authorization: Bearer <token>
```

---

## 🔐 Password Requirements

- **Minimum 8 characters**
- **1+ uppercase letter** (A-Z)
- **1+ lowercase letter** (a-z)  
- **1+ number** (0-9)
- **1+ special character** (@$!%*?&)

**Valid example:** `SecurePass123!`

---

## 🚥 Rate Limits

| Endpoint | Limit | Window |
|----------|-------|---------|
| Global | 100 requests | 15 min |
| Login/Register | 5 requests | 15 min |
| Registration | 3 requests | 1 hour |
| Password Change | 3 requests | 1 hour |
| Token Refresh | 10 requests | 5 min |

---

## 🎯 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "user": {...},
    "tokens": {...}
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [...],  // For validation errors
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 🔧 Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created (registration) |
| 400 | Validation error |
| 401 | Authentication required |
| 403 | Insufficient permissions |
| 404 | Not found |
| 409 | Conflict (user exists) |
| 429 | Rate limit exceeded |
| 500 | Server error |

---

## ⚡ Quick Start Commands

```bash
# Install dependencies
npm install

# Start development server
PORT=3001 npm start

# Test API health
curl http://localhost:3001/health

# Test registration
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"Test123!","confirmPassword":"Test123!"}'

# Test login  
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"admin@example.com","password":"admin123"}'
```

---

## 🎨 Frontend URLs

- **Login/Register:** `http://localhost:3001/`
- **Dashboard:** `http://localhost:3001/dashboard.html`
- **Direct Dashboard:** After login, auto-redirects

---

## 🔑 JavaScript Integration

```javascript
// Initialize auth manager
const auth = new AuthManager();

// Check authentication
if (auth.isAuthenticated()) {
    console.log('User:', auth.user);
}

// Make authenticated requests
const response = await auth.apiRequest('/api/todo', {
    method: 'POST',
    body: JSON.stringify({ task: 'New task' })
});
```

---

## 🛠️ Environment Variables

```env
NODE_ENV=development
PORT=3001
JWT_ACCESS_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-key-min-32-chars
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
```

---

## 📱 Frontend Features

- ✅ **Real-time validation** with visual feedback
- ✅ **Responsive design** for mobile/desktop
- ✅ **Auto token refresh** keeps users logged in
- ✅ **Keyboard shortcuts** (Alt+1-4, Ctrl+N, Ctrl+L)
- ✅ **Toast notifications** for user feedback
- ✅ **Search and filter** todos
- ✅ **Admin panel** for user management

---

## 🔍 Testing Checklist

- [ ] Register new user
- [ ] Login with email/username
- [ ] Create, edit, delete todos
- [ ] Search and filter todos
- [ ] Change password
- [ ] Logout and logout all
- [ ] Admin: view users and stats
- [ ] Token refresh functionality
- [ ] Rate limiting protection

---

For complete documentation, see: `AUTHENTICATION_DOCUMENTATION.md`

