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
const cron = require('node-cron');
const { sendReminderEmail } = require('./services/emailService');

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
app.use('/api/profile', require('./routes/profile'));

// Test route to confirm server is running
app.get('/', (req, res) => {
  res.json({ message: 'AppointMate backend is running!' });
});
// =============================================
// REMINDER CRON JOB
// =============================================
// Runs every day at 9AM
// Finds all appointments tomorrow
// Sends reminder email to patient and caregiver
cron.schedule('0 9 * * *', async () => {
  console.log('Running appointment reminder job...');
  try {
    const result = await pool.query(
      `SELECT 
        a.id,
        a.title,
        a.appointment_time,
        a.location,
        u_patient.email AS patient_email,
        u_patient.first_name AS patient_name,
        u_caregiver.email AS caregiver_email,
        u_caregiver.first_name AS caregiver_name
       FROM appointments a
       JOIN users u_patient ON a.patient_id = u_patient.id
       LEFT JOIN appointment_drivers ad ON ad.appointment_id = a.id 
         AND ad.status = 'accepted'
       LEFT JOIN users u_caregiver ON u_caregiver.id = ad.caregiver_id
       WHERE a.status = 'upcoming'
       AND DATE(a.appointment_time) = CURRENT_DATE + INTERVAL '1 day'`
    );

    for (const apt of result.rows) {
      const aptTime = new Date(apt.appointment_time).toLocaleString();

      // Email patient
      await sendReminderEmail({
        email: apt.patient_email,
        name: apt.patient_name,
        appointmentTitle: apt.title,
        appointmentTime: aptTime,
        location: apt.location,
        role: 'patient'
      });

      // Email caregiver if one is assigned
      if (apt.caregiver_email) {
        await sendReminderEmail({
          email: apt.caregiver_email,
          name: apt.caregiver_name,
          appointmentTitle: apt.title,
          appointmentTime: aptTime,
          location: apt.location,
          role: 'caregiver'
        });
      }
    }

    console.log(`Reminders sent for ${result.rows.length} appointments`);
  } catch (error) {
    console.error('Reminder cron error:', error.message);
  }
});

// Start the server
// PORT comes from .env or defaults to 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});