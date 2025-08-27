const express = require("express");
const router = express.Router();
const todoController = require("../controllers/todoController");
const { requireRole } = require("../middlewares/authMiddleware");

// User routes (protected by auth middleware in app.js)
router.get('', todoController.getAllTasks);
router.get('/stats', todoController.getTaskStats);
router.get('/:id', todoController.getSingleTask);
router.post('', todoController.createNewTask);
router.put('/:id', todoController.updateTask);
router.delete('/:id', todoController.deleteSingleTask);
router.delete('', todoController.deleteAllTasks);

// Admin routes
router.get('/admin/all', requireRole('admin'), todoController.getAllTasksAdmin);
router.delete('/admin/all', requireRole('admin'), todoController.deleteAllTasksAdmin);

module.exports = router;