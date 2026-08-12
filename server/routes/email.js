// =============================================
// routes/email.js
// =============================================
// Handles manual email triggers
//
// POST /api/email/test
//      → sends a test email to confirm
//        SendGrid is working
//
// All routes require the user to be logged in
// =============================================

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const {
  sendDriverAcceptedEmail,
  sendReminderEmail
} = require('../services/emailService');

// =============================================
// POST /api/email/test
// =============================================
// Sends a test email to the logged in user
// Useful for confirming SendGrid is working
router.post('/test', verifyToken, async (req, res) => {
  try {
    const { email, name } = req.body;

    await sendReminderEmail({
      email,
      name,
      appointmentTitle: 'Test Appointment',
      appointmentTime: new Date().toLocaleString(),
      location: 'Test Location',
      role: 'patient'
    });

    res.status(200).json({ message: 'Test email sent successfully!' });

  } catch (error) {
    console.error('Test email error:', error.message);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

module.exports = router;