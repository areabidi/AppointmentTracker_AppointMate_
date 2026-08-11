// =============================================
// services/emailService.js
// =============================================
// Handles all email notifications for AppointMate
// Uses SendGrid to send emails
//
// Emails sent:
// 1. New appointment created → caregivers notified
// 2. Driver conflict → both caregivers notified
// 3. Driver accepted → patient notified
// 4. Reminder → day before appointment
// =============================================

const sgMail = require('@sendgrid/mail');

// Set SendGrid API key from environment variables
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;

// =============================================
// sendAppointmentNotification
// =============================================
// Sent to all caregivers when a new appointment
// is created for their patient
const sendAppointmentNotification = async (recipients, appointment) => {
  try {
    const msg = {
      to: recipients,
      from: FROM_EMAIL,
      subject: `New Appointment: ${appointment.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0f3d35;">New Appointment Created 📋</h2>
          <p>A new appointment has been scheduled:</p>
          <div style="background: #f5f5f5; border-radius: 8px; padding: 1rem; margin: 1rem 0;">
            <p><strong>📋 Title:</strong> ${appointment.title}</p>
            <p><strong>📍 Location:</strong> ${appointment.location || 'Not specified'}</p>
            <p><strong>📅 Date & Time:</strong> ${new Date(appointment.appointment_time).toLocaleString()}</p>
          </div>
          <p>Please log in to AppointMate to view more details.</p>
          <p style="color: #888; font-size: 12px;">This email was sent by AppointMate</p>
        </div>
      `
    };

    await sgMail.sendMultiple(msg);
    console.log('Appointment notification sent to:', recipients);

  } catch (error) {
    console.error('Email notification error:', error.message);
  }
};

// =============================================
// sendConflictNotification
// =============================================
// Sent to both caregivers when a driver
// conflict occurs
const sendConflictNotification = async (caregiver1Email, caregiver2Email, appointment) => {
  try {
    const msg = {
      to: [caregiver1Email, caregiver2Email],
      from: FROM_EMAIL,
      subject: `Driver Conflict: ${appointment.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #c62828;">Driver Conflict Detected ⚠️</h2>
          <p>Two caregivers accepted to drive to the same appointment at the same time:</p>
          <div style="background: #f5f5f5; border-radius: 8px; padding: 1rem; margin: 1rem 0;">
            <p><strong>📋 Appointment:</strong> ${appointment.title}</p>
            <p><strong>📅 Date & Time:</strong> ${new Date(appointment.appointment_time).toLocaleString()}</p>
            <p><strong>📍 Location:</strong> ${appointment.location || 'Not specified'}</p>
          </div>
          <p>Please contact each other to decide who will drive.</p>
          <p style="color: #888; font-size: 12px;">This email was sent by AppointMate</p>
        </div>
      `
    };

    await sgMail.sendMultiple(msg);
    console.log('Conflict notification sent to:', caregiver1Email, caregiver2Email);

  } catch (error) {
    console.error('Conflict email error:', error.message);
  }
};

// =============================================
// sendDriverAcceptedEmail
// =============================================
// Sent to the patient when a caregiver
// confirms they will drive them
const sendDriverAcceptedEmail = async ({
  patientEmail,
  patientName,
  caregiverName,
  appointmentTitle,
  appointmentTime,
  location
}) => {
  try {
    const msg = {
      to: patientEmail,
      from: FROM_EMAIL,
      subject: `${caregiverName} will drive you to your appointment`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0f3d35;">Driver Confirmed 🚗</h2>
          <p>Hi ${patientName},</p>
          <p>Great news! <strong>${caregiverName}</strong> has confirmed they will take you to your appointment.</p>
          <div style="background: #f5f5f5; border-radius: 8px; padding: 1rem; margin: 1rem 0;">
            <p><strong>📋 Appointment:</strong> ${appointmentTitle}</p>
            <p><strong>📅 Date & Time:</strong> ${appointmentTime}</p>
            ${location ? `<p><strong>📍 Location:</strong> ${location}</p>` : ''}
            <p><strong>🚗 Driver:</strong> ${caregiverName}</p>
          </div>
          <p>Please make sure you are ready on time!</p>
          <p style="color: #888; font-size: 12px;">This email was sent by AppointMate</p>
        </div>
      `
    };

    await sgMail.send(msg);
    console.log(`Driver accepted email sent to ${patientEmail}`);

  } catch (error) {
    console.error('Driver accepted email error:', error.message);
  }
};

// =============================================
// sendReminderEmail
// =============================================
// Sent to both patient and caregiver
// the day before the appointment
const sendReminderEmail = async ({
  email,
  name,
  appointmentTitle,
  appointmentTime,
  location,
  role
}) => {
  try {
    const msg = {
      to: email,
      from: FROM_EMAIL,
      subject: `Reminder: ${appointmentTitle} is tomorrow`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0f3d35;">Appointment Reminder 📅</h2>
          <p>Hi ${name},</p>
          <p>This is a reminder that you have an appointment <strong>tomorrow</strong>.</p>
          <div style="background: #f5f5f5; border-radius: 8px; padding: 1rem; margin: 1rem 0;">
            <p><strong>📋 Appointment:</strong> ${appointmentTitle}</p>
            <p><strong>📅 Date & Time:</strong> ${appointmentTime}</p>
            ${location ? `<p><strong>📍 Location:</strong> ${location}</p>` : ''}
          </div>
          <p>${role === 'caregiver'
            ? 'Please make sure you arrive on time to pick up your patient.'
            : 'Please make sure you are ready on time!'}</p>
          <p style="color: #888; font-size: 12px;">This email was sent by AppointMate</p>
        </div>
      `
    };

    await sgMail.send(msg);
    console.log(`Reminder email sent to ${email}`);

  } catch (error) {
    console.error('Reminder email error:', error.message);
  }
};

module.exports = {
  sendAppointmentNotification,
  sendConflictNotification,
  sendDriverAcceptedEmail,
  sendReminderEmail
};