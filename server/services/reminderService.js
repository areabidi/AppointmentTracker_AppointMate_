// =============================================
// services/reminderService.js
// =============================================
// Handles reminder logic for appointments
//
// Used by:
// 1. server.js cron job → runs daily at 9AM
// 2. routes/email.js    → manual trigger
//
// Separating this logic means:
// - cron job and manual trigger share same code
// - easy to test and update in one place
// =============================================

const pool = require('../db');
const { sendReminderEmail } = require('./emailService');

// =============================================
// sendAppointmentReminder
// =============================================
// Sends reminder email to patient and caregiver
// for a specific appointment
//
// Used for both manual and automatic reminders
const sendAppointmentReminder = async (appointmentId) => {
  // Get appointment details including
  // patient and caregiver info
  const result = await pool.query(
    `SELECT 
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
     WHERE a.id = $1`,
    [appointmentId]
  );

  if (result.rows.length === 0) {
    throw new Error('Appointment not found');
  }

  const apt = result.rows[0];
  const aptTime = new Date(apt.appointment_time).toLocaleString();

  // Send to patient
  await sendReminderEmail({
    email: apt.patient_email,
    name: apt.patient_name,
    appointmentTitle: apt.title,
    appointmentTime: aptTime,
    location: apt.location,
    role: 'patient'
  });

  // Send to caregiver if one is assigned
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

  console.log(`Reminder sent for appointment: ${apt.title}`);
  return apt;
};

// =============================================
// sendTomorrowReminders
// =============================================
// Finds all upcoming appointments tomorrow
// and sends reminders to everyone
//
// Called by the cron job in server.js every day
const sendTomorrowReminders = async () => {
  const result = await pool.query(
    `SELECT id FROM appointments
     WHERE status = 'upcoming'
     AND DATE(appointment_time) = CURRENT_DATE + INTERVAL '1 day'`
  );

  console.log(`Found ${result.rows.length} appointments tomorrow`);

  for (const apt of result.rows) {
    try {
      await sendAppointmentReminder(apt.id);
    } catch (error) {
      console.error(`Failed to send reminder for appointment ${apt.id}:`, error.message);
    }
  }
};

module.exports = {
  sendAppointmentReminder,
  sendTomorrowReminders
};