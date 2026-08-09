// =============================================
// routes/drivers.js
// =============================================
// This file handles caregiver driving offers
//
// GET    /api/drivers/:appointmentId
//        → see who is driving to an appointment
//
// POST   /api/drivers/offer
//        → caregiver offers to drive
//
// PUT    /api/drivers/accept/:appointmentId
//        → caregiver accepts to drive
//        → handles CAP theorem conflict:
//          if two caregivers accept at the same
//          time both are marked as conflict
//
// DELETE /api/drivers/cancel/:appointmentId
//        → caregiver cancels their drive offer
//
// All routes require the user to be logged in
// =============================================

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, verifyCaregiver } = require('../middleware/authMiddleware');


// =============================================
// GET /api/drivers/:appointmentId
// =============================================
// See all driver offers for an appointment
router.get('/:appointmentId', verifyToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const result = await pool.query(
      `SELECT 
        ad.*,
        u.first_name,
        u.last_name,
        cp.can_drive
       FROM appointment_drivers ad
       JOIN users u ON ad.caregiver_id = u.id
       JOIN caregiver_profiles cp ON cp.user_id = u.id
       WHERE ad.appointment_id = $1
       ORDER BY ad.offered_at ASC`,
      [appointmentId]
    );

    res.status(200).json(result.rows);

  } catch (error) {
    console.error('Get drivers error:', error.message);
    res.status(500).json({ error: 'Server error getting drivers' });
  }
});


// =============================================
// POST /api/drivers/offer
// =============================================
// Caregiver offers to drive to an appointment
// Accepts: appointment_id
router.post('/offer', verifyToken, verifyCaregiver, async (req, res) => {
  try {
    const caregiverId = req.user.id;
    const { appointment_id } = req.body;

    if (!appointment_id) {
      return res.status(400).json({ 
        error: 'Please provide appointment_id' 
      });
    }

// Check if caregiver already has an ACTIVE offer
const existing = await pool.query(
  `SELECT * FROM appointment_drivers 
   WHERE appointment_id = $1 
   AND caregiver_id = $2
   AND status != 'cancelled'`,
  [appointment_id, caregiverId]
);

if (existing.rows.length > 0) {
  return res.status(400).json({ 
    error: 'You have already made an offer for this appointment' 
  });
}

// Check if a cancelled offer exists — if so reactivate it
// instead of creating a new row
const cancelled = await pool.query(
  `SELECT * FROM appointment_drivers 
   WHERE appointment_id = $1 
   AND caregiver_id = $2
   AND status = 'cancelled'`,
  [appointment_id, caregiverId]
);

if (cancelled.rows.length > 0) {
  const result = await pool.query(
    `UPDATE appointment_drivers 
     SET status = 'offered', offered_at = NOW()
     WHERE appointment_id = $1 AND caregiver_id = $2
     RETURNING *`,
    [appointment_id, caregiverId]
  );
  return res.status(200).json({
    message: 'Drive offer re-activated!',
    offer: result.rows[0]
  });
}


    // Create the offer
    const result = await pool.query(
      `INSERT INTO appointment_drivers 
        (appointment_id, caregiver_id, status)
       VALUES ($1, $2, 'offered')
       RETURNING *`,
      [appointment_id, caregiverId]
    );

    res.status(201).json({
      message: 'Drive offer created successfully!',
      offer: result.rows[0]
    });

  } catch (error) {
    console.error('Offer drive error:', error.message);
    res.status(500).json({ error: 'Server error creating drive offer' });
  }
});


