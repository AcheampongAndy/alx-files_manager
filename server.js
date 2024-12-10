// Import necessary modules
const express = require('express');
const routes = require('./routes/index');

// Initialize an Express application
const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Use routes
app.use('/', routes);

// Set the port and start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});