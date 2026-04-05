-- =============================================
-- APPOINTMATE SEED DATA
-- =============================================
-- This file adds fake test data to the database
-- so you can test the app without manually
-- entering data every time.
--
-- Run this file AFTER schema.sql
--
-- TO RESET: delete all data and re-run this file
-- WARNING: do not run this in production!
-- =============================================


-- =============================================
-- CLEAR EXISTING DATA
-- =============================================
-- Delete all existing data before seeding
-- This lets you re-run this file cleanly
-- The order matters! We delete child tables
-- before parent tables to avoid foreign key errors
-- Think of it like removing decorations before
-- taking down the Christmas tree
TRUNCATE TABLE notes CASCADE;
TRUNCATE TABLE appointment_drivers CASCADE;
TRUNCATE TABLE appointments CASCADE;
TRUNCATE TABLE patient_caregiver_access CASCADE;
TRUNCATE TABLE caregiver_profiles CASCADE;
TRUNCATE TABLE patient_profiles CASCADE;
TRUNCATE TABLE users CASCADE;


-- =============================================
-- USERS
-- =============================================
-- We are inserting 5 users:
-- 2 patients and 3 caregivers
--
-- IMPORTANT: passwords are hashed using bcrypt
-- The plain text password for ALL test users is:
-- Password123!
-- The hash below is what bcrypt turns it into
INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone) VALUES

  -- Patient 1
  (
    'a0000000-0000-0000-0000-000000000001',
    'john.patient@test.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'patient',
    'John',
    'Smith',
    '555-100-0001'
  ),

  -- Patient 2
  (
    'a0000000-0000-0000-0000-000000000002',
    'mary.patient@test.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'patient',
    'Mary',
    'Johnson',
    '555-100-0002'
  ),

  -- Caregiver 1 (can drive)
  (
    'a0000000-0000-0000-0000-000000000003',
    'alice.caregiver@test.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'caregiver',
    'Alice',
    'Brown',
    '555-100-0003'
  ),

  -- Caregiver 2 (can drive)
  (
    'a0000000-0000-0000-0000-000000000004',
    'bob.caregiver@test.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'caregiver',
    'Bob',
    'Davis',
    '555-100-0004'
  ),

  -- Caregiver 3 (cannot drive)
  (
    'a0000000-0000-0000-0000-000000000005',
    'carol.caregiver@test.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'caregiver',
    'Carol',
    'Wilson',
    '555-100-0005'
  );


-- =============================================
-- PATIENT PROFILES
-- =============================================
-- Extra info for our 2 patients
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
  );


-- =============================================
-- CAREGIVER PROFILES
-- =============================================
-- Extra info for our 3 caregivers
INSERT INTO caregiver_profiles (user_id, address, can_drive) VALUES

  -- Alice can drive
  (
    'a0000000-0000-0000-0000-000000000003',
    '789 Pine Rd, Toronto, ON',
    TRUE
  ),

  -- Bob can drive
  (
    'a0000000-0000-0000-0000-000000000004',
    '321 Elm St, Toronto, ON',
    TRUE
  ),

  -- Carol cannot drive
  (
    'a0000000-0000-0000-0000-000000000005',
    '654 Maple Ave, Toronto, ON',
    FALSE
  );


-- =============================================
-- PATIENT CAREGIVER ACCESS
-- =============================================
-- Controls who can see who
--
-- John's caregivers:
--   Alice  = approved (can see John's appointments)
--   Bob    = approved (can see John's appointments)
--   Carol  = pending  (waiting for John to approve)
--
-- Mary's caregivers:
--   Alice  = approved (can see Mary's appointments)
INSERT INTO patient_caregiver_access (patient_id, caregiver_id, status) VALUES

  -- John → Alice (approved)
  (
    'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    'approved'
  ),

  -- John → Bob (approved)
  (
    'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000004',
    'approved'
  ),

  -- John → Carol (pending)
  (
    'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000005',
    'pending'
  ),

  -- Mary → Alice (approved)
  (
    'a0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000003',
    'approved'
  );


-- =============================================
-- APPOINTMENTS
-- =============================================
-- A few appointments for our patients
INSERT INTO appointments (id, patient_id, created_by, title, location, appointment_time, status) VALUES

  -- John's upcoming cardiology appointment
  -- created by Alice (his caregiver)
  (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    'Cardiology Checkup',
    'Toronto General Hospital, 200 Elizabeth St',
    NOW() + INTERVAL '3 days',
    'upcoming'
  ),

  -- John's upcoming diabetes appointment
  -- created by John himself
  (
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Diabetes Follow-up',
    'St. Michaels Clinic, 123 Queen St',
    NOW() + INTERVAL '7 days',
    'upcoming'
  ),

  -- John's completed eye appointment
  (
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000004',
    'Eye Exam',
    'Vision Care Centre, 50 Yonge St',
    NOW() - INTERVAL '5 days',
    'completed'
  ),

  -- Mary's upcoming blood pressure appointment
  (
    'b0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000003',
    'Blood Pressure Review',
    'Sunnybrook Hospital, 2075 Bayview Ave',
    NOW() + INTERVAL '5 days',
    'upcoming'
  );


-- =============================================
-- APPOINTMENT DRIVERS
-- =============================================
-- Who is driving to each appointment
INSERT INTO appointment_drivers (appointment_id, caregiver_id, status) VALUES

  -- Alice is driving John to cardiology
  (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    'accepted'
  ),

  -- Bob offered to drive John to diabetes appointment
  (
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000004',
    'offered'
  ),

  -- Alice drove John to eye exam (completed)
  (
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000003',
    'accepted'
  );


-- =============================================
-- NOTES
-- =============================================
-- Some notes on completed appointments
INSERT INTO notes (appointment_id, created_by, type, content) VALUES

  -- Text note on John's completed eye exam
  (
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000003',
    'text',
    'John was prescribed new reading glasses. Prescription: R +2.50, L +2.25. Follow up in 12 months.'
  ),

  -- Another text note on the same appointment
  (
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000004',
    'text',
    'John mentioned his eyes have been feeling dry lately. Doctor recommended lubricating eye drops.'
  );

--To summarize what this seed data gives you:
--2 patients — John and Mary
--3 caregivers — Alice, Bob, Carol
--Alice has access to both patients
--Bob has access to John only
--Carol is pending approval from John
--4 appointments across both patients
--2 notes on John's completed eye exam
--All passwords are Password123!
--creating db
--& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres
--CREATE DATABASE appointmate;   -->CREATE DATABASE
--connect to db:
--\c appointmate    -->You are now connected to database "appointmate"
--run the schema files: 
--\i 'C:/Users/areab/Desktop/Side_Projects/AppointmentTracker_AppointMate_/server/db/schema.sql'
--\i 'C:/Users/areab/Desktop/Side_Projects/AppointmentTracker_AppointMate_/server/db/seed.sql'
--\dt --> lista all the tables

f