// =============================================
// PUT /api/drivers/accept/:appointmentId
// =============================================
// Caregiver accepts to drive to an appointment
//
// CAP THEOREM CONFLICT HANDLING:
// If two caregivers accept at the same time
// we use a database transaction to check if
// anyone else already accepted
// If yes → mark BOTH as conflict and notify them
// If no  → mark this caregiver as accepted
router.put('/accept/:appointmentId', verifyToken, verifyCaregiver, async (req, res) => {
  try {
    const caregiverId = req.user.id;
    const { appointmentId } = req.params;

    // Start a database transaction
    // A transaction means all queries run together
    // If any fails, all are rolled back (undone)
    // This prevents two caregivers from both
    // being marked as accepted at the same time
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if someone already accepted
      // FOR UPDATE locks this row so no other
      // request can read it until we are done
      // This is how we handle the race condition
      const accepted = await client.query(
        `SELECT * FROM appointment_drivers 
         WHERE appointment_id = $1 
         AND status = 'accepted'
         FOR UPDATE`,
        [appointmentId]
      );

      if (accepted.rows.length > 0) {
        // Someone already accepted!
        // Mark BOTH caregivers as conflict
        await client.query(
          `UPDATE appointment_drivers 
           SET status = 'conflict'
           WHERE appointment_id = $1 
           AND status = 'accepted'`,
          [appointmentId]
        );

        await client.query(
          `UPDATE appointment_drivers 
           SET status = 'conflict'
           WHERE appointment_id = $1 
           AND caregiver_id = $2`,
          [appointmentId, caregiverId]
        );

        await client.query('COMMIT');

        return res.status(409).json({
          error: 'Conflict! Another caregiver accepted at the same time. Please contact each other to decide who will drive.',
          status: 'conflict'
        });
      }

      // Nobody accepted yet — mark this caregiver as accepted
      await client.query(
        `UPDATE appointment_drivers 
         SET status = 'accepted'
         WHERE appointment_id = $1 
         AND caregiver_id = $2`,
        [appointmentId, caregiverId]
      );

      await client.query('COMMIT');

      res.status(200).json({
        message: 'You have accepted to drive to this appointment!',
        status: 'accepted'
      });

    } catch (error) {
      // If anything goes wrong roll back all changes
      await client.query('ROLLBACK');
      throw error;
    } finally {
      // Always release the client back to the pool
      client.release();
    }

  } catch (error) {
    console.error('Accept drive error:', error.message);
    res.status(500).json({ error: 'Server error accepting drive' });
  }
});


// =============================================
// DELETE /api/drivers/cancel/:appointmentId
// =============================================
// Caregiver cancels their drive offer
// Cannot cancel within the cancellation deadline
// set by the patient (default 3 days before)
router.delete('/cancel/:appointmentId', verifyToken, verifyCaregiver, async (req, res) => {
  try {
    const caregiverId = req.user.id;
    const { appointmentId } = req.params;

    // Check if offer exists
    const existing = await pool.query(
      `SELECT * FROM appointment_drivers 
       WHERE appointment_id = $1 AND caregiver_id = $2`,
      [appointmentId, caregiverId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Drive offer not found' 
      });
    }

    // Get the appointment to check the deadline
    const appointment = await pool.query(
      `SELECT appointment_time, cancellation_deadline_days 
       FROM appointments WHERE id = $1`,
      [appointmentId]
    );

    if (appointment.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const { appointment_time, cancellation_deadline_days } = appointment.rows[0];

    // Calculate the deadline
    // e.g. if appointment is Aug 10 and deadline is 3 days
    // caregiver cannot cancel after Aug 7
    const appointmentDate = new Date(appointment_time);
    const deadlineDate = new Date(appointmentDate);
    deadlineDate.setDate(deadlineDate.getDate() - cancellation_deadline_days);
    const now = new Date();

    if (now > deadlineDate) {
      return res.status(400).json({
        error: `Cannot cancel — the cancellation deadline was ${cancellation_deadline_days} days before the appointment (${deadlineDate.toDateString()})`
      });
    }

    // Update status to cancelled
    await pool.query(
      `UPDATE appointment_drivers 
       SET status = 'cancelled'
       WHERE appointment_id = $1 AND caregiver_id = $2`,
      [appointmentId, caregiverId]
    );

    res.status(200).json({
      message: 'Drive offer cancelled successfully!'
    });

  } catch (error) {
    console.error('Cancel drive error:', error.message);
    res.status(500).json({ error: 'Server error cancelling drive' });
  }
});

module.exports = router;