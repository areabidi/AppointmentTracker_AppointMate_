// =============================================
// src/pages/Dashboard.jsx
// =============================================
// This is the main page after logging in
// It shows a summary of:
// - Upcoming appointments
// - Quick actions
// - Welcome message
// =============================================

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

function Dashboard() {
  // Stores the list of upcoming appointments
  const [appointments, setAppointments] = useState([]);

  // Tracks if data is still loading
  const [loading, setLoading] = useState(true);

  // Stores any error messages
  const [error, setError] = useState('');

  // Get the logged in user from localStorage
  const user = JSON.parse(localStorage.getItem('user'));

  const navigate = useNavigate();

  // =============================================
  // useEffect
  // =============================================
  // This runs automatically when the page loads
  // It fetches the appointments from the backend
  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await api.get('/appointments');

      // Only show upcoming appointments on dashboard
      const upcoming = response.data.filter(
        apt => apt.status === 'upcoming'
      );

      setAppointments(upcoming);

    } catch (err) {
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  // Format the date to be more readable
  // e.g. "April 3, 2026 at 2:00 PM"
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>

      {/* Welcome message */}
      <div style={styles.header}>
        <h1 style={styles.title}>
          Welcome back, {user?.first_name}!
        </h1>
        <p style={styles.subtitle}>
          You are logged in as a {user?.role}
        </p>
      </div>

      {/* Quick action buttons */}
      <div style={styles.actions}>
        <Link to="/appointments" style={styles.actionButton}>
          View All Appointments
        </Link>
        <Link to="/profile" style={styles.actionButtonOutline}>
          View Profile
        </Link>
      </div>

      {/* Upcoming appointments */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          Upcoming Appointments ({appointments.length})
        </h2>

        {error && <p style={styles.error}>{error}</p>}

        {appointments.length === 0 ? (
          <div style={styles.empty}>
            <p>No upcoming appointments.</p>
            <Link to="/appointments" style={styles.link}>
              Create one now
            </Link>
          </div>
        ) : (
          <div style={styles.appointmentList}>
            {appointments.map(apt => (
              <div key={apt.id} style={styles.appointmentCard}>

                {/* Appointment title and status */}
                <div style={styles.cardHeader}>
                  <h3 style={styles.aptTitle}>{apt.title}</h3>
                  <span style={styles.statusBadge}>
                    {apt.status}
                  </span>
                </div>

                {/* Appointment details */}
                <p style={styles.aptDetail}>
                  📅 {formatDate(apt.appointment_time)}
                </p>
                {apt.location && (
                  <p style={styles.aptDetail}>
                    📍 {apt.location}
                  </p>
                )}

                {/* Show patient name for caregivers */}
                {user?.role === 'caregiver' && apt.patient_first_name && (
                  <p style={styles.aptDetail}>
                    👤 Patient: {apt.patient_first_name} {apt.patient_last_name}
                  </p>
                )}

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '2rem'
  },
  header: {
    marginBottom: '2rem'
  },
  title: {
    color: '#333',
    marginBottom: '0.5rem'
  },
  subtitle: {
    color: '#666'
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem'
  },
  actionButton: {
    backgroundColor: '#1976d2',
    color: 'white',
    padding: '0.75rem 1.5rem',
    borderRadius: '4px',
    textDecoration: 'none',
    fontWeight: '500'
  },
  actionButtonOutline: {
    backgroundColor: 'transparent',
    color: '#1976d2',
    padding: '0.75rem 1.5rem',
    borderRadius: '4px',
    textDecoration: 'none',
    fontWeight: '500',
    border: '1px solid #1976d2'
  },
  section: {
    marginBottom: '2rem'
  },
  sectionTitle: {
    color: '#333',
    marginBottom: '1rem',
    borderBottom: '2px solid #e0e0e0',
    paddingBottom: '0.5rem'
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem'
  },
  empty: {
    textAlign: 'center',
    padding: '2rem',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    color: '#666'
  },
  link: {
    color: '#1976d2'
  },
  appointmentList: {
    display: 'grid',
    gap: '1rem'
  },
  appointmentCard: {
    backgroundColor: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem'
  },
  aptTitle: {
    color: '#333',
    margin: 0
  },
  statusBadge: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: '500'
  },
  aptDetail: {
    color: '#666',
    margin: '0.25rem 0',
    fontSize: '0.9rem'
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
    color: '#666'
  }
};

export default Dashboard;