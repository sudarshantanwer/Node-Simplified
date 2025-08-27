// Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!requireAuth()) {
        return;
    }

    // Initialize dashboard
    initializeDashboard();
});

async function initializeDashboard() {
    // Load user profile
    await loadUserProfile();
    
    // Setup navigation
    setupNavigation();
    
    // Setup event listeners
    setupEventListeners();
    
    // Show admin elements if user is admin
    toggleAdminElements();
    
    // Load initial section (todos)
    showSection('todos');
}

async function loadUserProfile() {
    try {
        const user = await auth.getUserProfile();
        if (user) {
            updateUserDisplay(user);
        }
    } catch (error) {
        console.error('Failed to load user profile:', error);
    }
}

function updateUserDisplay(user) {
    // Update user info in sidebar
    const userNameElement = document.getElementById('userName');
    const userRoleElement = document.getElementById('userRole');
    
    if (userNameElement) userNameElement.textContent = user.username;
    if (userRoleElement) userRoleElement.textContent = user.role;

    // Update profile section
    const profileUsernameElement = document.getElementById('profileUsername');
    const profileEmailElement = document.getElementById('profileEmail');
    const profileRoleElement = document.getElementById('profileRole');
    
    if (profileUsernameElement) profileUsernameElement.textContent = user.username;
    if (profileEmailElement) profileEmailElement.textContent = user.email;
    if (profileRoleElement) {
        profileRoleElement.textContent = user.role;
        profileRoleElement.className = `role-badge ${user.role}`;
    }
}

function setupNavigation() {
    // Sidebar navigation
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
        });
    });
}

function setupEventListeners() {
    // Change password form
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', handleChangePassword);
    }

    // Admin functions
    if (auth.isAdmin()) {
        loadAdminData();
    }
}

// Section Management
function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.dashboard-section');
    sections.forEach(section => section.classList.add('hidden'));
    
    // Show target section
    const targetSection = document.getElementById(`${sectionName}Section`);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }
    
    // Update page title
    const titles = {
        todos: 'My Todos',
        stats: 'Statistics',
        profile: 'Profile',
        admin: 'Admin Panel'
    };
    
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle && titles[sectionName]) {
        pageTitle.textContent = titles[sectionName];
    }
    
    // Update navigation
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    
    const activeNav = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
    if (activeNav) {
        activeNav.classList.add('active');
    }
    
    // Load section-specific data
    switch (sectionName) {
        case 'stats':
            loadStatsSection();
            break;
        case 'admin':
            if (auth.isAdmin()) {
                loadAdminSection();
            }
            break;
    }
}

// Statistics Section
async function loadStatsSection() {
    try {
        const response = await auth.apiRequest('/api/todo/stats');
        
        if (response.success) {
            const stats = response.data.stats;
            updateStatsDisplay(stats);
        }
    } catch (error) {
        console.error('Failed to load stats:', error);
        showToast('Failed to load statistics', 'error');
    }
}

function updateStatsDisplay(stats) {
    const elements = {
        statsTotalTodos: stats.total,
        statsCompletedTodos: stats.completed,
        statsPendingTodos: stats.pending,
        statsRecentTodos: stats.recentlyCreated
    };

    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

// Admin Section
async function loadAdminData() {
    if (!auth.isAdmin()) return;

    try {
        const [authStatsResponse, usersResponse] = await Promise.all([
            auth.apiRequest('/api/auth/admin/stats'),
            auth.apiRequest('/api/auth/users')
        ]);

        if (authStatsResponse.success) {
            updateAdminStats(authStatsResponse.data.stats);
        }

        if (usersResponse.success) {
            displayAdminUsers(usersResponse.data.users);
        }
    } catch (error) {
        console.error('Failed to load admin data:', error);
        showToast('Failed to load admin data', 'error');
    }
}

async function loadAdminSection() {
    await loadAdminData();
}

function updateAdminStats(stats) {
    const elements = {
        adminTotalUsers: stats.totalUsers,
        adminActiveUsers: stats.activeUsers,
        adminTotalTodos: stats.totalUsers // This should be updated to get total todos from API
    };

    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

function displayAdminUsers(users) {
    const adminUsers = document.getElementById('adminUsers');
    if (!adminUsers) return;

    const usersHtml = `
        <h3>User Management</h3>
        <div class="admin-users-grid">
            ${users.map(user => `
                <div class="user-card">
                    <div class="user-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="user-info">
                        <h4>${escapeHtml(user.username)}</h4>
                        <p>${escapeHtml(user.email)}</p>
                        <span class="role-badge ${user.role}">${user.role}</span>
                        ${user.lastLogin ? `<small>Last login: ${formatDate(user.lastLogin)}</small>` : '<small>Never logged in</small>'}
                    </div>
                    <div class="user-actions">
                        ${user.isActive ? 
                            `<button class="btn btn-sm btn-outline text-warning" onclick="deactivateUser(${user.id})">
                                <i class="fas fa-ban"></i> Deactivate
                            </button>` :
                            `<span class="text-error">Inactive</span>`
                        }
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    adminUsers.innerHTML = usersHtml;
}

// Change Password
async function handleChangePassword(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmNewPassword = formData.get('confirmNewPassword');

    // Validation
    if (!currentPassword || !newPassword || !confirmNewPassword) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    if (newPassword !== confirmNewPassword) {
        showToast('New passwords do not match', 'error');
        return;
    }

    if (!isValidPassword(newPassword)) {
        showToast('New password does not meet requirements', 'error');
        return;
    }

    // Submit
    const success = await auth.changePassword(currentPassword, newPassword, confirmNewPassword);
    
    if (success) {
        closeChangePasswordModal();
    }
}

// Password validation (same as registration)
function isValidPassword(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Modal Management
function showChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.getElementById('currentPassword').focus();
    }
}

function closeChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    if (modal) {
        modal.classList.add('hidden');
        document.getElementById('changePasswordForm').reset();
    }
}

