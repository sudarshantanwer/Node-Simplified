// Main JavaScript for Authentication Pages

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already authenticated
    if (auth.isAuthenticated()) {
        window.location.href = '/dashboard.html';
        return;
    }

    // Initialize page
    initializePage();
    setupEventListeners();
});

function initializePage() {
    // Show login form by default
    showLogin();
}

function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Password confirmation validation
    const confirmPassword = document.getElementById('confirmPassword');
    if (confirmPassword) {
        confirmPassword.addEventListener('input', validatePasswordMatch);
    }

    // Real-time password validation
    const registerPassword = document.getElementById('registerPassword');
    if (registerPassword) {
        registerPassword.addEventListener('input', validatePassword);
    }

    // Real-time username validation
    const registerUsername = document.getElementById('registerUsername');
    if (registerUsername) {
        registerUsername.addEventListener('input', validateUsername);
    }

    // Real-time email validation
    const registerEmail = document.getElementById('registerEmail');
    if (registerEmail) {
        registerEmail.addEventListener('input', validateEmail);
    }
}

// Form Navigation
function showLogin() {
    const loginContainer = document.getElementById('loginContainer');
    const registerContainer = document.getElementById('registerContainer');
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');

    if (loginContainer && registerContainer && loginTab && registerTab) {
        loginContainer.classList.remove('hidden');
        registerContainer.classList.add('hidden');
        
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        
        // Clear forms
        clearForms();
    }
}

function showRegister() {
    const loginContainer = document.getElementById('loginContainer');
    const registerContainer = document.getElementById('registerContainer');
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');

    if (loginContainer && registerContainer && loginTab && registerTab) {
        loginContainer.classList.add('hidden');
        registerContainer.classList.remove('hidden');
        
        loginTab.classList.remove('active');
        registerTab.classList.add('active');
        
        // Clear forms
        clearForms();
    }
}

