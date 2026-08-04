-- =============================================
-- APPOINTMATE DATABASE SCHEMA
-- =============================================
--
-- TABLE: users
-- ---------------------------------------------
-- PK  id               UUID          auto generated
--     email            VARCHAR(255)  unique, not null
--     password_hash    VARCHAR(255)  not null
--     role             ENUM          'patient' or 'caregiver'
--     first_name       VARCHAR(100)  not null
--     last_name        VARCHAR(100)  not null
--     phone            VARCHAR(20)   optional
--     created_at       TIMESTAMP     auto set
--
-- TABLE: patient_profiles
-- ---------------------------------------------
-- PK  id               UUID
-- FK  user_id          UUID          -> users.id
--     date_of_birth    DATE
--     address          TEXT
--     medical_notes    TEXT
--     emergency_contact VARCHAR(255)
--
-- TABLE: caregiver_profiles
-- ---------------------------------------------
-- PK  id               UUID
-- FK  user_id          UUID          -> users.id
--     address          VARCHAR(255)
--     can_drive        BOOLEAN       default false
--
-- TABLE: patient_caregiver_access
-- ---------------------------------------------
-- FK  patient_id       UUID          -> users.id
-- FK  caregiver_id     UUID          -> users.id
--     granted_at       TIMESTAMP     auto set
--     status           ENUM          'pending', 'approved', 'revoked'
--     PRIMARY KEY (patient_id, caregiver_id)
--
-- TABLE: appointments
-- ---------------------------------------------
-- PK  id               UUID
-- FK  patient_id       UUID          -> users.id
-- FK  created_by       UUID          -> users.id
--     title            VARCHAR(255)  not null
--     location         VARCHAR(255)
--     appointment_time TIMESTAMP     not null
--     status           ENUM          'upcoming', 'completed', 'cancelled'
--     cancel_reason    TEXT          required if cancelled
--     created_at       TIMESTAMP     auto set
--
-- TABLE: appointment_drivers
-- ---------------------------------------------
-- PK  id               UUID
-- FK  appointment_id   UUID          -> appointments.id
-- FK  caregiver_id     UUID          -> users.id
--     status           ENUM          'offered', 'accepted', 'cancelled', 'conflict'
--     offered_at       TIMESTAMP     auto set
--
-- TABLE: notes
-- ---------------------------------------------
-- PK  id               UUID
-- FK  appointment_id   UUID          -> appointments.id
-- FK  created_by       UUID          -> users.id
--     type             ENUM          'text', 'audio', 'image'
--     content          TEXT          text or file URL
--     created_at       TIMESTAMP     auto set
--     updated_at       TIMESTAMP     auto set
--
-- =============================================
-- RELATIONSHIPS
-- =============================================
-- users -> patient_profiles         one user has one patient profile
-- users -> caregiver_profiles       one user has one caregiver profile
-- users -> patient_caregiver_access one patient grants access to many caregivers
-- users -> appointments             one patient has many appointments
-- appointments -> appointment_drivers one appointment has many driver offers
-- appointments -> notes             one appointment has many notes
--
-- =============================================
-- KEY
-- =============================================
-- PK = Primary Key (unique ID for each row)
-- FK = Foreign Key (links to another table)
-- =============================================


-- =============================================
-- EXTENSIONS
-- =============================================

-- Enable UUID generation
-- UUIDs are unique IDs that look like this:
-- 550e8400-e29b-41d4-a716-446655440000
-- We use them instead of 1, 2, 3... because
-- they are harder to guess and more secure
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- =============================================
-- ENUMS
-- =============================================
-- Enums are like a multiple choice question
-- the value can ONLY be one of the listed options

-- A user can either be a patient or a caregiver
CREATE TYPE user_role AS ENUM ('patient', 'caregiver');

-- pending  = caregiver requested access, waiting for patient to approve
-- approved = patient approved the caregiver
-- revoked  = patient removed the caregiver's access
CREATE TYPE access_status AS ENUM ('pending', 'approved', 'revoked');

-- upcoming  = appointment is in the future
-- completed = appointment has happened
-- cancelled = appointment was cancelled (reason required)
CREATE TYPE appointment_status AS ENUM ('upcoming', 'completed', 'cancelled');

-- offered   = caregiver said they can drive
-- accepted  = confirmed they are driving
-- cancelled = caregiver cancelled their offer
-- conflict  = two caregivers accepted at the same time (CAP theorem)
CREATE TYPE driver_status AS ENUM ('offered', 'accepted', 'cancelled', 'conflict');

