const express = require("express");
const router = express.Router();
const todoController = require("../controllers/todoController");
const { publishMessage } = require("../queues/send");

router.get('', todoController.getAllTasks);
router.get('/:id', todoController.getSingleTask)
router.post('', todoController.createNewTask);
router.put('/:id', todoController.updateTask);
router.delete('/:id', todoController.deleteSingleTask);
router.delete('', todoController.deleteAllTasks)

// POST /api/todo/queue - publish an arbitrary message to RabbitMQ
router.post('/queue', async (req, res) => {
    try {
        const payload = req.body && Object.keys(req.body).length ? req.body : { message: 'hello from api', ts: Date.now() };
        await publishMessage(payload);
        res.json({ message: 'Published to queue', payload });
    } catch (err) {
        res.status(500).json({ error: 'Failed to publish', details: err.message });
    }
});

module.exports = router;