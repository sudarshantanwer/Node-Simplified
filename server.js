const express = require('express');
const app = express();
const cors = require('cors');
const PORT = 3000;

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin : 'http://localhost:3001'
}))

// In-memory database (mock)
let todo = [
    { task: "Learn Node JS", id: 1, status: false },
    { task: "Learn React JS", id: 2, status: true },
    { task: "Learn HTML", id: 3, status: true },
    { task: "Learn MongoDB", id: 4, status: false },
    { task: "Learn DSA", id: 5, status: false },
    { task: "Learn JavaScript", id: 6, status: true },
];

// Create a new task
app.post('/api/todo', (req, res) => {
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
});

// Update an existing task
app.put('/api/todo/:id', (req, res) => {
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
});

// Get all tasks
app.get('/api/todo', (req, res) => {
    res.json(todo);
});

// Get a single task
app.get('/api/todo/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const task = todo.find(t => t.id === id);

    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
});

// Delete a single task
app.delete('/api/todo/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = todo.findIndex(t => t.id === id);

    if (index === -1) {
        return res.status(404).json({ error: 'Task not found' });
    }

    todo.splice(index, 1);
    res.json({ message: "Task Deleted", remainingTasks: todo });
});

// Delete all tasks
app.delete('/api/todo', (req, res) => {
    todo = [];
    res.json({ message: "All Tasks Deleted", remainingTasks: todo });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
