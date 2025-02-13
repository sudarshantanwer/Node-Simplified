const express = require('express');
const app = express();
const cors = require('cors');
const todoRoutes = require('./routes/todoRoutes')


// Middleware for parsing JSON and URL-encoded data
app.use(express.json());

app.use(express.urlencoded({ extended: true }));
// app.use(cors({
//     origin : 'http://localhost:3001'
// }))

app.use(cors());
app.use('/api/todo', todoRoutes);

module.exports = app;