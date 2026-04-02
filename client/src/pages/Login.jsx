// =============================================
// src/pages/Login.jsx
// =============================================
// This is the login page
// It allows users to log in with email and password
// On success it saves the token to localStorage
// and redirects to the dashboard
// =============================================

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

function Login() {
  // useState stores the form data
  // Every time the user types something
  // the state updates automatically
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Stores any error messages to show the user
  const [error, setError] = useState('');

  // Tracks if the form is being submitted
  // Used to disable the button while loading
  const [loading, setLoading] = useState(false);

  // useNavigate lets us redirect to another page
  const navigate = useNavigate();

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
  // handleSubmit
  // =============================================
  // Runs when the user clicks the login button
  // Sends the email and password to the backend
  const handleSubmit = async (e) => {
    // Prevent the page from refreshing
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Send login request to backend
      const response = await api.post('/auth/login', formData);

      // Save the token and user info to localStorage
      // This is how React remembers the user is logged in
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Redirect to dashboard
      navigate('/dashboard');

    } catch (err) {
      // Show error message to user
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Welcome to AppointMate</h2>
        <p style={styles.subtitle}>Sign in to your account</p>

        {/* Show error message if there is one */}
        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit}>
          {/* Email field */}
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

          {/* Password field */}
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={styles.input}
              placeholder="Enter your password"
              required
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            style={styles.button}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Link to signup page */}
        <p style={styles.link}>
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

// =============================================
// Styles
// =============================================
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5'
  },
  card: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px'
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

export default Login;