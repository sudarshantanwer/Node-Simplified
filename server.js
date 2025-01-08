const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length; // Get the number of available CPUs
const port = 3000;

if (cluster.isMaster) {
  console.log(`Master process ${process.pid} is running`);
console.log(`Number of CPUs ${numCPUs}`);
  // Fork workers (one for each CPU core)
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // If a worker dies, log the event and possibly respawn a new worker
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    console.log('Starting a new worker...');
    cluster.fork();
  });

} else {
  // Workers can share the same TCP connection. This is where the HTTP server is defined.
  http.createServer((req, res) => {
    res.writeHead(200);
    res.end(`Hello from Node.js Cluster ${process.pid}!\n`);
  }).listen(port);

  console.log(`Worker ${process.pid} started and listening on port ${port}`);
}

// run this in bash for i in {1..100}; do curl http://localhost:3000/; done
