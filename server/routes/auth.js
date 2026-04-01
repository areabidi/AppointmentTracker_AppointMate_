// =============================================
// routes/auth.js — Authentication Routes
// =============================================
// This file handles all authentication:
// - POST /api/auth/signup → create a new account
// - POST /api/auth/login  → log in to an account
//
// Think of this as the hospital check-in desk
// You sign up once, then log in every visit
// You get a wristband (JWT) to use everywhere
// =============================================

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

// =============================================
// POST /api/auth/signup
// =============================================
// Creates a new user account
// Accepts: first_name, last_name, email, 
//          password, role, phone (optional)
// Returns: JWT token + user info
router.post('/signup', async (req, res) => {
  try {
    // Step 1 — Get the data from the request body
    // This is what React sends us when someone
    // fills out the signup form
    const { first_name, last_name, email, password, role, phone } = req.body;

    // Step 2 — Make sure all required fields are present
    // If anything is missing, send back an error
    if (!first_name || !last_name || !email || !password || !role) {
      return res.status(400).json({ 
        error: 'Please provide all required fields' 
      });
    }

    // Step 3 — Make sure role is valid
    // Can only be 'patient' or 'caregiver'
    if (role !== 'patient' && role !== 'caregiver') {
      return res.status(400).json({ 
        error: 'Role must be either patient or caregiver' 
      });
    }

    // Step 4 — Check if email already exists
    // We dont want two accounts with the same email
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        error: 'An account with this email already exists' 
      });
    }

    // Step 5 — Hash the password
    // We NEVER store plain text passwords
    // bcrypt scrambles it into something unreadable
    // The 10 is the "salt rounds" — how many times
    // it scrambles. Higher = more secure but slower
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Step 6 — Save the user to the database
    const newUser = await pool.query(
      `INSERT INTO users 
        (first_name, last_name, email, password_hash, role, phone) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, first_name, last_name, email, role`,
      [first_name, last_name, email, password_hash, role, phone]
    );

    const user = newUser.rows[0];

    // Step 7 — Create a profile based on role
    // If patient → create patient_profile
    // If caregiver → create caregiver_profile
    if (role === 'patient') {
      await pool.query(
        'INSERT INTO patient_profiles (user_id) VALUES ($1)',
        [user.id]
      );
    } else if (role === 'caregiver') {
      await pool.query(
        'INSERT INTO caregiver_profiles (user_id) VALUES ($1)',
        [user.id]
      );
    }

    // Step 8 — Create a JWT token
    // This is the wristband we give the user
    // It contains their id and role
    // It expires in 7 days
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Step 9 — Send back the token and user info
    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Signup error:', error.message);
    res.status(500).json({ error: 'Server error during signup' });
  }
});


// =============================================
// POST /api/auth/login
// =============================================
// Logs in an existing user
// Accepts: email, password
// Returns: JWT token + user info
router.post('/login', async (req, res) => {
  try {
    // Step 1 — Get email and password from request
    const { email, password } = req.body;

    // Step 2 — Make sure both fields are present
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Please provide email and password' 
      });
    }

    // Step 3 — Find the user by email
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    // If no user found with that email
    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    const user = result.rows[0];

    // Step 4 — Check if password matches
    // bcrypt compares the plain text password
    // against the stored hash
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Step 5 — Create a JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Step 6 — Send back the token and user info
    res.status(200).json({
      message: 'Logged in successfully!',
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Server error during login' });
  }
});

module.exports = router;
