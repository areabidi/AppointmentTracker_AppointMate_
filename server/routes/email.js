// =============================================
// routes/email.js
// =============================================
// Handles manual email triggers
//
// POST /api/email/test
//      → sends a test email to confirm
//        Resend is working
//
// POST /api/email/reminder/:id
//      → manually sends a reminder for a
//        specific appointment
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
const { sendAppointmentReminder } = require('../services/reminderService');

// =============================================
// POST /api/email/test
// =============================================
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

// =============================================
// POST /api/email/reminder/:id
// =============================================
// Manually sends a reminder email for a
// specific appointment (used by the 📧 Remind
// button in the appointment modal)
router.post('/reminder/:id', verifyToken, async (req, res) => {
  try {
    const appointment = await sendAppointmentReminder(req.params.id);
    res.status(200).json({ message: 'Reminder sent successfully!', appointment });

  } catch (error) {
    console.error('Manual reminder error:', error.message);
    res.status(500).json({ error: 'Failed to send reminder' });
  }
});

module.exports = router;