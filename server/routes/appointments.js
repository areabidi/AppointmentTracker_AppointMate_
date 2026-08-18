// =============================================
// routes/appointments.js
// =============================================
// This file handles all appointment routes:
//
// GET    /api/appointments          → get all appointments for a patient
// POST   /api/appointments          → create a new appointment
// PUT    /api/appointments/:id      → edit an appointment
// DELETE /api/appointments/:id      → cancel an appointment (reason required)
//
// All routes are protected by verifyToken
// meaning the user must be logged in
// =============================================

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const { sendAppointmentNotification } = require('../services/emailService');

// =============================================
// GET /api/appointments
// =============================================
// Gets all appointments the logged in user
// has access to
// If patient → gets their own appointments
// If caregiver → gets appointments of all
// patients they have approved access to
router.get('/', verifyToken, async (req, res) => {
  try {
    // req.user.id is the logged in user's id
    // req.user.role is their role (patient/caregiver)
    const { id, role } = req.user;

    let result;

    if (role === 'patient') {
      // Patient sees their own appointments
      result = await pool.query(
        `SELECT 
          a.*,
          u.first_name AS created_by_first_name,
          u.last_name AS created_by_last_name
         FROM appointments a
         JOIN users u ON a.created_by = u.id
         WHERE a.patient_id = $1
         ORDER BY a.appointment_time ASC`,
        [id]
      );
    } else {
      // Caregiver sees appointments of all
      // patients they have approved access to
      result = await pool.query(
        `SELECT 
          a.*,
          u.first_name AS created_by_first_name,
          u.last_name AS created_by_last_name,
          p.first_name AS patient_first_name,
          p.last_name AS patient_last_name
         FROM appointments a
         JOIN users u ON a.created_by = u.id
         JOIN users p ON a.patient_id = p.id
         JOIN patient_caregiver_access pca ON pca.patient_id = a.patient_id
         WHERE pca.caregiver_id = $1
         AND pca.status = 'approved'
         ORDER BY a.appointment_time ASC`,
        [id]
      );
    }

    res.status(200).json(result.rows);

  } catch (error) {
    console.error('Get appointments error:', error.message);
    res.status(500).json({ error: 'Server error getting appointments' });
  }
});