// Admin Functions
async function deactivateUser(userId) {
    if (!auth.isAdmin()) {
        showToast('Access denied', 'error');
        return;
    }

    if (!confirm('Are you sure you want to deactivate this user?')) {
        return;
    }

    try {
        const response = await auth.apiRequest(`/api/auth/users/${userId}/deactivate`, {
            method: 'PUT'
        });

        if (response.success) {
            showToast('User deactivated successfully', 'success');
            await loadAdminData();
        } else {
            showToast(response.message || 'Failed to deactivate user', 'error');
        }
    } catch (error) {
        showToast('Error deactivating user', 'error');
    }
}

// Logout Functions
async function logout() {
    await auth.logout();
}

async function logoutAll() {
    if (confirm('This will log you out from all devices. Continue?')) {
        await auth.logoutAll();
    }
}

// Sidebar Toggle for Mobile
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainDashboard = document.querySelector('.main-dashboard');
    
    if (sidebar && mainDashboard) {
        sidebar.classList.toggle('mobile-open');
        mainDashboard.classList.toggle('sidebar-open');
    }
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', function(event) {
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    
    if (sidebar && 
        !sidebar.contains(event.target) && 
        !sidebarToggle.contains(event.target) &&
        sidebar.classList.contains('mobile-open')) {
        sidebar.classList.remove('mobile-open');
        document.querySelector('.main-dashboard').classList.remove('sidebar-open');
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Alt + 1-4 for quick navigation
    if (event.altKey) {
        switch(event.key) {
            case '1':
                event.preventDefault();
                showSection('todos');
                break;
            case '2':
                event.preventDefault();
                showSection('stats');
                break;
            case '3':
                event.preventDefault();
                showSection('profile');
                break;
            case '4':
                if (auth.isAdmin()) {
                    event.preventDefault();
                    showSection('admin');
                }
                break;
        }
    }
    
    // Ctrl + L for logout
    if (event.ctrlKey && event.key === 'l') {
        event.preventDefault();
        logout();
    }
});

// Auto-refresh data every 5 minutes
setInterval(() => {
    if (window.todoManager) {
        window.todoManager.loadTodos();
        window.todoManager.loadStats();
    }
    
    if (auth.isAdmin()) {
        loadAdminData();
    }
}, 5 * 60 * 1000); // 5 minutes

// Add custom CSS for admin users list
const style = document.createElement('style');
style.textContent = `
    .admin-users-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: var(--spacing-lg);
        margin-top: var(--spacing-lg);
    }
    
    .user-card {
        background: var(--bg-primary);
        border-radius: var(--radius-lg);
        padding: var(--spacing-lg);
        box-shadow: var(--shadow-md);
        border: 1px solid var(--border-light);
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
    }
    
    .user-card .user-avatar {
        width: 50px;
        height: 50px;
        background: var(--primary-color);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-white);
        font-size: 1.2rem;
        flex-shrink: 0;
    }
    
    .user-card .user-info {
        flex: 1;
    }
    
    .user-card .user-info h4 {
        margin: 0 0 var(--spacing-xs) 0;
        color: var(--text-primary);
    }
    
    .user-card .user-info p {
        margin: 0 0 var(--spacing-xs) 0;
        color: var(--text-secondary);
        font-size: 0.9rem;
    }
    
    .user-card .user-info small {
        color: var(--text-light);
        font-size: 0.8rem;
    }
    
    .user-card .role-badge.admin {
        background: var(--error-color);
    }
    
    .user-card .role-badge.moderator {
        background: var(--warning-color);
    }
    
    .user-card .role-badge.user {
        background: var(--info-color);
    }
    
    .btn-sm {
        padding: var(--spacing-sm) var(--spacing-md);
        font-size: 0.8rem;
        min-height: 32px;
    }
    
    @media (max-width: 768px) {
        .sidebar.mobile-open {
            transform: translateX(0);
            position: fixed;
            z-index: 1000;
            height: 100vh;
        }
        
        .main-dashboard.sidebar-open::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
        }
    }
`;

document.head.appendChild(style);
