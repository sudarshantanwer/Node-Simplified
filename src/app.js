const express = require('express');
const app = express();
const cors = require('cors');
const todoRoutes = require('./routes/todoRoutes')
const authMiddleware = require('./middlewares/authMiddleware');
const logMiddleware = require('./middlewares/logMiddleware');



// Middleware for parsing JSON and URL-encoded data
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cors());

app.use(logMiddleware);
app.use(authMiddleware);


app.use('/api/todo', todoRoutes);

module.exports = app;