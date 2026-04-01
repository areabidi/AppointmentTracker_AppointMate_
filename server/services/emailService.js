// =============================================
// services/emailService.js
// =============================================
// This file handles sending email notifications
//
// It uses Nodemailer with Gmail to send emails
//
// Emails are sent when:
// 1. A new appointment is created
//    → all caregivers with access get notified
// 2. A driver conflict occurs
//    → both conflicting caregivers get notified
//
// Setup required:
// Add these to your .env file:
// EMAIL_USER=your_gmail@gmail.com
// EMAIL_PASS=your_gmail_app_password
// =============================================

const nodemailer = require('nodemailer');

// Create a transporter using Gmail
// The transporter is what actually sends the email
// Think of it like setting up your email client
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// =============================================
// sendAppointmentNotification
// =============================================
// Sends an email to all caregivers when a
// new appointment is created for their patient
//
// recipients = array of caregiver email addresses
// appointment = the appointment object
const sendAppointmentNotification = async (recipients, appointment) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipients.join(', '),
      subject: `New Appointment: ${appointment.title}`,
      html: `
        <h2>New Appointment Created</h2>
        <p>A new appointment has been scheduled:</p>
        <ul>
          <li><strong>Title:</strong> ${appointment.title}</li>
          <li><strong>Location:</strong> ${appointment.location || 'Not specified'}</li>
          <li><strong>Date & Time:</strong> ${new Date(appointment.appointment_time).toLocaleString()}</li>
        </ul>
        <p>Please log in to AppointMate to view more details.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Appointment notification sent to:', recipients);

  } catch (error) {
    // We log the error but don't crash the app
    // Email failing should not stop the appointment
    // from being created
    console.error('Email notification error:', error.message);
  }
};

// =============================================
// sendConflictNotification
// =============================================
// Sends an email to both caregivers when a
// driver conflict occurs
//
// caregiver1Email = first caregiver's email
// caregiver2Email = second caregiver's email
// appointment = the appointment object
const sendConflictNotification = async (caregiver1Email, caregiver2Email, appointment) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: [caregiver1Email, caregiver2Email].join(', '),
      subject: `Driver Conflict: ${appointment.title}`,
      html: `
        <h2>Driver Conflict Detected</h2>
        <p>Two caregivers accepted to drive to the same appointment at the same time:</p>
        <ul>
          <li><strong>Appointment:</strong> ${appointment.title}</li>
          <li><strong>Date & Time:</strong> ${new Date(appointment.appointment_time).toLocaleString()}</li>
          <li><strong>Location:</strong> ${appointment.location || 'Not specified'}</li>
        </ul>
        <p>Please contact each other to decide who will drive.</p>
        <p>You can update your drive status in AppointMate.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Conflict notification sent to:', caregiver1Email, caregiver2Email);

  } catch (error) {
    console.error('Conflict email error:', error.message);
  }
};

module.exports = { 
  sendAppointmentNotification, 
  sendConflictNotification 
};
```

---

**Now add these to your `.env` file:**
```
# Email credentials
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password