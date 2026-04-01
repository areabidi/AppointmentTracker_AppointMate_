// =============================================
// db/seed.js
// =============================================
// This file inserts test data into the database
// using bcryptjs to properly hash passwords
//
// Run this file with: node db/seed.js
// WARNING: do not run this in production!
// =============================================

const pool = require('../db');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  try {
    console.log('Seeding database...');

    // Step 1 — Generate a proper password hash
    // This uses bcryptjs to hash 'Password123!'
    // All seed users will have the same password
    const password_hash = await bcrypt.hash('Password123!', 10);
    console.log('Password hash generated!');

    // Step 2 — Clear existing data
    await pool.query('TRUNCATE TABLE notes CASCADE');
    await pool.query('TRUNCATE TABLE appointment_drivers CASCADE');
    await pool.query('TRUNCATE TABLE appointments CASCADE');
    await pool.query('TRUNCATE TABLE patient_caregiver_access CASCADE');
    await pool.query('TRUNCATE TABLE caregiver_profiles CASCADE');
    await pool.query('TRUNCATE TABLE patient_profiles CASCADE');
    await pool.query('TRUNCATE TABLE users CASCADE');
    console.log('Existing data cleared!');

    // Step 3 — Insert users
    await pool.query(`
      INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone) VALUES
      (
        'a0000000-0000-0000-0000-000000000001',
        'john.patient@test.com',
        $1, 'patient', 'John', 'Smith', '555-100-0001'
      ),
      (
        'a0000000-0000-0000-0000-000000000002',
        'mary.patient@test.com',
        $1, 'patient', 'Mary', 'Johnson', '555-100-0002'
      ),
      (
        'a0000000-0000-0000-0000-000000000003',
        'alice.caregiver@test.com',
        $1, 'caregiver', 'Alice', 'Brown', '555-100-0003'
      ),
      (
        'a0000000-0000-0000-0000-000000000004',
        'bob.caregiver@test.com',
        $1, 'caregiver', 'Bob', 'Davis', '555-100-0004'
      ),
      (
        'a0000000-0000-0000-0000-000000000005',
        'carol.caregiver@test.com',
        $1, 'caregiver', 'Carol', 'Wilson', '555-100-0005'
      )
    `, [password_hash]);
    console.log('Users inserted!');

    // Step 4 — Insert patient profiles
    await pool.query(`
      INSERT INTO patient_profiles (user_id, date_of_birth, address, medical_notes, emergency_contact) VALUES
      (
        'a0000000-0000-0000-0000-000000000001',
        '1945-06-15',
        '123 Main St, Toronto, ON',
        'Allergic to penicillin. Has Type 2 diabetes. Takes metformin daily.',
        'Jane Smith (daughter) - 555-200-0001'
      ),
      (
        'a0000000-0000-0000-0000-000000000002',
        '1938-11-22',
        '456 Oak Ave, Toronto, ON',
        'High blood pressure. Takes lisinopril daily. No known allergies.',
        'Tom Johnson (son) - 555-200-0002'
      )
    `);
    console.log('Patient profiles inserted!');

    // Step 5 — Insert caregiver profiles
    await pool.query(`
      INSERT INTO caregiver_profiles (user_id, address, can_drive) VALUES
      ('a0000000-0000-0000-0000-000000000003', '789 Pine Rd, Toronto, ON', TRUE),
      ('a0000000-0000-0000-0000-000000000004', '321 Elm St, Toronto, ON', TRUE),
      ('a0000000-0000-0000-0000-000000000005', '654 Maple Ave, Toronto, ON', FALSE)
    `);
    console.log('Caregiver profiles inserted!');

    // Step 6 — Insert patient caregiver access
    await pool.query(`
      INSERT INTO patient_caregiver_access (patient_id, caregiver_id, status) VALUES
      ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'approved'),
      ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'approved'),
      ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', 'pending'),
      ('a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', 'approved')
    `);
    console.log('Access records inserted!');

    // Step 7 — Insert appointments
    await pool.query(`
      INSERT INTO appointments (id, patient_id, created_by, title, location, appointment_time, status) VALUES
      (
        'b0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000003',
        'Cardiology Checkup',
        'Toronto General Hospital, 200 Elizabeth St',
        NOW() + INTERVAL '3 days',
        'upcoming'
      ),
      (
        'b0000000-0000-0000-0000-000000000002',
        'a0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001',
        'Diabetes Follow-up',
        'St. Michaels Clinic, 123 Queen St',
        NOW() + INTERVAL '7 days',
        'upcoming'
      ),
      (
        'b0000000-0000-0000-0000-000000000003',
        'a0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000004',
        'Eye Exam',
        'Vision Care Centre, 50 Yonge St',
        NOW() - INTERVAL '5 days',
        'completed'
      ),
      (
        'b0000000-0000-0000-0000-000000000004',
        'a0000000-0000-0000-0000-000000000002',
        'a0000000-0000-0000-0000-000000000003',
        'Blood Pressure Review',
        'Sunnybrook Hospital, 2075 Bayview Ave',
        NOW() + INTERVAL '5 days',
        'upcoming'
      )
    `);
    console.log('Appointments inserted!');

    // Step 8 — Insert appointment drivers
    await pool.query(`
      INSERT INTO appointment_drivers (appointment_id, caregiver_id, status) VALUES
      ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'accepted'),
      ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004','offered'),
      ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'accepted')
    `);
    console.log('Drivers inserted!');

    // Step 9 — Insert notes
    await pool.query(`
      INSERT INTO notes (appointment_id, created_by, type, content) VALUES
      (
        'b0000000-0000-0000-0000-000000000003',
        'a0000000-0000-0000-0000-000000000003',
        'text',
        'John was prescribed new reading glasses. Prescription: R +2.50, L +2.25. Follow up in 12 months.'
      ),
      (
        'b0000000-0000-0000-0000-000000000003',
        'a0000000-0000-0000-0000-000000000004',
        'text',
        'John mentioned his eyes have been feeling dry lately. Doctor recommended lubricating eye drops.'
      )
    `);
    console.log('Notes inserted!');

    console.log('Database seeded successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Seeding error:', error.message);
    process.exit(1);
  }
};

seedDatabase();