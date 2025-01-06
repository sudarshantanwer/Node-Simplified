const express = require('express');
const app = express();
const PORT = 3000;

// Middleware to parse incoming JSON requests
app.use(express.json());

// In-memory database (array)
let todos = [
    { id: 1, task: 'Learn Node.js', completed: false },
    { id: 2, task: 'Build a CRUD app', completed: false },
];

// CREATE - POST a new todo
app.post('/api/todos', (req, res) => {
    const newTodo = {
        id: todos.length + 1,
        task: req.body.task,
        completed: false,
    };
    todos.push(newTodo);
    res.status(201).json(newTodo);
});

// READ - GET all todos
app.get('/api/todos', (req, res) => {
    res.json(todos);
});

// READ - GET a single todo by ID
app.get('/api/todos/:id', (req, res) => {
    const todoId = parseInt(req.params.id);
    const todo = todos.find(t => t.id === todoId);
    
    if (!todo) {
        return res.status(404).json({ message: 'Todo not found' });
    }
    res.json(todo);
});

// UPDATE - PUT (update) a todo by ID
app.put('/api/todos/:id', (req, res) => {
    const todoId = parseInt(req.params.id);
    const todo = todos.find(t => t.id === todoId);
    
    if (!todo) {
        return res.status(404).json({ message: 'Todo not found' });
    }
    
    todo.task = req.body.task;
    todo.completed = req.body.completed;
    res.json(todo);
});

// DELETE - DELETE a todo by ID
app.delete('/api/todos/:id', (req, res) => {
    const todoId = parseInt(req.params.id);
    const todoIndex = todos.findIndex(t => t.id === todoId);
    
    if (todoIndex === -1) {
        return res.status(404).json({ message: 'Todo not found' });
    }
    
    todos.splice(todoIndex, 1);
    res.json({ message: `Todo with id ${todoId} deleted` });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
