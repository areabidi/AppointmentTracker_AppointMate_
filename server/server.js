// =============================================
// server.js — Entry point of the backend
// =============================================
// This is the first file that runs
// It sets up Express, connects middleware
// and registers all routes
// =============================================

// Import tools
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Import database connection
const pool = require('./db');

// Import all route files
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
const accessRoutes = require('./routes/access');
const driverRoutes = require('./routes/drivers');
const notesRoutes = require('./routes/notes');

// Create the Express app
const app = express();

// Tell Express to accept JSON data
// This must come before routes
app.use(express.json());

// Allow React to talk to Express (CORS)
// This must come before routes
// origin → who can send requests to us
// methods → what request types are allowed
// allowedHeaders → what headers are allowed
// credentials → allows JWT token to be sent
app.use(cors({
  origin: [
    // Local development
    'http://localhost:3000',
    // Live frontend on Render
    'https://appointmate-frontend.onrender.com',
    // From .env file (fallback)
    process.env.CLIENT_URL
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Register all routes
// Any request starting with these URLs
// gets sent to the matching route file
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/notes', notesRoutes);

// Test route to confirm server is running
app.get('/', (req, res) => {
  res.json({ message: 'AppointMate backend is running!' });
});

// Start the server
// PORT comes from .env or defaults to 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});