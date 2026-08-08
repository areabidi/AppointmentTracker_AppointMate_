// =============================================
// src/components/AppointmentDriver.jsx
// =============================================
// Shows the driver status for an appointment
//
// For caregivers:
// - See if someone is already driving
// - Offer to drive
// - Accept to drive
// - Cancel their offer
//
// For patients:
// - See who is driving them
//
// Used inside the appointment modal
// in Appointments.jsx
//
// FLOW:
// 1. Component loads → fetches driver info
// 2. Shows current driver status
// 3. Caregiver can offer/accept/cancel
// =============================================

import React, { useState, useEffect } from 'react';
import api from '../services/api';

function AppointmentDriver({ appointmentId }) {

  // Logged in user from localStorage
  const user = JSON.parse(localStorage.getItem('user'));

  // All driver offers for this appointment
  const [drivers, setDrivers] = useState([]);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch drivers when component loads
  useEffect(() => {
    fetchDrivers();
  }, [appointmentId]);
// =============================================
  // fetchDrivers
  // =============================================
  // Calls GET /api/drivers/:appointmentId
  // Gets all driver offers for this appointment
  const fetchDrivers = async () => {
    try {
      const response = await api.get(`/drivers/${appointmentId}`);
      setDrivers(response.data);
    } catch (err) {
      setError('Failed to load driver info');
    } finally {
      setLoading(false);
    }
  };
// =============================================
  // handleOffer
  // =============================================
  // Caregiver offers to drive to the appointment
  // Calls POST /api/drivers/offer
  const handleOffer = async () => {
    setError('');
    setSuccess('');
    try {
      await api.post('/drivers/offer', {
        appointment_id: appointmentId
      });
      setSuccess('You have offered to drive!');
      fetchDrivers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to offer drive');
    }
  };

  // =============================================
  // handleAccept
  // =============================================
  // Caregiver confirms they are driving
  // Calls PUT /api/drivers/accept/:appointmentId
  // Handles conflict if two caregivers accept
  // at the same time
  const handleAccept = async () => {
    setError('');
    setSuccess('');
    try {
      await api.put(`/drivers/accept/${appointmentId}`);
      setSuccess('You are now confirmed as the driver!');
      fetchDrivers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to accept drive');
    }
  };

  // =============================================
  // handleCancel
  // =============================================
  // Caregiver cancels their drive offer
  // Calls DELETE /api/drivers/cancel/:appointmentId
  const handleCancel = async () => {
    setError('');
    setSuccess('');
    try {
      await api.delete(`/drivers/cancel/${appointmentId}`);
      setSuccess('Drive offer cancelled.');
      fetchDrivers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel drive');
    }
  };

// Find the accepted driver if there is one
  const acceptedDriver = drivers.find(d => d.status === 'accepted');

  // Find the current user's offer if they made one
  const myOffer = drivers.find(d => d.caregiver_id === user.id);

  if (loading) return <div style={styles.loading}>Loading driver info...</div>;

  return (
    <div style={styles.container}>

      {/* Section title */}
      <div style={styles.sectionTitle}>🚗 Driver</div>

      {/* Error and success messages */}
      {error && <p style={styles.error}>{error}</p>}
      {success && <p style={styles.success}>{success}</p>}

      {/* ── Show accepted driver if there is one ── */}
      {acceptedDriver ? (
        <div style={styles.acceptedCard}>
          <div style={styles.acceptedInfo}>
            <div style={styles.avatar}>
              {acceptedDriver.first_name[0]}{acceptedDriver.last_name[0]}
            </div>
            <div>
              <p style={styles.driverName}>
                {acceptedDriver.first_name} {acceptedDriver.last_name}
              </p>
              <p style={styles.driverStatus}>✅ Confirmed driver</p>
            </div>
          </div>

          {/* Only show cancel to the accepted driver */}
          {user.id === acceptedDriver.caregiver_id && (
            <button onClick={handleCancel} style={styles.cancelBtn}>
              Cancel
            </button>
          )}
        </div>

      ) : (
        // ── No driver yet ──
        <div>
          <p style={styles.noDriver}>No driver assigned yet</p>

          {/* Only show buttons to caregivers */}
          {user.role === 'caregiver' && (
            <>
              {/* If caregiver has no offer yet → show offer button */}
              {!myOffer && (
                <button onClick={handleOffer} style={styles.offerBtn}>
                  🚗 I'll take them
                </button>
              )}

              {/* If caregiver offered → show accept and cancel buttons */}
              {myOffer && myOffer.status === 'offered' && (
                <div style={styles.offerActions}>
                  <p style={styles.offerPending}>
                    You offered to drive — waiting for confirmation
                  </p>
                  <div style={styles.btnRow}>
                    <button onClick={handleAccept} style={styles.acceptBtn}>
                      ✅ Confirm I'm driving
                    </button>
                    <button onClick={handleCancel} style={styles.cancelBtn}>
                      Cancel offer
                    </button>
                  </div>
                </div>
              )}

              {/* If conflict occurred */}
              {myOffer && myOffer.status === 'conflict' && (
                <div style={styles.conflictCard}>
                  ⚠️ Conflict! Another caregiver also accepted.
                  Please coordinate with each other.
                </div>
              )}
            </>
          )}
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
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e0e0e0'
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#666',
    marginBottom: '0.75rem'
  },
  loading: {
    fontSize: '13px',
    color: '#999',
    padding: '0.5rem 0'
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    fontSize: '13px',
    marginBottom: '0.5rem'
  },
  success: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    fontSize: '13px',
    marginBottom: '0.5rem'
  },
  acceptedCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0fdf4',
    border: '1px solid #6ee7c7',
    borderRadius: '8px',
    padding: '0.75rem 1rem'
  },
  acceptedInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#1976d2',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 'bold',
    flexShrink: 0
  },
  driverName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    margin: '0 0 2px'
  },
  driverStatus: {
    fontSize: '12px',
    color: '#2e7d32',
    margin: 0
  },
  noDriver: {
    fontSize: '13px',
    color: '#999',
    fontStyle: 'italic',
    marginBottom: '0.75rem'
  },
  offerBtn: {
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    padding: '0.6rem 1.25rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: 'inherit'
  },
  offerActions: {
    marginTop: '0.5rem'
  },
  offerPending: {
    fontSize: '13px',
    color: '#f57f17',
    marginBottom: '0.5rem'
  },
  btnRow: {
    display: 'flex',
    gap: '8px'
  },
  acceptBtn: {
    backgroundColor: '#2e7d32',
    color: 'white',
    border: 'none',
    padding: '0.6rem 1.25rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: 'inherit'
  },
  cancelBtn: {
    backgroundColor: 'transparent',
    color: '#c62828',
    border: '1px solid #c62828',
    padding: '0.6rem 1.25rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: 'inherit'
  },
  conflictCard: {
    backgroundColor: '#fff8e1',
    border: '1px solid #f57f17',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    fontSize: '13px',
    color: '#633806'
  }
};

export default AppointmentDriver;