// =============================================
// POST /api/appointments
// =============================================
// Creates a new appointment
// Can be created by patient or caregiver
// After creating, sends email to all caregivers
// who have access to the patient
router.post('/', verifyToken, async (req, res) => {
  try {
    const { id, role } = req.user;
    const { patient_id, title, location, appointment_time } = req.body;

    // Make sure all required fields are present
    if (!patient_id || !title || !appointment_time) {
      return res.status(400).json({ 
        error: 'Please provide patient_id, title and appointment_time' 
      });
    }

    // If the logged in user is a caregiver
    // check they have approved access to this patient
    if (role === 'caregiver') {
      const access = await pool.query(
        `SELECT status FROM patient_caregiver_access 
         WHERE patient_id = $1 AND caregiver_id = $2`,
        [patient_id, id]
      );

      if (access.rows.length === 0 || access.rows[0].status !== 'approved') {
        return res.status(403).json({ 
          error: 'You do not have approved access to this patient' 
        });
      }
    }

    // If the logged in user is a patient
    // they can only create appointments for themselves
    if (role === 'patient' && patient_id !== id) {
      return res.status(403).json({ 
        error: 'Patients can only create appointments for themselves' 
      });
    }

    // Create the appointment
    const result = await pool.query(
      `INSERT INTO appointments 
        (patient_id, created_by, title, location, appointment_time)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [patient_id, id, title, location, appointment_time]
    );

const appointment = result.rows[0];

    // Notify all approved caregivers for this patient
    try {
      const caregivers = await pool.query(
        `SELECT u.email FROM patient_caregiver_access pca
         JOIN users u ON u.id = pca.caregiver_id
         WHERE pca.patient_id = $1 AND pca.status = 'approved'`,
        [patient_id]
      );

      const recipientEmails = caregivers.rows.map(row => row.email);

      if (recipientEmails.length > 0) {
        await sendAppointmentNotification(recipientEmails, appointment);
      }
    } catch (notifyError) {
      console.error('Failed to notify caregivers:', notifyError.message);
    }

    res.status(201).json({
      message: 'Appointment created successfully!',
      appointment
    });

  } catch (error) {
    console.error('Create appointment error:', error.message);
    res.status(500).json({ error: 'Server error creating appointment' });
  }
});


// =============================================
// PUT /api/appointments/:id
// =============================================
// Edits an existing appointment
// Only users with access to the patient
// can edit their appointments

// =============================================
// PUT /api/appointments/:id/status
// =============================================
// Updates the status of an appointment
// Status can be: completed or missed
// Only users with access to the patient
// can update the status
router.put('/:id/status', verifyToken, async (req, res) => {
  try {
    const { id, role } = req.user;
    const appointmentId = req.params.id;
    const { status } = req.body;

    // Status must be completed or missed
    if (!status || !['completed', 'missed'].includes(status)) {
      return res.status(400).json({
        error: 'Status must be completed or missed'
      });
    }

    // Find the appointment
    const existing = await pool.query(
      'SELECT * FROM appointments WHERE id = $1',
      [appointmentId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const appointment = existing.rows[0];

    // Check if caregiver has access to this patient
    if (role === 'caregiver') {
      const access = await pool.query(
        `SELECT status FROM patient_caregiver_access 
         WHERE patient_id = $1 AND caregiver_id = $2`,
        [appointment.patient_id, id]
      );

      if (access.rows.length === 0 || access.rows[0].status !== 'approved') {
        return res.status(403).json({
          error: 'You do not have approved access to this patient'
        });
      }
    }

    // Update the status
    const result = await pool.query(
      `UPDATE appointments 
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, appointmentId]
    );

    res.status(200).json({
      message: `Appointment marked as ${status}!`,
      appointment: result.rows[0]
    });

  } catch (error) {
    console.error('Update status error:', error.message);
    res.status(500).json({ error: 'Server error updating status' });
  }
});
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id, role } = req.user;
    const appointmentId = req.params.id;
    const { title, location, appointment_time } = req.body;

    // First find the appointment
    const existing = await pool.query(
      'SELECT * FROM appointments WHERE id = $1',
      [appointmentId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const appointment = existing.rows[0];

    // Check if caregiver has access to this patient
    if (role === 'caregiver') {
      const access = await pool.query(
        `SELECT status FROM patient_caregiver_access 
         WHERE patient_id = $1 AND caregiver_id = $2`,
        [appointment.patient_id, id]
      );

      if (access.rows.length === 0 || access.rows[0].status !== 'approved') {
        return res.status(403).json({ 
          error: 'You do not have approved access to this patient' 
        });
      }
    }

    // Update the appointment
    const result = await pool.query(
      `UPDATE appointments 
       SET title = COALESCE($1, title),
           location = COALESCE($2, location),
           appointment_time = COALESCE($3, appointment_time)
       WHERE id = $4
       RETURNING *`,
      [title, location, appointment_time, appointmentId]
    );

    res.status(200).json({
      message: 'Appointment updated successfully!',
      appointment: result.rows[0]
    });

  } catch (error) {
    console.error('Update appointment error:', error.message);
    res.status(500).json({ error: 'Server error updating appointment' });
  }
});


// =============================================
// DELETE /api/appointments/:id
// =============================================
// Cancels an appointment
// A reason MUST be provided
// Only users with access to the patient
// can cancel their appointments
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id, role } = req.user;
    const appointmentId = req.params.id;
    const { cancel_reason } = req.body;

    // Cancel reason is required
    if (!cancel_reason) {
      return res.status(400).json({ 
        error: 'A reason is required to cancel an appointment' 
      });
    }

    // Find the appointment
    const existing = await pool.query(
      'SELECT * FROM appointments WHERE id = $1',
      [appointmentId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const appointment = existing.rows[0];

    // Check if caregiver has access to this patient
    if (role === 'caregiver') {
      const access = await pool.query(
        `SELECT status FROM patient_caregiver_access 
         WHERE patient_id = $1 AND caregiver_id = $2`,
        [appointment.patient_id, id]
      );

      if (access.rows.length === 0 || access.rows[0].status !== 'approved') {
        return res.status(403).json({ 
          error: 'You do not have approved access to this patient' 
        });
      }
    }

    // Cancel the appointment with reason
    const result = await pool.query(
      `UPDATE appointments 
       SET status = 'cancelled',
           cancel_reason = $1
       WHERE id = $2
       RETURNING *`,
      [cancel_reason, appointmentId]
    );

    res.status(200).json({
      message: 'Appointment cancelled successfully!',
      appointment: result.rows[0]
    });

  } catch (error) {
    console.error('Cancel appointment error:', error.message);
    res.status(500).json({ error: 'Server error cancelling appointment' });
  }
});

module.exports = router;