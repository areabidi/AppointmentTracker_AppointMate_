// =============================================
// src/components/ProfileCaregivers.jsx
// =============================================
// Shows all caregivers that have access
// to the logged in patient's profile.
//
// Features:
// 1. View caregivers
// 2. Grant caregiver access
// 3. Revoke caregiver access
//
// Used inside Profile.jsx
//
// FLOW:
// 1. Component loads
// 2. Fetch caregivers from database
// 3. Display caregiver list
// 4. Patient can add a caregiver
// 5. Patient can revoke caregiver access
// =============================================

import React, { useState, useEffect } from "react";
import api from "../services/api";

function ProfileCaregivers() {

  // =============================================
  // Logged in user
  // =============================================
  // Retrieved from localStorage after login.
  // Used to determine which patient's
  // caregivers should be displayed.
  const user = JSON.parse(localStorage.getItem("user"));

  // =============================================
  // State
  // =============================================

  // Stores all caregivers returned
  // from the database.
  const [caregivers, setCaregivers] = useState([]);

  // True while waiting for the API
  // to return caregiver data.
  const [loading, setLoading] = useState(true);

  // Error message shown to the user.
  const [error, setError] = useState("");

  // Success message shown after
  // granting or revoking access.
  const [success, setSuccess] = useState("");

  // Controls whether the
  // "Add Caregiver" form is visible.
  const [showGrantForm, setShowGrantForm] = useState(false);

  // Stores the caregiver's email
  // entered by the patient.
  const [caregiverEmail, setCaregiverEmail] = useState("");

  // =============================================
  // useEffect
  // =============================================
  // Runs once when the component loads.
  // Fetches all caregivers assigned
  // to the logged in patient.
  useEffect(() => {
    fetchCaregivers();
  }, []);

  // =============================================
  // fetchCaregivers
  // =============================================
  // Calls:
  // GET /access/my-caregivers
  //
  // Retrieves every caregiver that has
  // access to this patient's profile.
  const fetchCaregivers = async () => {

    try {

      const response = await api.get("/access/my-caregivers");

      // Save caregivers into state
      setCaregivers(response.data);

    } catch (err) {

      setError("Failed to load caregivers");

    } finally {

      // Stop loading spinner
      setLoading(false);

    }
  };

  // =============================================
  // handleGrantAccess
  // =============================================
  // Called when the patient submits
  // the "Grant Access" form.
  //
  // Sends the caregiver's email to
  // the backend so access can be granted.
  const handleGrantAccess = async (e) => {

    e.preventDefault();

    // Clear previous messages
    setError("");
    setSuccess("");

    try {

      await api.post("/access/grant", {
        caregiver_email: caregiverEmail
      });

      // Show success message
      setSuccess("Access granted successfully!");

      // Clear email textbox
      setCaregiverEmail("");

      // Hide the form
      setShowGrantForm(false);

      // Refresh caregiver list
      fetchCaregivers();

    } catch (err) {

      setError(
        err.response?.data?.error ||
        "Failed to grant access"
      );

    }
  };

  // =============================================
  // handleRevokeAccess
  // =============================================
  // Removes a caregiver's access
  // to this patient's profile.
  const handleRevokeAccess = async (caregiverId) => {

    // Clear previous messages
    setError("");
    setSuccess("");

    try {

      await api.delete(`/access/revoke/${caregiverId}`);

      // Notify user
      setSuccess("Access revoked successfully!");

      // Refresh caregiver list
      fetchCaregivers();

    } catch (err) {

      setError(
        err.response?.data?.error ||
        "Failed to revoke access"
      );

    }
  };

  // =============================================
  // getStatusColor
  // =============================================
  // Returns the background and text
  // colour for each caregiver status.
  //
  // approved = green
  // pending  = yellow
  // revoked  = red
  const getStatusColor = (status) => {

    switch (status) {

      case "approved":
        return {
          bg: "#e8f5e9",
          color: "#2e7d32"
        };

      case "pending":
        return {
          bg: "#fff8e1",
          color: "#f57f17"
        };

      case "revoked":
        return {
          bg: "#ffebee",
          color: "#c62828"
        };

      default:
        return {
          bg: "#f5f5f5",
          color: "#666"
        };
    }
  };
  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.container}>

      {/* Error and success messages */}
      {error && <p style={styles.error}>{error}</p>}
      {success && <p style={styles.success}>{success}</p>}

      {/* ── Header row with Add button ── */}
      <div style={styles.headerRow}>
        <h3 style={styles.title}>My Caregivers</h3>
        <button
          style={styles.addBtn}
          onClick={() => setShowGrantForm(!showGrantForm)}
        >
          {showGrantForm ? 'Cancel' : '+ Add Caregiver'}
        </button>
      </div>

      {/* ── Grant access form ── */}
      {showGrantForm && (
        <form onSubmit={handleGrantAccess} style={styles.grantForm}>
          <input
            type="email"
            value={caregiverEmail}
            onChange={(e) => setCaregiverEmail(e.target.value)}
            style={styles.input}
            placeholder="Enter caregiver's email address"
            required
          />
          <button type="submit" style={styles.submitBtn}>
            Grant Access
          </button>
        </form>
      )}

      {/* ── Caregiver list ── */}
      {caregivers.length === 0 ? (
        <div style={styles.empty}>
          <p>No caregivers yet. Add one above!</p>
        </div>
      ) : (
        <div style={styles.list}>
          {caregivers.map(caregiver => {
            const statusStyle = getStatusColor(caregiver.status);
            return (
              <div key={caregiver.id} style={styles.card}>

                {/* Caregiver info */}
                <div style={styles.cardLeft}>
                  <div style={styles.avatar}>
                    {caregiver.first_name[0]}{caregiver.last_name[0]}
                  </div>
                  <div>
                    <p style={styles.name}>
                      {caregiver.first_name} {caregiver.last_name}
                    </p>
                    <p style={styles.email}>{caregiver.email}</p>
                    {caregiver.can_drive && (
                      <p style={styles.canDrive}>🚗 Can drive</p>
                    )}
                  </div>
                </div>

                {/* Status badge + revoke button */}
                <div style={styles.cardRight}>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: statusStyle.bg,
                    color: statusStyle.color
                  }}>
                    {caregiver.status}
                  </span>
                  {caregiver.status === 'approved' && (
                    <button
                      onClick={() => handleRevokeAccess(caregiver.id)}
                      style={styles.revokeBtn}
                    >
                      Revoke
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

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
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  },
  title: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#333',
    margin: 0
  },
  addBtn: {
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontFamily: 'inherit'
  },
  grantForm: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem'
  },
  input: {
    flex: 1,
    padding: '0.6rem 0.75rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '0.95rem',
    fontFamily: 'inherit'
  },
  submitBtn: {
    backgroundColor: '#2e7d32',
    color: 'white',
    border: 'none',
    padding: '0.6rem 1.25rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: 'inherit'
  },
  empty: {
    textAlign: 'center',
    padding: '2rem',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    color: '#666'
  },
  list: {
    display: 'grid',
    gap: '0.75rem'
  },
  card: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '1rem 1.25rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
  },
  cardLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#1976d2',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    flexShrink: 0
  },
  name: {
    fontWeight: '500',
    color: '#333',
    margin: '0 0 0.2rem'
  },
  email: {
    color: '#666',
    fontSize: '0.85rem',
    margin: '0 0 0.2rem'
  },
  canDrive: {
    color: '#2e7d32',
    fontSize: '0.8rem',
    margin: 0
  },
  cardRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  statusBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: '500'
  },
  revokeBtn: {
    backgroundColor: 'transparent',
    color: '#c62828',
    border: '1px solid #c62828',
    padding: '0.35rem 0.75rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontFamily: 'inherit'
  }
};

export default ProfileCaregivers;