// =============================================
// db.js — Database Connection
// =============================================
// This file creates a connection between our
// Express server and our PostgreSQL database.
//
// Think of it like a phone line between
// the kitchen (Express) and the fridge (PostgreSQL)
// Every time we need data we use this connection
//
// HISTORY OF CHANGES:
// Original  → used individual variables only (local)
// April 12  → added DATABASE_URL support for Render
// April 12  → fixed SSL self-signed certificate error
// =============================================

const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// A Pool is a collection of database connections
// Instead of opening and closing a connection
// every single time we need data, a pool keeps
// a set of connections open and ready to use
// This is much faster and more efficient

// =============================================
// OLD CODE — original local-only connection
// Kept for reference — do not delete
// This only worked locally, not on Render
// because it used individual variables
// =============================================
/*const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});*/

// =============================================
// CURRENT CODE — works both locally and on Render
// =============================================
// Checks which environment we are in
// If DATABASE_URL exists → we are on Render
// If not → we are running locally
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        // =============================================
        // RENDER CONFIG
        // =============================================
        // Uses a single connection URL that Render provides
        // Found in Render dashboard → appointmate-db → Connect
        // =============================================
        //connectionString: process.env.DATABASE_URL,

        // =============================================
        // SSL FIX — added April 12
        // =============================================
        // Render uses a self-signed SSL certificate
        // This was causing this error:
        // "Error: self-signed certificate"
        // "code: DEPTH_ZERO_SELF_SIGNED_CERT"
        //
        // Previous attempts that did NOT work:
        // ssl: { rejectUnauthorized: false }
        // ssl: { rejectUnauthorized: false, require: true }
        //
        // Fix that works:
        // ssl: false → completely disables SSL verification
        // This allows the connection to go through
        // =============================================
        //ssl: false

        // SSL: rejectUnauthorized:false means use SSL (Neon requires it)
        // but skip certificate verification — data is still encrypted.
        // Neon replaced Supabase (July 2026) — old fix was ssl:false
        // which didn't work because Neon requires an SSL connection.
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      }
    : {
        // =============================================
        // LOCAL CONFIG
        // =============================================
        // Uses individual variables from .env file
        // DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
        // These point to PostgreSQL on your computer
        // =============================================
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      }
);

// =============================================
// OLD CONNECTION TEST — kept for reference
// Simpler version without full error details
// =============================================
/*pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
  } else {
    console.log('Successfully connected to the database!');
    release();
  }
});*/

// =============================================
// CURRENT CONNECTION TEST
// =============================================
// Runs when the server starts
// Shows full error details if connection fails
// Shows DATABASE_URL status for debugging
// =============================================
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
    console.error('Full error:', err);
    console.error('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  } else {
    console.log('Successfully connected to the database!');
    release();
  }
});

// Export the pool so other files can use it
// Any file that needs to query the database
// will import this pool and use it
module.exports = pool;