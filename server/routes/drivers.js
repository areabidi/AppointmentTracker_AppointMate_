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

    // Check if caregiver already has an offer for this appointment
    const existing = await pool.query(
      `SELECT * FROM appointment_drivers 
       WHERE appointment_id = $1 AND caregiver_id = $2`,
      [appointment_id, caregiverId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ 
        error: 'You have already made an offer for this appointment' 
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

        // Send conflict notification to both caregivers
        try {
          const conflictDetails = await pool.query(
            `SELECT 
              u1.email AS caregiver1_email,
              u2.email AS caregiver2_email,
              a.title,
              a.appointment_time,
              a.location
             FROM appointments a
             JOIN appointment_drivers ad1 ON ad1.appointment_id = a.id AND ad1.status = 'conflict'
             JOIN users u1 ON u1.id = ad1.caregiver_id
             JOIN appointment_drivers ad2 ON ad2.appointment_id = a.id AND ad2.caregiver_id = $1
             JOIN users u2 ON u2.id = ad2.caregiver_id
             WHERE a.id = $2
             LIMIT 1`,
            [caregiverId, appointmentId]
          );

          if (conflictDetails.rows.length > 0) {
            const d = conflictDetails.rows[0];
            await sendConflictNotification(
              d.caregiver1_email,
              d.caregiver2_email,
              { title: d.title, appointment_time: d.appointment_time, location: d.location }
            );
          }
        } catch (emailError) {
          console.error('Conflict email error:', emailError.message);
        }

        return res.status(409).json({
          error: 'Conflict! Another caregiver accepted at the same time. Please contact each other to decide who will drive.',
          status: 'conflict'
        }); }
      // Nobody accepted yet — mark this caregiver as accepted
      await client.query(
        `UPDATE appointment_drivers 
         SET status = 'accepted'
         WHERE appointment_id = $1 
         AND caregiver_id = $2`,
        [appointmentId, caregiverId]
      );

    await client.query('COMMIT');

      // Send email to patient notifying them of their driver
      try {
        const details = await pool.query(
          `SELECT 
            u_patient.email AS patient_email,
            u_patient.first_name AS patient_first_name,
            u_caregiver.first_name AS caregiver_first_name,
            u_caregiver.last_name AS caregiver_last_name,
            a.title,
            a.appointment_time,
            a.location
           FROM appointments a
           JOIN users u_patient ON a.patient_id = u_patient.id
           JOIN users u_caregiver ON u_caregiver.id = $1
           WHERE a.id = $2`,
          [caregiverId, appointmentId]
        );

        if (details.rows.length > 0) {
          const d = details.rows[0];
          await sendDriverAcceptedEmail({
            patientEmail: d.patient_email,
            patientName: d.patient_first_name,
            caregiverName: `${d.caregiver_first_name} ${d.caregiver_last_name}`,
            appointmentTitle: d.title,
            appointmentTime: new Date(d.appointment_time).toLocaleString(),
            location: d.location
          });
        }
      } catch (emailError) {
        // Email failing should not stop the acceptance
        console.error('Driver accepted email error:', emailError.message);
      }

      res.status(200).json({
        message: 'You have accepted to drive to this appointment!',
        status: 'accepted'
      });}
     catch (error) {
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