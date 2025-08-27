const TodoModel = require("../models/todoModel");
const { requireRole } = require("../middlewares/authMiddleware");

/**
 * Create a new task for the authenticated user
 */
exports.createNewTask = (req, res) => {
    try {
        const { task, status } = req.body;
        const userId = req.user.userId;

        // Validate input
        if (!task || task.trim() === '') {
            return res.status(400).json({ 
                success: false,
                error: 'Task is required and cannot be empty',
                timestamp: new Date().toISOString()
            });
        }

        // Create new task
        const newTask = TodoModel.createTodo({ task: task.trim(), status }, userId);
        
        res.status(201).json({ 
            success: true,
            message: "New Task Created", 
            data: { task: newTask },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error while creating task',
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * Update a task (user can only update their own tasks)
 */
exports.updateTask = (req, res) => {
    try {
        const { task, status } = req.body;
        const id = parseInt(req.params.id);
        const userId = req.user.userId;

        // Validate input
        if (!task || task.trim() === '' || status === undefined) {
            return res.status(400).json({ 
                success: false,
                error: 'Task and status are required',
                timestamp: new Date().toISOString()
            });
        }

        // Update task
        const updatedTask = TodoModel.updateTodo(id, { task: task.trim(), status }, userId);
        
        if (updatedTask === null) {
            return res.status(404).json({ 
                success: false,
                error: 'Task not found',
                timestamp: new Date().toISOString()
            });
        }

        if (updatedTask === false) {
            return res.status(403).json({ 
                success: false,
                error: 'Access denied. You can only update your own tasks.',
                timestamp: new Date().toISOString()
            });
        }

        res.json({ 
            success: true,
            message: "Task Updated", 
            data: { task: updatedTask },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error while updating task',
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * Get all tasks for the authenticated user (with optional pagination and filtering)
 */
exports.getAllTasks = (req, res) => {
    try {
        const userId = req.user.userId;
        const { page, limit, status, search } = req.query;

        let userTasks;

        // Handle search
        if (search) {
            userTasks = TodoModel.searchTodos(search, userId);
        }
        // Handle status filter
        else if (status !== undefined) {
            const statusBoolean = status === 'true';
            userTasks = TodoModel.getTodosByStatus(statusBoolean, userId);
        }
        // Handle pagination
        else if (page || limit) {
            const pageNum = parseInt(page) || 1;
            const limitNum = parseInt(limit) || 10;
            const paginatedResult = TodoModel.paginateTodos(pageNum, limitNum, userId);
            
            return res.json({
                success: true,
                message: "Tasks retrieved successfully",
                data: paginatedResult,
                timestamp: new Date().toISOString()
            });
        }
        // Get all user tasks
        else {
            userTasks = TodoModel.getTodosByUserId(userId);
        }

        res.json({
            success: true,
            message: "Tasks retrieved successfully",
            data: { 
                tasks: userTasks,
                count: userTasks.length
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Get all tasks error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error while retrieving tasks',
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * Get a single task (user can only access their own tasks)
 */
exports.getSingleTask = (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const userId = req.user.userId;

        const task = TodoModel.getTodoById(id, userId);

        if (!task) {
            return res.status(404).json({ 
                success: false,
                error: 'Task not found or access denied',
                timestamp: new Date().toISOString()
            });
        }

        res.json({
            success: true,
            message: "Task retrieved successfully",
            data: { task },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Get single task error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error while retrieving task',
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * Delete all tasks for the authenticated user
 */
exports.deleteAllTasks = (req, res) => {
    try {
        const userId = req.user.userId;
        const deletedTasks = TodoModel.deleteAllTodosByUserId(userId);
        
        res.json({ 
            success: true,
            message: "All your tasks deleted", 
            data: {
                deletedCount: deletedTasks.length,
                deletedTasks
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Delete all tasks error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error while deleting tasks',
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * Delete a single task (user can only delete their own tasks)
 */
exports.deleteSingleTask = (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const userId = req.user.userId;

        const deletedTask = TodoModel.deleteTodo(id, userId);

        if (deletedTask === null) {
            return res.status(404).json({ 
                success: false,
                error: 'Task not found',
                timestamp: new Date().toISOString()
            });
        }

        if (deletedTask === false) {
            return res.status(403).json({ 
                success: false,
                error: 'Access denied. You can only delete your own tasks.',
                timestamp: new Date().toISOString()
            });
        }

        const remainingTasks = TodoModel.getTodosByUserId(userId);
        
        res.json({ 
            success: true,
            message: "Task Deleted", 
            data: {
                deletedTask,
                remainingTasksCount: remainingTasks.length
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Delete single task error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error while deleting task',
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * Get task statistics for the authenticated user
 */
exports.getTaskStats = (req, res) => {
    try {
        const userId = req.user.userId;
        const stats = TodoModel.getTodoStats(userId);
        
        res.json({
            success: true,
            message: "Task statistics retrieved successfully",
            data: { stats },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Get task stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error while retrieving task statistics',
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * Admin only: Get all tasks from all users
 */
exports.getAllTasksAdmin = (req, res) => {
    try {
        const { page, limit, userId } = req.query;

        if (page || limit) {
            const pageNum = parseInt(page) || 1;
            const limitNum = parseInt(limit) || 10;
            const paginatedResult = TodoModel.paginateTodos(pageNum, limitNum, userId ? parseInt(userId) : null);
            
            return res.json({
                success: true,
                message: "All tasks retrieved successfully (Admin)",
                data: paginatedResult,
                timestamp: new Date().toISOString()
            });
        }

        const allTasks = userId ? TodoModel.getTodosByUserId(parseInt(userId)) : TodoModel.getAllTodos();
        
        res.json({
            success: true,
            message: "All tasks retrieved successfully (Admin)",
            data: { 
                tasks: allTasks,
                count: allTasks.length
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Get all tasks admin error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error while retrieving all tasks',
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * Admin only: Delete all tasks from all users
 */
exports.deleteAllTasksAdmin = (req, res) => {
    try {
        const deletedTasks = TodoModel.deleteAllTodos();
        
        res.json({ 
            success: true,
            message: "All tasks from all users deleted (Admin)", 
            data: {
                deletedCount: deletedTasks.length,
                deletedTasks
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Delete all tasks admin error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error while deleting all tasks',
            timestamp: new Date().toISOString()
        });
    }
};