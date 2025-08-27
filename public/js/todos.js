// Todo Management JavaScript

class TodoManager {
    constructor() {
        this.todos = [];
        this.filteredTodos = [];
        this.currentFilter = 'all';
        this.currentSearch = '';
        this.stats = {
            total: 0,
            completed: 0,
            pending: 0,
            recentlyCreated: 0
        };
        
        this.init();
    }

    async init() {
        await this.loadTodos();
        await this.loadStats();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add todo form
        const addTodoForm = document.getElementById('addTodoForm');
        if (addTodoForm) {
            addTodoForm.addEventListener('submit', this.handleAddTodo.bind(this));
        }

        // Edit todo form
        const editTodoForm = document.getElementById('editTodoForm');
        if (editTodoForm) {
            editTodoForm.addEventListener('submit', this.handleEditTodo.bind(this));
        }

        // Search functionality
        const searchInput = document.getElementById('searchTodos');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(this.handleSearch.bind(this), 300));
        }

        // Filter functionality
        const filterSelect = document.getElementById('filterStatus');
        if (filterSelect) {
            filterSelect.addEventListener('change', this.handleFilter.bind(this));
        }
    }

    // Load all todos
    async loadTodos() {
        try {
            const response = await auth.apiRequest('/api/todo');
            
            if (response.success) {
                this.todos = response.data.tasks || [];
                this.applyFilters();
                this.renderTodos();
                this.updateHeaderStats();
            } else {
                console.error('Failed to load todos:', response.message);
                showToast('Failed to load todos', 'error');
            }
        } catch (error) {
            console.error('Error loading todos:', error);
            showToast('Error loading todos', 'error');
        }
    }

    // Load todo statistics
    async loadStats() {
        try {
            const response = await auth.apiRequest('/api/todo/stats');
            
            if (response.success) {
                this.stats = response.data.stats;
                this.updateStatsDisplay();
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    // Add new todo
    async handleAddTodo(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const task = formData.get('task').trim();
        const status = formData.get('status') === 'on';

        if (!task) {
            showToast('Please enter a task description', 'error');
            return;
        }

        try {
            const response = await auth.apiRequest('/api/todo', {
                method: 'POST',
                body: JSON.stringify({ task, status })
            });

            if (response.success) {
                showToast('Todo added successfully!', 'success');
                this.closeAddTodoModal();
                await this.loadTodos();
                await this.loadStats();
            } else {
                showToast(response.error || 'Failed to add todo', 'error');
            }
        } catch (error) {
            showToast('Error adding todo', 'error');
        }
    }

    // Edit existing todo
    async handleEditTodo(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const id = parseInt(document.getElementById('editTodoId').value);
        const task = formData.get('task').trim();
        const status = formData.get('status') === 'on';

        if (!task) {
            showToast('Please enter a task description', 'error');
            return;
        }

        try {
            const response = await auth.apiRequest(`/api/todo/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ task, status })
            });

            if (response.success) {
                showToast('Todo updated successfully!', 'success');
                this.closeEditTodoModal();
                await this.loadTodos();
                await this.loadStats();
            } else {
                showToast(response.error || 'Failed to update todo', 'error');
            }
        } catch (error) {
            showToast('Error updating todo', 'error');
        }
    }

    // Delete todo
    async deleteTodo(id) {
        if (!confirm('Are you sure you want to delete this todo?')) {
            return;
        }

        try {
            const response = await auth.apiRequest(`/api/todo/${id}`, {
                method: 'DELETE'
            });

            if (response.success) {
                showToast('Todo deleted successfully!', 'success');
                await this.loadTodos();
                await this.loadStats();
            } else {
                showToast(response.error || 'Failed to delete todo', 'error');
            }
        } catch (error) {
            showToast('Error deleting todo', 'error');
        }
    }

    // Delete all todos
    async deleteAllTodos() {
        if (!confirm('Are you sure you want to delete ALL your todos? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await auth.apiRequest('/api/todo', {
                method: 'DELETE'
            });

            if (response.success) {
                showToast('All todos deleted successfully!', 'success');
                await this.loadTodos();
                await this.loadStats();
            } else {
                showToast(response.error || 'Failed to delete todos', 'error');
            }
        } catch (error) {
            showToast('Error deleting todos', 'error');
        }
    }

    // Toggle todo status
    async toggleTodoStatus(id, currentStatus) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        try {
            const response = await auth.apiRequest(`/api/todo/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ 
                    task: todo.task, 
                    status: !currentStatus 
                })
            });

            if (response.success) {
                showToast(`Todo marked as ${!currentStatus ? 'completed' : 'pending'}!`, 'success');
                await this.loadTodos();
                await this.loadStats();
            } else {
                showToast(response.error || 'Failed to update todo', 'error');
            }
        } catch (error) {
            showToast('Error updating todo', 'error');
        }
    }

    // Search functionality
    handleSearch(event) {
        this.currentSearch = event.target.value.toLowerCase().trim();
        this.applyFilters();
        this.renderTodos();
    }

    // Filter functionality
    handleFilter(event) {
        this.currentFilter = event.target.value;
        this.applyFilters();
        this.renderTodos();
    }

    // Apply current filters and search
    applyFilters() {
        let filtered = [...this.todos];

        // Apply status filter
        if (this.currentFilter !== 'all') {
            const statusFilter = this.currentFilter === 'true';
            filtered = filtered.filter(todo => todo.status === statusFilter);
        }

        // Apply search filter
        if (this.currentSearch) {
            filtered = filtered.filter(todo => 
                todo.task.toLowerCase().includes(this.currentSearch)
            );
        }

        this.filteredTodos = filtered;
    }

    // Render todos in the grid
    renderTodos() {
        const todosGrid = document.getElementById('todosGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (!todosGrid || !emptyState) return;

        if (this.filteredTodos.length === 0) {
            todosGrid.style.display = 'none';
            emptyState.classList.remove('hidden');
            
            // Update empty state message based on filters
            const emptyTitle = emptyState.querySelector('h3');
            const emptyText = emptyState.querySelector('p');
            
            if (this.currentSearch || this.currentFilter !== 'all') {
                emptyTitle.textContent = 'No todos found';
                emptyText.textContent = 'Try adjusting your search or filter criteria.';
            } else {
                emptyTitle.textContent = 'No todos yet';
                emptyText.textContent = 'Create your first todo to get started!';
            }
        } else {
            todosGrid.style.display = 'grid';
            emptyState.classList.add('hidden');
            
            todosGrid.innerHTML = this.filteredTodos.map(todo => this.createTodoCard(todo)).join('');
        }
    }

    // Create todo card HTML
    createTodoCard(todo) {
        const statusClass = todo.status ? 'completed' : 'pending';
        const statusIcon = todo.status ? 'fa-check-circle' : 'fa-clock';
        const statusText = todo.status ? 'Completed' : 'Pending';
        
        return `
            <div class="todo-card ${statusClass}">
                <div class="todo-header">
                    <div class="todo-status ${statusClass}">
                        <i class="fas ${statusIcon}"></i>
                        ${statusText}
                    </div>
                    <div class="todo-actions">
                        <button class="btn btn-icon btn-outline" onclick="todoManager.editTodo(${todo.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-icon btn-outline" onclick="todoManager.toggleTodoStatus(${todo.id}, ${todo.status})" title="Toggle Status">
                            <i class="fas ${todo.status ? 'fa-undo' : 'fa-check'}"></i>
                        </button>
                        <button class="btn btn-icon btn-outline text-error" onclick="todoManager.deleteTodo(${todo.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="todo-task">${this.escapeHtml(todo.task)}</div>
                <div class="todo-meta">
                    Created: ${formatDate(todo.createdAt)}
                    ${todo.updatedAt !== todo.createdAt ? `<br>Updated: ${formatDate(todo.updatedAt)}` : ''}
                </div>
            </div>
        `;
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Edit todo - populate modal
    editTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        document.getElementById('editTodoId').value = todo.id;
        document.getElementById('editTodoTask').value = todo.task;
        document.getElementById('editTodoStatus').checked = todo.status;
        
        this.showEditTodoModal();
    }

    // Update header statistics
    updateHeaderStats() {
        const totalElement = document.getElementById('totalTodos');
        const completedElement = document.getElementById('completedTodos');
        const pendingElement = document.getElementById('pendingTodos');
        
        if (totalElement) totalElement.textContent = this.todos.length;
        if (completedElement) completedElement.textContent = this.todos.filter(t => t.status).length;
        if (pendingElement) pendingElement.textContent = this.todos.filter(t => !t.status).length;
    }

    // Update statistics display
    updateStatsDisplay() {
        const elements = {
            statsTotalTodos: this.stats.total,
            statsCompletedTodos: this.stats.completed,
            statsPendingTodos: this.stats.pending,
            statsRecentTodos: this.stats.recentlyCreated
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    // Modal Management
    showAddTodoModal() {
        const modal = document.getElementById('addTodoModal');
        if (modal) {
            modal.classList.remove('hidden');
            document.getElementById('todoTask').focus();
        }
    }

    closeAddTodoModal() {
        const modal = document.getElementById('addTodoModal');
        if (modal) {
            modal.classList.add('hidden');
            document.getElementById('addTodoForm').reset();
        }
    }

    showEditTodoModal() {
        const modal = document.getElementById('editTodoModal');
        if (modal) {
            modal.classList.remove('hidden');
            document.getElementById('editTodoTask').focus();
        }
    }

    closeEditTodoModal() {
        const modal = document.getElementById('editTodoModal');
        if (modal) {
            modal.classList.add('hidden');
            document.getElementById('editTodoForm').reset();
        }
    }
}

// Global functions for modal management
function showAddTodoModal() {
    if (window.todoManager) {
        window.todoManager.showAddTodoModal();
    }
}

function closeAddTodoModal() {
    if (window.todoManager) {
        window.todoManager.closeAddTodoModal();
    }
}

function closeEditTodoModal() {
    if (window.todoManager) {
        window.todoManager.closeEditTodoModal();
    }
}

// Global search function
function searchTodos() {
    const searchInput = document.getElementById('searchTodos');
    if (searchInput && window.todoManager) {
        window.todoManager.handleSearch({ target: searchInput });
    }
}

// Global filter function
function filterTodos() {
    const filterSelect = document.getElementById('filterStatus');
    if (filterSelect && window.todoManager) {
        window.todoManager.handleFilter({ target: filterSelect });
    }
}

// Close modals when clicking outside
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        const modal = event.target;
        modal.classList.add('hidden');
        
        // Reset forms
        const forms = modal.querySelectorAll('form');
        forms.forEach(form => form.reset());
    }
});

// Keyboard shortcuts for modals
document.addEventListener('keydown', function(event) {
    // Close modals with Escape key
    if (event.key === 'Escape') {
        const openModals = document.querySelectorAll('.modal:not(.hidden)');
        openModals.forEach(modal => {
            modal.classList.add('hidden');
            const forms = modal.querySelectorAll('form');
            forms.forEach(form => form.reset());
        });
    }
    
    // Quick add todo with Ctrl+N
    if (event.ctrlKey && event.key === 'n') {
        event.preventDefault();
        showAddTodoModal();
    }
});

// Initialize todo manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize on dashboard page
    if (document.getElementById('todosSection')) {
        window.todoManager = new TodoManager();
    }
});
