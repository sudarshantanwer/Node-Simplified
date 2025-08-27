// Authentication Manager
class AuthManager {
    constructor() {
        this.baseURL = window.location.origin;
        this.token = localStorage.getItem('accessToken');
        this.refreshToken = localStorage.getItem('refreshToken');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        
        // Auto-refresh token 1 minute before expiry
        this.setupTokenRefresh();
    }

    // API Request Helper
    async apiRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Add auth token for protected routes
        if (this.token && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            // Handle token expiry
            if (response.status === 401 && data.message?.includes('expired')) {
                const refreshed = await this.refreshAccessToken();
                if (refreshed) {
                    // Retry the request with new token
                    config.headers.Authorization = `Bearer ${this.token}`;
                    const retryResponse = await fetch(url, config);
                    return await retryResponse.json();
                } else {
                    this.logout();
                    return data;
                }
            }

            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            showToast('Network error. Please check your connection.', 'error');
            throw error;
        }
    }

    // Login
    async login(emailOrUsername, password, rememberMe = false) {
        try {
            showLoading(true);
            
            const response = await this.apiRequest('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    emailOrUsername,
                    password,
                    rememberMe
                })
            });

            if (response.success) {
                this.setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
                this.setUser(response.data.user);
                
                showToast('Login successful! Redirecting...', 'success');
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = '/dashboard.html';
                }, 1000);
                
                return true;
            } else {
                showToast(response.message || 'Login failed', 'error');
                return false;
            }
        } catch (error) {
            showToast('Login failed. Please try again.', 'error');
            return false;
        } finally {
            showLoading(false);
        }
    }

    // Register
    async register(username, email, password, confirmPassword) {
        try {
            showLoading(true);
            
            const response = await this.apiRequest('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    confirmPassword
                })
            });

            if (response.success) {
                this.setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
                this.setUser(response.data.user);
                
                showToast('Registration successful! Welcome!', 'success');
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = '/dashboard.html';
                }, 1000);
                
                return true;
            } else {
                if (response.errors) {
                    // Handle validation errors
                    const errorMessages = response.errors.map(err => err.message).join(', ');
                    showToast(errorMessages, 'error');
                } else {
                    showToast(response.message || 'Registration failed', 'error');
                }
                return false;
            }
        } catch (error) {
            showToast('Registration failed. Please try again.', 'error');
            return false;
        } finally {
            showLoading(false);
        }
    }

    // Refresh Access Token
    async refreshAccessToken() {
        if (!this.refreshToken) {
            return false;
        }

        try {
            const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    refreshToken: this.refreshToken
                })
            });

            const data = await response.json();

            if (data.success) {
                this.setTokens(data.data.tokens.accessToken, data.data.tokens.refreshToken);
                return true;
            } else {
                this.clearTokens();
                return false;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.clearTokens();
            return false;
        }
    }

    // Logout
    async logout() {
        try {
            if (this.token) {
                await this.apiRequest('/api/auth/logout', {
                    method: 'POST',
                    body: JSON.stringify({
                        refreshToken: this.refreshToken
                    })
                });
            }
        } catch (error) {
            console.error('Logout API call failed:', error);
        } finally {
            this.clearTokens();
            showToast('Logged out successfully', 'info');
            window.location.href = '/';
        }
    }

    // Logout from all devices
    async logoutAll() {
        try {
            showLoading(true);
            
            const response = await this.apiRequest('/api/auth/logout-all', {
                method: 'POST'
            });

            if (response.success) {
                this.clearTokens();
                showToast('Logged out from all devices', 'success');
                window.location.href = '/';
            } else {
                showToast(response.message || 'Logout failed', 'error');
            }
        } catch (error) {
            showToast('Logout failed. Please try again.', 'error');
        } finally {
            showLoading(false);
        }
    }

    // Get user profile
    async getUserProfile() {
        try {
            const response = await this.apiRequest('/api/auth/profile');
            
            if (response.success) {
                this.setUser(response.data.user);
                return response.data.user;
            } else {
                console.error('Failed to get user profile:', response.message);
                return null;
            }
        } catch (error) {
            console.error('Get profile failed:', error);
            return null;
        }
    }

    // Change password
    async changePassword(currentPassword, newPassword, confirmNewPassword) {
        try {
            showLoading(true);
            
            const response = await this.apiRequest('/api/auth/change-password', {
                method: 'PUT',
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                    confirmNewPassword
                })
            });

            if (response.success) {
                showToast('Password changed successfully. Please log in again.', 'success');
                
                // Logout after successful password change
                setTimeout(() => {
                    this.logout();
                }, 2000);
                
                return true;
            } else {
                showToast(response.message || 'Password change failed', 'error');
                return false;
            }
        } catch (error) {
            showToast('Password change failed. Please try again.', 'error');
            return false;
        } finally {
            showLoading(false);
        }
    }

    // Token Management
    setTokens(accessToken, refreshToken) {
        this.token = accessToken;
        this.refreshToken = refreshToken;
        localStorage.setItem('accessToken', accessToken);
        if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
        }
    }

    clearTokens() {
        this.token = null;
        this.refreshToken = null;
        this.user = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    }

    setUser(user) {
        this.user = user;
        localStorage.setItem('user', JSON.stringify(user));
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.token && !!this.user;
    }

    // Check if user is admin
    isAdmin() {
        return this.user && this.user.role === 'admin';
    }

    // Setup automatic token refresh
    setupTokenRefresh() {
        if (!this.token) return;

        try {
            // Decode JWT to get expiry time
            const payload = JSON.parse(atob(this.token.split('.')[1]));
            const expiryTime = payload.exp * 1000;
            const currentTime = Date.now();
            const timeUntilExpiry = expiryTime - currentTime;
            
            // Refresh 1 minute before expiry
            const refreshTime = timeUntilExpiry - (60 * 1000);
            
            if (refreshTime > 0) {
                setTimeout(() => {
                    this.refreshAccessToken();
                }, refreshTime);
            }
        } catch (error) {
            console.error('Failed to setup token refresh:', error);
        }
    }

    // Verify token validity
    async verifyToken() {
        if (!this.token) return false;

        try {
            const response = await this.apiRequest('/api/auth/verify');
            return response.success;
        } catch (error) {
            return false;
        }
    }

    // Check authentication on page load
    async checkAuth() {
        if (!this.isAuthenticated()) {
            return false;
        }

        const isValid = await this.verifyToken();
        if (!isValid) {
            this.clearTokens();
            return false;
        }

        return true;
    }
}

// Global auth instance
const auth = new AuthManager();

// Utility Functions
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.className = 'toast';
    }, 4000);
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.toggle('hidden', !show);
    }
}

// Password visibility toggle
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    const icon = button.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// Protect dashboard pages
function requireAuth() {
    if (!auth.isAuthenticated()) {
        window.location.href = '/';
        return false;
    }
    return true;
}

// Show/hide admin elements
function toggleAdminElements() {
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(element => {
        if (auth.isAdmin()) {
            element.classList.add('show');
        } else {
            element.classList.remove('show');
        }
    });
}

// Format date helper
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Debounce helper for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