// Form Handlers
async function handleLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const emailOrUsername = formData.get('emailOrUsername').trim();
    const password = formData.get('password');
    const rememberMe = formData.get('rememberMe') === 'on';

    // Basic validation
    if (!emailOrUsername || !password) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    // Disable form
    const submitBtn = document.getElementById('loginBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';

    try {
        const success = await auth.login(emailOrUsername, password, rememberMe);
        
        if (!success) {
            // Re-enable form on failure
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    } catch (error) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        showToast('Login failed. Please try again.', 'error');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const username = formData.get('username').trim();
    const email = formData.get('email').trim();
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    // Validation
    if (!validateRegistrationForm(username, email, password, confirmPassword)) {
        return;
    }

    // Disable form
    const submitBtn = document.getElementById('registerBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';

    try {
        const success = await auth.register(username, email, password, confirmPassword);
        
        if (!success) {
            // Re-enable form on failure
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    } catch (error) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        showToast('Registration failed. Please try again.', 'error');
    }
}

// Validation Functions
function validateRegistrationForm(username, email, password, confirmPassword) {
    // Check if all fields are filled
    if (!username || !email || !password || !confirmPassword) {
        showToast('Please fill in all fields', 'error');
        return false;
    }

    // Validate username
    if (!isValidUsername(username)) {
        showToast('Username must be 3-30 characters and contain only letters and numbers', 'error');
        return false;
    }

    // Validate email
    if (!isValidEmail(email)) {
        showToast('Please enter a valid email address', 'error');
        return false;
    }

    // Validate password
    if (!isValidPassword(password)) {
        showToast('Password must be at least 8 characters and contain uppercase, lowercase, number, and special character', 'error');
        return false;
    }

    // Check password match
    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return false;
    }

    return true;
}

function isValidUsername(username) {
    const usernameRegex = /^[a-zA-Z0-9]{3,30}$/;
    return usernameRegex.test(username);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
}

// Real-time validation
function validateUsername() {
    const input = document.getElementById('registerUsername');
    const username = input.value.trim();
    
    if (username.length === 0) {
        clearValidationFeedback(input);
        return;
    }

    if (isValidUsername(username)) {
        showValidationFeedback(input, 'Username looks good!', 'success');
    } else {
        showValidationFeedback(input, 'Username must be 3-30 characters, letters and numbers only', 'error');
    }
}

function validateEmail() {
    const input = document.getElementById('registerEmail');
    const email = input.value.trim();
    
    if (email.length === 0) {
        clearValidationFeedback(input);
        return;
    }

    if (isValidEmail(email)) {
        showValidationFeedback(input, 'Email format is valid', 'success');
    } else {
        showValidationFeedback(input, 'Please enter a valid email address', 'error');
    }
}

function validatePassword() {
    const input = document.getElementById('registerPassword');
    const password = input.value;
    
    if (password.length === 0) {
        clearValidationFeedback(input);
        return;
    }

    const requirements = {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        number: /\d/.test(password),
        special: /[@$!%*?&]/.test(password)
    };

    const passed = Object.values(requirements).filter(Boolean).length;
    const total = Object.keys(requirements).length;

    if (passed === total) {
        showValidationFeedback(input, 'Strong password!', 'success');
    } else {
        const missing = [];
        if (!requirements.length) missing.push('8+ characters');
        if (!requirements.lowercase) missing.push('lowercase');
        if (!requirements.uppercase) missing.push('uppercase');
        if (!requirements.number) missing.push('number');
        if (!requirements.special) missing.push('special character');
        
        showValidationFeedback(input, `Missing: ${missing.join(', ')}`, 'warning');
    }
}

function validatePasswordMatch() {
    const passwordInput = document.getElementById('registerPassword');
    const confirmInput = document.getElementById('confirmPassword');
    const password = passwordInput.value;
    const confirmPassword = confirmInput.value;
    
    if (confirmPassword.length === 0) {
        clearValidationFeedback(confirmInput);
        return;
    }

    if (password === confirmPassword) {
        showValidationFeedback(confirmInput, 'Passwords match!', 'success');
    } else {
        showValidationFeedback(confirmInput, 'Passwords do not match', 'error');
    }
}

function showValidationFeedback(input, message, type) {
    // Remove existing feedback
    clearValidationFeedback(input);
    
    // Create feedback element
    const feedback = document.createElement('small');
    feedback.className = `form-feedback text-${type}`;
    feedback.textContent = message;
    
    // Add appropriate styles
    if (type === 'success') {
        input.style.borderColor = 'var(--success-color)';
    } else if (type === 'error') {
        input.style.borderColor = 'var(--error-color)';
    } else if (type === 'warning') {
        input.style.borderColor = 'var(--warning-color)';
    }
    
    // Insert feedback after input
    input.parentNode.appendChild(feedback);
}

function clearValidationFeedback(input) {
    // Remove existing feedback
    const existingFeedback = input.parentNode.querySelector('.form-feedback');
    if (existingFeedback) {
        existingFeedback.remove();
    }
    
    // Reset border color
    input.style.borderColor = '';
}

function clearForms() {
    // Clear all forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.reset();
        
        // Clear validation feedback
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            clearValidationFeedback(input);
        });
        
        // Re-enable submit buttons
        const submitBtns = form.querySelectorAll('button[type="submit"]');
        submitBtns.forEach(btn => {
            btn.disabled = false;
            
            // Reset button text
            if (btn.id === 'loginBtn') {
                btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
            } else if (btn.id === 'registerBtn') {
                btn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
            }
        });
    });
}

// Handle browser back/forward
window.addEventListener('popstate', function(event) {
    // Re-check authentication status
    if (auth.isAuthenticated()) {
        window.location.href = '/dashboard.html';
    }
});

// Add some keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Alt + L for login tab
    if (event.altKey && event.key === 'l') {
        event.preventDefault();
        showLogin();
    }
    
    // Alt + R for register tab
    if (event.altKey && event.key === 'r') {
        event.preventDefault();
        showRegister();
    }
});

// Auto-focus first input when switching tabs
function focusFirstInput() {
    setTimeout(() => {
        const visibleContainer = document.querySelector('.auth-container:not(.hidden)');
        if (visibleContainer) {
            const firstInput = visibleContainer.querySelector('input');
            if (firstInput) {
                firstInput.focus();
            }
        }
    }, 100);
}

// Update the show functions to include auto-focus
const originalShowLogin = showLogin;
const originalShowRegister = showRegister;

showLogin = function() {
    originalShowLogin();
    focusFirstInput();
};

showRegister = function() {
    originalShowRegister();
    focusFirstInput();
};
