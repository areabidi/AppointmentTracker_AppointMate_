// =============================================
// src/pages/Signup.jsx
// =============================================
// This is the signup page
// It allows new users to create an account
// They can sign up as a patient or caregiver
// On success it saves the token to localStorage
// and redirects to the dashboard
// =============================================

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

function Signup() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'caregiver',
    phone: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Send signup request to backend
      const response = await api.post('/auth/signup', formData);

      // Save token and user to localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Redirect to dashboard
      navigate('/dashboard');

    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create an Account</h2>
        <p style={styles.subtitle}>Join AppointMate today</p>

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit}>

          {/* First name and last name side by side */}
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                style={styles.input}
                placeholder="First name"
                required
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                style={styles.input}
                placeholder="Last name"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={styles.input}
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Password */}
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={styles.input}
              placeholder="Create a password"
              required
            />
          </div>

          {/* Phone */}
          <div style={styles.field}>
            <label style={styles.label}>Phone (optional)</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              style={styles.input}
              placeholder="Enter your phone number"
            />
          </div>

          {/* Role selection */}
          <div style={styles.field}>
            <label style={styles.label}>I am signing up as a:</label>
            <div style={styles.roleContainer}>

              {/* Patient option */}
              <div
                style={{
                  ...styles.roleCard,
                  ...(formData.role === 'patient' ? styles.roleCardActive : {})
                }}
                onClick={() => setFormData({ ...formData, role: 'patient' })}
              >
                <strong>Patient</strong>
                <p style={styles.roleDesc}>
                  I need help managing my appointments
                </p>
              </div>

              {/* Caregiver option */}
              <div
                style={{
                  ...styles.roleCard,
                  ...(formData.role === 'caregiver' ? styles.roleCardActive : {})
                }}
                onClick={() => setFormData({ ...formData, role: 'caregiver' })}
              >
                <strong>Caregiver</strong>
                <p style={styles.roleDesc}>
                  I help someone manage their appointments
                </p>
              </div>

            </div>
          </div>

          <button
            type="submit"
            style={styles.button}
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={styles.link}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '2rem 0'
  },
  card: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '480px'
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '0.5rem'
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: '1.5rem'
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
    textAlign: 'center'
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem'
  },
  field: {
    marginBottom: '1rem'
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    color: '#333',
    fontWeight: '500'
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    boxSizing: 'border-box'
  },
  roleContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem'
  },
  roleCard: {
    padding: '1rem',
    border: '2px solid #ddd',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'center'
  },
  roleCardActive: {
    border: '2px solid #1976d2',
    backgroundColor: '#e3f2fd'
  },
  roleDesc: {
    fontSize: '0.8rem',
    color: '#666',
    marginTop: '0.5rem'
  },
  button: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '0.5rem'
  },
  link: {
    textAlign: 'center',
    marginTop: '1rem',
    color: '#666'
  }
};

export default Signup;