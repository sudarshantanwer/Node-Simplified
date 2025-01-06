const express = require('express');
const app = express();
const port = 3000; // Define the port number

// Middleware to parse JSON requests
app.use(express.json());

// Basic route to handle GET request
app.get('/', (req, res) => {
  res.send('Welcome to the Express Server!');
});

// Route to handle a POST request (for demonstration)
app.post('/data', (req, res) => {
  const data = req.body; // Access the sent data in the request body
  res.send(`You sent: ${JSON.stringify(data)}`);
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
