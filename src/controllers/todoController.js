const todoModel = require("../models/todoModel");
const redisClient = require('../config/redis');

exports.createNewTask = async (req, res) => {
    try {
        const { task, status } = req.body;

        if (task === undefined || status === undefined) {
            return res.status(400).json({ error: 'Task and status are required' });
        }

        const newTask = await todoModel.create({ task, status });
        
        await redisClient.del('todos');
        res.status(201).json({ message: "New Task Created", task: newTask });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateTask = async (req, res) => {
    try {
        const { task, status } = req.body;
        const id = parseInt(req.params.id);

        if (task === undefined || status === undefined) {
            return res.status(400).json({ error: 'Task and status are required' });
        }

        const updatedTask = await todoModel.update(id, { task, status });

        if (!updatedTask) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        await redisClient.del('todos');
        await redisClient.del(`todo:${id}`);
        res.json({ message: "Task Updated", task: updatedTask });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.getAllTasks = async (req, res) => {
    try {
        const cachedTodos = await redisClient.get('todos');
        if (cachedTodos) {
            console.log('Cache Hit for todos');
            return res.json(JSON.parse(cachedTodos));
        }
        console.log('Cache Miss for todos. Fetching from DB...');
        const todos = await todoModel.getAll();
        await redisClient.set('todos', JSON.stringify(todos), {
            EX: 3600 // expire in 1 hour
        });
        res.json(todos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.getSingleTask = async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const cachedTodo = await redisClient.get(`todo:${id}`);
        if (cachedTodo) {
            console.log(`Cache Hit for todo:${id}`);
            return res.json(JSON.parse(cachedTodo));
        }
        
        console.log(`Cache Miss for todo:${id}. Fetching from DB...`);
        const task = await todoModel.getById(id);

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        await redisClient.set(`todo:${id}`, JSON.stringify(task), {
            EX: 3600 // expire in 1 hour
        });

        res.json(task);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.deleteAllTasks = async (req, res) => {
    try {
        await todoModel.deleteAll();
        await redisClient.del('todos');
        // A more robust approach would be to scan and delete all todo:* keys
        res.json({ message: "All Tasks Deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteSingleTask = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deletedTask = await todoModel.deleteById(id);

        if (!deletedTask) {
            return res.status(404).json({ error: 'Task not found' });
        }

        await redisClient.del('todos');
        await redisClient.del(`todo:${id}`);
        res.json({ message: "Task Deleted", task: deletedTask });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}