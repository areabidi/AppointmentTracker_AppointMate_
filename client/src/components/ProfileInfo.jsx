// =============================================
// src/components/ProfileInfo.jsx
// =============================================
// Shows the patient's personal info
// Includes an edit button at the bottom
// that turns all fields into editable inputs
//
// Used inside Profile.jsx as the "My Info" tab
//
// FLOW:
// 1. Component loads → fetches profile from DB
// 2. Shows profile data in read-only view
// 3. User clicks Edit → fields become editable
// 4. User clicks Save → sends updated data to DB
// 5. Back to read-only view with new data
// =============================================

import React, { useState, useEffect } from 'react';
import api from '../services/api';

function ProfileInfo() {

  // The logged in user from localStorage
  // Contains: id, first_name, last_name, email, role
  const user = JSON.parse(localStorage.getItem('user'));

  // Profile data fetched from the database
  // Contains: date_of_birth, address, medical_notes,
  //           allergies, emergency_contact, emergency_contact_phone
  const [profile, setProfile] = useState(null);

  // Controls whether we are in view or edit mode
  // false = view mode (default)
  // true  = edit mode (when Edit button clicked)
  const [isEditing, setIsEditing] = useState(false);

  // Stores the editable form values
  // Pre-filled with current profile data when Edit is clicked
  const [formData, setFormData] = useState({
    date_of_birth: '',
    address: '',
    medical_notes: '',
    allergies: '',
    emergency_contact: '',
    emergency_contact_phone: ''
  });

  // Loading state — true while fetching from DB
  const [loading, setLoading] = useState(true);

  // Error and success messages to show the user
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // =============================================
  // useEffect
  // =============================================
  // Runs once when the component loads
  // Fetches the patient's profile from the backend
  useEffect(() => {
    fetchProfile();
  }, []);

  // =============================================
  // fetchProfile
  // =============================================
  // Calls GET /api/profile
  // Gets the patient's profile data from the DB
  // Pre-fills formData so Edit mode is ready
  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile');
      setProfile(response.data);

      // Pre-fill form with existing data
      // So when user clicks Edit, fields are already filled
      setFormData({
        date_of_birth: response.data.date_of_birth || '',
        address: response.data.address || '',
        medical_notes: response.data.medical_notes || '',
        allergies: response.data.allergies || '',
        emergency_contact: response.data.emergency_contact || '',
        emergency_contact_phone: response.data.emergency_contact_phone || ''
      });

    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // handleChange
  // =============================================
  // Runs every time the user types in a field
  // Updates the formData state with the new value
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // =============================================
  // handleSave
  // =============================================
  // Calls PUT /api/profile
  // Sends updated formData to the backend
  // Updates the profile state with new data
  const handleSave = async () => {
    setError('');
    setSuccess('');

    try {
      const response = await api.put('/profile', formData);
      setProfile(response.data);
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    }
  };

  // =============================================
  // handleCancel
  // =============================================
  // Cancels edit mode without saving
  // Resets formData back to current profile data
  const handleCancel = () => {
    setFormData({
      date_of_birth: profile.date_of_birth || '',
      address: profile.address || '',
      medical_notes: profile.medical_notes || '',
      allergies: profile.allergies || '',
      emergency_contact: profile.emergency_contact || '',
      emergency_contact_phone: profile.emergency_contact_phone || ''
    });
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  // =============================================
  // calculateAge
  // =============================================
  // Takes a date of birth and returns the age
  // e.g. "1950-01-01" → 74
  const calculateAge = (dob) => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.container}>

      {/* Error and success messages */}
      {error && <p style={styles.error}>{error}</p>}
      {success && <p style={styles.success}>{success}</p>}

      {/* ── Personal Info Section ── */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Personal Info</h3>

        {/* Date of Birth / Age */}
        <div style={styles.field}>
          <span style={styles.fieldLabel}>Date of Birth</span>
          {isEditing ? (
            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              style={styles.input}
            />
          ) : (
            <span style={styles.fieldValue}>
              {profile?.date_of_birth
                ? `${new Date(profile.date_of_birth).toLocaleDateString()} (Age ${calculateAge(profile.date_of_birth)})`
                : 'Not provided'}
            </span>
          )}
        </div>

        {/* Address */}
        <div style={styles.field}>
          <span style={styles.fieldLabel}>Address</span>
          {isEditing ? (
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              style={styles.input}
              placeholder="Enter your address"
            />
          ) : (
            <span style={styles.fieldValue}>
              {profile?.address || 'Not provided'}
            </span>
          )}
        </div>
      </div>

      {/* ── Medical Info Section ── */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Medical Info</h3>

        {/* Allergies */}
        <div style={styles.field}>
          <span style={styles.fieldLabel}>Allergies</span>
          {isEditing ? (
            <input
              type="text"
              name="allergies"
              value={formData.allergies}
              onChange={handleChange}
              style={styles.input}
              placeholder="e.g. Penicillin, Peanuts"
            />
          ) : (
            <span style={styles.fieldValue}>
              {profile?.allergies || 'None listed'}
            </span>
          )}
        </div>

        {/* Medical Notes */}
        <div style={styles.field}>
          <span style={styles.fieldLabel}>Medical Notes</span>
          {isEditing ? (
            <textarea
              name="medical_notes"
              value={formData.medical_notes}
              onChange={handleChange}
              style={styles.textarea}
              placeholder="e.g. Diabetic, uses wheelchair"
              rows={3}
            />
          ) : (
            <span style={styles.fieldValue}>
              {profile?.medical_notes || 'None listed'}
            </span>
          )}
        </div>
      </div>

      {/* ── Emergency Contact Section ── */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Emergency Contact</h3>

        {/* Name */}
        <div style={styles.field}>
          <span style={styles.fieldLabel}>Name</span>
          {isEditing ? (
            <input
              type="text"
              name="emergency_contact"
              value={formData.emergency_contact}
              onChange={handleChange}
              style={styles.input}
              placeholder="Emergency contact name"
            />
          ) : (
            <span style={styles.fieldValue}>
              {profile?.emergency_contact || 'Not provided'}
            </span>
          )}
        </div>

        {/* Phone */}
        <div style={styles.field}>
          <span style={styles.fieldLabel}>Phone</span>
          {isEditing ? (
            <input
              type="tel"
              name="emergency_contact_phone"
              value={formData.emergency_contact_phone}
              onChange={handleChange}
              style={styles.input}
              placeholder="Emergency contact phone"
            />
          ) : (
            <span style={styles.fieldValue}>
              {profile?.emergency_contact_phone || 'Not provided'}
            </span>
          )}
        </div>
      </div>

      {/* ── Edit / Save / Cancel Buttons ── */}
      <div style={styles.buttonRow}>
        {isEditing ? (
          <>
            <button onClick={handleCancel} style={styles.cancelBtn}>
              Cancel
            </button>
            <button onClick={handleSave} style={styles.saveBtn}>
              Save Changes
            </button>
          </>
        ) : (
          <button onClick={() => setIsEditing(true)} style={styles.editBtn}>
            ✏️ Edit Profile
          </button>
        )}
      </div>

    </div>
  );
}

// =============================================
// Styles
// =============================================
const styles = {
  container: {
    maxWidth: '600px',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    color: '#666'
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem'
  },
  success: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem'
  },
  section: {
    backgroundColor: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '1.25rem 1.5rem',
    marginBottom: '1rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
  },
  sectionTitle: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#333',
    margin: '0 0 1rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid #f0f0f0'
  },
  field: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    marginBottom: '0.85rem'
  },
  fieldLabel: {
    fontSize: '0.85rem',
    fontWeight: '500',
    color: '#888',
    minWidth: '140px',
    paddingTop: '0.5rem'
  },
  fieldValue: {
    fontSize: '0.95rem',
    color: '#333',
    paddingTop: '0.5rem'
  },
  input: {
    flex: 1,
    padding: '0.6rem 0.75rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '0.95rem',
    fontFamily: 'inherit'
  },
  textarea: {
    flex: 1,
    padding: '0.6rem 0.75rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    marginTop: '1.5rem'
  },
  editBtn: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.95rem',
    cursor: 'pointer',
    fontFamily: 'inherit'
  },
  saveBtn: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#2e7d32',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.95rem',
    cursor: 'pointer',
    fontFamily: 'inherit'
  },
  cancelBtn: {
    padding: '0.75rem 1.5rem',
    backgroundColor: 'transparent',
    color: '#666',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '0.95rem',
    cursor: 'pointer',
    fontFamily: 'inherit'
  }
};

export default ProfileInfo;