-- text  = written note
-- audio = voice recording (stored as file URL)
-- image = photo (stored as file URL)
CREATE TYPE note_type AS ENUM ('text', 'audio', 'image');


-- =============================================
-- TABLE: users
-- =============================================
-- Main table for ALL users
-- Both patients and caregivers are stored here
CREATE TABLE users (
  -- Unique ID for each user (auto generated)
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Email is used to log in, must be unique
  email VARCHAR(255) UNIQUE NOT NULL,

  -- We NEVER store plain text passwords
  -- bcrypt turns "mypassword" into a scrambled
  -- string that cannot be reversed
  password_hash VARCHAR(255) NOT NULL,

  -- Is this person a patient or caregiver?
  role user_role NOT NULL,

  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,

  -- Phone is optional
  phone VARCHAR(20),

  -- Automatically set to current time when created
  created_at TIMESTAMP DEFAULT NOW()
);


-- =============================================
-- TABLE: patient_profiles
-- =============================================
-- Extra information specific to patients
-- One patient profile per patient user
CREATE TABLE patient_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Links this profile to a user
  -- ON DELETE CASCADE means if the user is deleted
  -- their profile is automatically deleted too
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  date_of_birth DATE,
  address TEXT,

  -- General medical notes e.g. allergies, conditions
  medical_notes TEXT,

  emergency_contact VARCHAR(255)
);


-- =============================================
-- TABLE: caregiver_profiles
-- =============================================
-- Extra information specific to caregivers
CREATE TABLE caregiver_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  address VARCHAR(255),

  -- Can this caregiver drive the patient?
  -- Default is false until they say otherwise
  can_drive BOOLEAN DEFAULT FALSE
);


-- =============================================
-- TABLE: patient_caregiver_access
-- =============================================
-- Controls which caregivers can see which patient
-- The patient must approve a caregiver before that
-- caregiver can see their appointments or info
CREATE TABLE patient_caregiver_access (
  -- The patient granting access
  patient_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- The caregiver being given access
  caregiver_id UUID REFERENCES users(id) ON DELETE CASCADE,

  granted_at TIMESTAMP DEFAULT NOW(),

  -- Current status of the access request
  status access_status DEFAULT 'pending',

  -- Composite primary key means the combination
  -- of patient_id + caregiver_id must be unique
  -- A caregiver can only have one access record per patient
  PRIMARY KEY (patient_id, caregiver_id)
);


-- =============================================
-- TABLE: appointments
-- =============================================
-- Stores all appointments for all patients
-- Can be created by the patient OR any caregiver
-- who has approved access to that patient
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Which patient is this appointment for?
  patient_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Who created this appointment?
  -- Could be the patient themselves or a caregiver
  created_by UUID REFERENCES users(id),

  title VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  appointment_time TIMESTAMP NOT NULL,

  status appointment_status DEFAULT 'upcoming',

  -- If cancelled, a reason MUST be provided
  -- This is enforced in the backend code
  cancel_reason TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);


-- =============================================
-- TABLE: appointment_drivers
-- =============================================
-- Tracks which caregiver is driving the patient
-- Handles CAP theorem requirement:
-- if two caregivers accept at the same time
-- both get marked as 'conflict' and notified
CREATE TABLE appointment_drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,

  caregiver_id UUID REFERENCES users(id) ON DELETE CASCADE,

  status driver_status DEFAULT 'offered',

  offered_at TIMESTAMP DEFAULT NOW()
);


-- =============================================
-- TABLE: notes
-- =============================================
-- Notes attached to appointments
-- Can be text, audio recordings, or images
-- Can be edited or deleted by their creator
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,

  -- Who wrote this note?
  created_by UUID REFERENCES users(id),

  type note_type NOT NULL,

  -- For text notes: the actual text
  -- For audio/image notes: the URL of the file
  content TEXT NOT NULL,

  created_at TIMESTAMP DEFAULT NOW(),

  -- Tracks when the note was last edited
  updated_at TIMESTAMP DEFAULT NOW()
);


--Relationships
--users ──→ patient_profiles (one user has one patient profile)
--users ──→ caregiver_profiles (one user has one caregiver profile)
--users ──→ patient_caregiver_access (one patient grants access to many caregivers)
--users ──→ appointments (one patient has many appointments)
--appointments ──→ appointment_drivers (one appointment has many driver offers)
--appointments ──→ notes (one appointment has many notes)


ALTER TABLE patient_profiles 
ADD COLUMN emergency_contact_phone VARCHAR(20);

ALTER TABLE patient_profiles
ADD COLUMN allergies TEXT;