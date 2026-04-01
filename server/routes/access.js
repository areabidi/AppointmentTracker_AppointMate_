// =============================================
// routes/access.js
// =============================================
// This file handles caregiver access to patients
//
// GET    /api/access/my-caregivers
//        → patient sees all their caregivers
//
// GET    /api/access/my-patients
//        → caregiver sees all their patients
//
// POST   /api/access/grant
//        → patient grants a caregiver access
//
// PUT    /api/access/respond
//        → patient approves or revokes access
//
// DELETE /api/access/revoke/:caregiverId
//        → patient removes a caregiver's access
//
// All routes require the user to be logged in
// =============================================

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, verifyPatient, verifyCaregiver } = require('../middleware/authMiddleware');


// =============================================
// GET /api/access/my-caregivers
// =============================================
// Patient sees all caregivers who have access
// or have requested access to their profile
router.get('/my-caregivers', verifyToken, verifyPatient, async (req, res) => {
  try {
    // req.user.id is the logged in patient's id
    const patientId = req.user.id;

    // Get all caregivers linked to this patient
    // Join with users table to get caregiver details
    const result = await pool.query(
      `SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        cp.can_drive,
        pca.status,
        pca.granted_at
       FROM patient_caregiver_access pca
       JOIN users u ON pca.caregiver_id = u.id
       JOIN caregiver_profiles cp ON cp.user_id = u.id
       WHERE pca.patient_id = $1
       ORDER BY pca.granted_at DESC`,
      [patientId]
    );

    res.status(200).json(result.rows);

  } catch (error) {
    console.error('Get caregivers error:', error.message);
    res.status(500).json({ error: 'Server error getting caregivers' });
  }
});


// =============================================
// GET /api/access/my-patients
// =============================================
// Caregiver sees all patients they have
// access to or have requested access to
router.get('/my-patients', verifyToken, verifyCaregiver, async (req, res) => {
  try {
    const caregiverId = req.user.id;

    const result = await pool.query(
      `SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        pp.date_of_birth,
        pp.address,
        pp.emergency_contact,
        pca.status,
        pca.granted_at
       FROM patient_caregiver_access pca
       JOIN users u ON pca.patient_id = u.id
       JOIN patient_profiles pp ON pp.user_id = u.id
       WHERE pca.caregiver_id = $1
       ORDER BY pca.granted_at DESC`,
      [caregiverId]
    );

    res.status(200).json(result.rows);

  } catch (error) {
    console.error('Get patients error:', error.message);
    res.status(500).json({ error: 'Server error getting patients' });
  }
});


// =============================================
// POST /api/access/grant
// =============================================
// Patient grants a caregiver access to their profile
// The caregiver starts with 'pending' status
// until the patient approves them
// Accepts: caregiver_email
router.post('/grant', verifyToken, verifyPatient, async (req, res) => {
  try {
    const patientId = req.user.id;
    const { caregiver_email } = req.body;

    // Make sure email is provided
    if (!caregiver_email) {
      return res.status(400).json({ 
        error: 'Please provide the caregiver email' 
      });
    }

    // Find the caregiver by email
    const caregiver = await pool.query(
      `SELECT id, first_name, last_name, role 
       FROM users WHERE email = $1`,
      [caregiver_email]
    );

    // Check if user exists
    if (caregiver.rows.length === 0) {
      return res.status(404).json({ 
        error: 'No user found with that email' 
      });
    }

    // Make sure the user is actually a caregiver
    if (caregiver.rows[0].role !== 'caregiver') {
      return res.status(400).json({ 
        error: 'That user is not a caregiver' 
      });
    }

    const caregiverId = caregiver.rows[0].id;

    // Check if access already exists
    const existing = await pool.query(
      `SELECT status FROM patient_caregiver_access 
       WHERE patient_id = $1 AND caregiver_id = $2`,
      [patientId, caregiverId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ 
        error: `Access already exists with status: ${existing.rows[0].status}` 
      });
    }

    // Create the access record with approved status
    // Patient is granting access directly
    await pool.query(
      `INSERT INTO patient_caregiver_access 
        (patient_id, caregiver_id, status)
       VALUES ($1, $2, 'approved')`,
      [patientId, caregiverId]
    );

    res.status(201).json({
      message: `Access granted to ${caregiver.rows[0].first_name} ${caregiver.rows[0].last_name} successfully!`
    });

  } catch (error) {
    console.error('Grant access error:', error.message);
    res.status(500).json({ error: 'Server error granting access' });
  }
});


// =============================================
// PUT /api/access/respond/:caregiverId
// =============================================
// Patient approves or revokes a caregiver's access
// Accepts: status ('approved' or 'revoked')
router.put('/respond/:caregiverId', verifyToken, verifyPatient, async (req, res) => {
  try {
    const patientId = req.user.id;
    const caregiverId = req.params.caregiverId;
    const { status } = req.body;

    // Status must be approved or revoked
    if (!status || !['approved', 'revoked'].includes(status)) {
      return res.status(400).json({ 
        error: 'Status must be approved or revoked' 
      });
    }

    // Check if access record exists
    const existing = await pool.query(
      `SELECT * FROM patient_caregiver_access 
       WHERE patient_id = $1 AND caregiver_id = $2`,
      [patientId, caregiverId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Access record not found' 
      });
    }

    // Update the status
    await pool.query(
      `UPDATE patient_caregiver_access 
       SET status = $1
       WHERE patient_id = $2 AND caregiver_id = $3`,
      [status, patientId, caregiverId]
    );

    res.status(200).json({
      message: `Caregiver access ${status} successfully!`
    });

  } catch (error) {
    console.error('Respond to access error:', error.message);
    res.status(500).json({ error: 'Server error responding to access' });
  }
});


// =============================================
// DELETE /api/access/revoke/:caregiverId
// =============================================
// Patient completely removes a caregiver's access
router.delete('/revoke/:caregiverId', verifyToken, verifyPatient, async (req, res) => {
  try {
    const patientId = req.user.id;
    const caregiverId = req.params.caregiverId;

    // Check if access record exists
    const existing = await pool.query(
      `SELECT * FROM patient_caregiver_access 
       WHERE patient_id = $1 AND caregiver_id = $2`,
      [patientId, caregiverId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Access record not found' 
      });
    }

    // Delete the access record
    await pool.query(
      `DELETE FROM patient_caregiver_access 
       WHERE patient_id = $1 AND caregiver_id = $2`,
      [patientId, caregiverId]
    );

    res.status(200).json({
      message: 'Caregiver access revoked successfully!'
    });

  } catch (error) {
    console.error('Revoke access error:', error.message);
    res.status(500).json({ error: 'Server error revoking access' });
  }
});

module.exports = router;