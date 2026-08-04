// =============================================
// server/routes/profile.js
// =============================================
// Handles fetching and updating user profiles
//
// Routes:
// GET /api/profile → get logged in user's profile data
// PUT /api/profile → update logged in user's profile data
//
// Both routes require the user to be logged in
// The JWT token is checked via auth middleware
// =============================================
/*
const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/auth');
// =============================================
// GET /api/profile
// =============================================
// Gets the logged-in user's profile
// =============================================

router.get('/', authenticateToken, async (req, res) => {
  try {

    // Comes from JWT token
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.role,
        pp.date_of_birth,
        pp.address,
        pp.doctor_name,
        pp.allergies,
        pp.medical_notes

      FROM users u

      LEFT JOIN patient_profiles pp
      ON pp.user_id = u.id

      WHERE u.id = $1
      `,
      [userId]
    );

    res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error("Get profile error:", error.message);
    res.status(500).json({
      error: "Server error getting profile"
    });
  }
});

module.exports = router;

*/

// =============================================
// server/routes/profile.js
// =============================================
// Handles fetching and updating user profiles
//
// Routes:
// GET /api/profile → get logged in user's profile data
// PUT /api/profile → update logged in user's profile data
//
// Both routes require the user to be logged in
// JWT token is verified via authMiddleware
// =============================================

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

// =============================================
// GET /api/profile
// =============================================
// Returns the logged in user's profile data
// Joins users table with patient_profiles
// so we get all info in one query
router.get('/', verifyToken, async (req, res) => {
  try {

    // User ID comes from the JWT token
    // verifyToken decodes it and puts it on req.user
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.role,
        pp.date_of_birth,
        pp.address,
        pp.medical_notes,
        pp.allergies,
        pp.emergency_contact,
        pp.emergency_contact_phone
       FROM users u
       LEFT JOIN patient_profiles pp ON pp.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );

    res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error('Get profile error:', error.message);
    res.status(500).json({ error: 'Server error getting profile' });
  }
});

// =============================================
// PUT /api/profile
// =============================================
// Updates the logged in patient's profile data
// Accepts: date_of_birth, address, medical_notes,
//          allergies, emergency_contact,
//          emergency_contact_phone
router.put('/', verifyToken, async (req, res) => {
  try {

    const userId = req.user.id;

    // Get all fields from the request body
    const {
      date_of_birth,
      address,
      medical_notes,
      allergies,
      emergency_contact,
      emergency_contact_phone
    } = req.body;

    // Update the patient_profiles table
    // WHERE user_id = logged in user
    await pool.query(
      `UPDATE patient_profiles SET
        date_of_birth          = $1,
        address                = $2,
        medical_notes          = $3,
        allergies              = $4,
        emergency_contact      = $5,
        emergency_contact_phone = $6
       WHERE user_id = $7`,
      [
        date_of_birth || null,
        address || null,
        medical_notes || null,
        allergies || null,
        emergency_contact || null,
        emergency_contact_phone || null,
        userId
      ]
    );

    // Fetch the updated profile to send back
    // So the frontend can update the UI immediately
    const result = await pool.query(
      `SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.role,
        pp.date_of_birth,
        pp.address,
        pp.medical_notes,
        pp.allergies,
        pp.emergency_contact,
        pp.emergency_contact_phone
       FROM users u
       LEFT JOIN patient_profiles pp ON pp.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );

    res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error('Update profile error:', error.message);
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

module.exports = router;