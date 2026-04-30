const app = require("./src/app");
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Server is working 🚀");
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
