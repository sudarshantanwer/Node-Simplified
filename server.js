const express = require('express');
const app = express();
const port = 3000; // Define the port number

// Middleware to parse JSON requests
app.use(express.json());

let todo = [
  { task: "Learn Node JS", id: 1, status: false },
  { task: "Learn React JS", id: 2, status: true },
  { task: "Learn HTML", id: 3, status: true },
  { task: "Learn MongoDB", id: 4, status: false },
  { task: "Learn DSA", id: 5, status: false },
  { task: "Learn JavaScript", id: 6, status: true },
];

// Basic route to handle GET request
app.get('/', (req, res) => {
  res.send('Welcome to the Express Server!');
});

app.get('/todo', (req, res) => {
  res.json({status: 'Success', data: todo });
});

const introData = `
  <html>
    <head>
      <title>About Sudarshan</title>
    </head>
    <body>
      <h1>Welcome to My Personal Page</h1>
      <p>Hi, my name is Sudarshan. I am a passionate Node.js developer with 13 years of experience in various tech stacks. I specialize in full-stack development, with a deep understanding of JavaScript, Node.js, and modern web frameworks like React and Express.</p>
      <p>I love coding and enjoy working on new challenges. Whether it's building a scalable backend service, optimizing performance, or designing intuitive user interfaces, I thrive on solving problems with technology.</p>
      <p>Over the years, I have worked on diverse projects in industries such as e-commerce, finance, and enterprise solutions. I'm always eager to learn new technologies and improve my skills.</p>
      <p>When I'm not coding, I enjoy helping others learn, mentoring junior developers, and exploring new ideas in the world of software engineering.</p>
      <h2>Skills & Expertise</h2>
      <ul>
        <li>Node.js & Express.js</li>
        <li>JavaScript (ES6+)</li>
        <li>React & Frontend Frameworks</li>
        <li>MongoDB & SQL Databases</li>
        <li>API Development & Integration</li>
        <li>Cloud Services: AWS, Azure</li>
        <li>CI/CD, Jenkins, Docker</li>
        <li>Software Design & Architecture</li>
      </ul>
      <h2>Hobbies & Interests</h2>
      <ul>
        <li>Coding and Open-Source Contribution</li>
        <li>Technology Blogging & YouTube Channel</li>
        <li>Watching Bollywood Classics</li>
        <li>Exploring AI and Machine Learning</li>
      </ul>
    </body>
  </html>
`;

app.get('/intro', (req, res) => {
    res.send(introData);
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
