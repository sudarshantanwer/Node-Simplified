const express = require("express");
const router = express.Router();
const todoController = require("../controllers/todoController");

router.get('', todoController.getAllTasks);
router.get('/:id', todoController.getSingleTask)
router.post('', todoController.createNewTask);
router.put('/:id', todoController.updateTask);
router.delete('/:id', todoController.deleteSingleTask);
router.delete('', todoController.deleteAllTasks)

module.exports = router;