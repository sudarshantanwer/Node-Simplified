# 🚀 Node.js Simplified - Complete Authentication System

This repository demonstrates a **state-of-the-art authentication system** built with Node.js, Express, and modern security practices. It includes both a powerful backend API and a beautiful, responsive frontend interface.

## ✨ Features

### 🔐 **Authentication & Security**
- **JWT-based authentication** with access and refresh tokens
- **Secure password hashing** using bcrypt with 12 salt rounds
- **Input validation** with Joi schemas and real-time feedback
- **Rate limiting** to prevent brute force attacks
- **CORS protection** and security headers
- **Role-based access control** (User, Admin, Moderator)
- **Token blacklisting** for secure logout

### 🎨 **Modern Frontend**
- **Responsive web interface** with professional design
- **Real-time form validation** with visual feedback
- **Beautiful dashboard** with sidebar navigation
- **Todo management** with search, filter, and CRUD operations
- **Admin panel** for user management
- **Mobile-optimized** design

### 📱 **User Experience**
- **Smooth animations** and transitions
- **Toast notifications** for instant feedback
- **Keyboard shortcuts** for power users
- **Auto-refresh** functionality
- **Persistent sessions** with automatic token refresh

## 🛠️ Prerequisites
- [Node.js](https://nodejs.org) (v14.x or above)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- Modern web browser (Chrome, Firefox, Safari, Edge)

## 🚀 Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sudarshantanwer/Node-Simplified.git
   cd Node-Simplified
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   PORT=3001 npm start
   ```

4. **Open the application:**
   ```
   http://localhost:3001
   ```

## 🔑 Demo Credentials

### Admin Account (Full Access)
- **Email:** `admin@example.com`
- **Username:** `admin`
- **Password:** `admin123`
- **Role:** Admin (access to admin panel)

### Or Create Your Own Account
Register with any username (3-30 chars) and a strong password that includes:
- At least 8 characters
- Uppercase and lowercase letters
- Numbers and special characters (@$!%*?&)

## 📚 Complete Documentation

### 🎯 **Quick References**
- **[API Quick Reference](API_QUICK_REFERENCE.md)** - Essential endpoints and examples
- **[Demo Credentials & Testing](API_QUICK_REFERENCE.md#-demo-credentials)** - Login info and quick commands

### 📖 **Comprehensive Guides**
- **[Authentication Documentation](AUTHENTICATION_DOCUMENTATION.md)** - Complete technical reference
- **[Frontend User Guide](FRONTEND_GUIDE.md)** - UI features and user experience
- **[Authentication Features](AUTHENTICATION_GUIDE.md)** - Security features and usage

### 🧪 **Testing & Integration**
- **[Postman Collection](docs/postman/)** - Ready-to-use API testing
- **[Code Examples](AUTHENTICATION_DOCUMENTATION.md#-code-examples)** - React, Vue, vanilla JS integration
- **[Deployment Guide](AUTHENTICATION_DOCUMENTATION.md#-deployment-guide)** - Production setup

## 🚀 **Key Features Implemented**

### 🔐 **Authentication & Security**
- ✅ **JWT Authentication** (15min access + 7day refresh tokens)
- ✅ **Secure Password Hashing** (bcrypt with 12 salt rounds)
- ✅ **Input Validation** (Joi schemas with real-time feedback)
- ✅ **Rate Limiting** (Prevents brute force attacks)
- ✅ **Role-based Access** (User/Admin/Moderator roles)
- ✅ **Token Blacklisting** (Secure logout functionality)

### 🎨 **Modern Frontend**
- ✅ **Responsive Design** (Mobile-first approach)
- ✅ **Real-time Validation** (Live password strength checking)
- ✅ **Professional UI** (Modern gradients and animations)
- ✅ **Smart Navigation** (Auto-redirects and keyboard shortcuts)
- ✅ **Toast Notifications** (Instant user feedback)
- ✅ **Admin Dashboard** (User management interface)

### 📱 **User Experience**
- ✅ **Auto Token Refresh** (Seamless session management)
- ✅ **Search & Filter** (Advanced todo management)
- ✅ **Pagination Support** (Efficient data loading)
- ✅ **Keyboard Shortcuts** (Power user features)
- ✅ **Mobile Optimization** (Touch-friendly interface)
- ✅ **Offline Handling** (Graceful error management)

## 🛠️ **Technical Stack**

### Backend
- **Node.js** + **Express.js** - Server framework
- **JWT** (jsonwebtoken) - Authentication tokens
- **bcrypt** - Password hashing
- **Joi** - Input validation
- **express-rate-limit** - Rate limiting
- **CORS** - Cross-origin resource sharing

### Frontend
- **Vanilla JavaScript** - No framework dependencies
- **CSS3** - Modern styling with variables and animations
- **HTML5** - Semantic markup with accessibility
- **Font Awesome** - Professional icons
- **Responsive Design** - Mobile-first approach

### Security
- **12-round bcrypt** hashing
- **JWT token rotation** on refresh
- **Rate limiting** (5 attempts per 15min)
- **Input sanitization** and validation
- **Security headers** (XSS, CSRF, etc.)
- **Token blacklisting** for logout

## 🎯 **API Endpoints Overview**

| Category | Endpoint | Method | Description |
|----------|----------|---------|-------------|
| **Auth** | `/api/auth/register` | POST | Register new user |
| **Auth** | `/api/auth/login` | POST | User login |
| **Auth** | `/api/auth/refresh` | POST | Refresh tokens |
| **Auth** | `/api/auth/logout` | POST | Logout user |
| **Profile** | `/api/auth/profile` | GET/PUT | User profile |
| **Profile** | `/api/auth/change-password` | PUT | Change password |
| **Admin** | `/api/auth/users` | GET | All users (admin) |
| **Admin** | `/api/auth/admin/stats` | GET | System stats (admin) |
| **Todos** | `/api/todo` | GET/POST/DELETE | Todo CRUD |
| **Todos** | `/api/todo/:id` | GET/PUT/DELETE | Single todo |
| **Todos** | `/api/todo/stats` | GET | Todo statistics |

*Complete API documentation: [AUTHENTICATION_DOCUMENTATION.md](AUTHENTICATION_DOCUMENTATION.md)*

## 🔧 **Quick Testing**

### Test with cURL
```bash
# Login with demo admin account
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"admin@example.com","password":"admin123"}'

# Register new user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"Test123!","confirmPassword":"Test123!"}'
```

### Test with Frontend
1. Visit `http://localhost:3001`
2. Use demo credentials: `admin@example.com` / `admin123`
3. Explore the dashboard, create todos, check admin panel

### Test with Postman
1. Import collection: `docs/postman/Node-Simplified-Auth.postman_collection.json`
2. Import environment: `docs/postman/Node-Simplified-Environment.postman_environment.json`
3. Run "Login User" request to auto-configure tokens

## 🚀 **Production Deployment**

### Environment Setup
```bash
# Required environment variables
export NODE_ENV=production
export JWT_ACCESS_SECRET=$(openssl rand -base64 32)
export JWT_REFRESH_SECRET=$(openssl rand -base64 32)
export PORT=3001
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

*Complete deployment guide: [AUTHENTICATION_DOCUMENTATION.md#deployment-guide](AUTHENTICATION_DOCUMENTATION.md#-deployment-guide)*
