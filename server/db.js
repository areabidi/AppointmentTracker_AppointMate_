// =============================================
// db.js — Database Connection
// =============================================
// This file creates a connection between our
// Express server and our PostgreSQL database.
//
// Think of it like a phone line between
// the kitchen (Express) and the fridge (PostgreSQL)
// Every time we need data we use this connection
// =============================================

const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// A Pool is a collection of database connections
// Instead of opening and closing a connection
// every single time we need data, a pool keeps
// a set of connections open and ready to use
// This is much faster and more efficient
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Test the connection when the server starts
// This tells us immediately if something is wrong
/*pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
  } else {
    console.log('Successfully connected to the database!');
    release();
  }
});*/

// Test the connection when the server starts
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
