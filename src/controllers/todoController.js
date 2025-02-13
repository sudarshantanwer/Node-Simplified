const todo = require("../models/todoModel");

exports.createNewTask = (req, res) => {
    const { task, status } = req.body;

    if (!task || status === undefined) {
        return res.status(400).json({ error: 'Task and status are required' });
    }

    const newTask = {
        task,
        status,
        id: todo.length + 1
    };
    
    todo.push(newTask);
    res.status(201).json({ message: "New Task Created", task: newTask });
};

exports.updateTask = (req, res) => {
    const { task, status } = req.body;
    const id = parseInt(req.params.id);

    const index = todo.findIndex(t => t.id === id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Task not found' });
    }

    if (!task || status === undefined) {
        return res.status(400).json({ error: 'Task and status are required' });
    }

    todo[index] = { task, status, id };
    res.json({ message: "Task Updated", task: todo[index] });
}

exports.getAllTasks = (req, res) => {
    res.json(todo);
}

exports.getSingleTask = (req, res) => {
    const id = parseInt(req.params.id);
    const task = todo.find(t => t.id === id);

    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
}

exports.deleteAllTasks = (req, res) => {
    todo = [];
    res.json({ message: "All Tasks Deleted", remainingTasks: todo });
};

exports.deleteSingleTask = (req, res) => {
    const id = parseInt(req.params.id);
    const index = todo.findIndex(t => t.id === id);

    if (index === -1) {
        return res.status(404).json({ error: 'Task not found' });
    }

    todo.splice(index, 1);
    res.json({ message: "Task Deleted", remainingTasks: todo });
}