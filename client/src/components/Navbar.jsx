// =============================================
// src/components/Navbar.jsx
// =============================================
// This is the navigation bar that shows
// on every page of the app
//
// It shows different links depending on
// whether the user is logged in or not
//
// Logged out → shows Login and Signup links
// Logged in  → shows Dashboard, Appointments,
//              Profile and Logout links
// =============================================

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();

  // Get the user from localStorage
  // This tells us if someone is logged in
  // and what their name and role is
  const user = JSON.parse(localStorage.getItem('user'));
  const isLoggedIn = !!localStorage.getItem('token');

  // =============================================
  // handleLogout
  // =============================================
  // Clears localStorage and redirects to login
  // This effectively logs the user out
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav style={styles.nav}>
      {/* App name / logo */}
      <Link to="/dashboard" style={styles.logo}>
        AppointMate
      </Link>

      {/* Navigation links */}
      <div style={styles.links}>
        {isLoggedIn ? (
          // Show these links when logged in
          <>
            <Link to="/dashboard" style={styles.link}>
              Dashboard
            </Link>
            <Link to="/appointments" style={styles.link}>
              Appointments
            </Link>
            <Link to="/profile" style={styles.link}>
              Profile
            </Link>

            {/* Show the user's name and role */}
            <span style={styles.userInfo}>
              {user?.first_name} ({user?.role})
            </span>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              style={styles.logoutButton}
            >
              Logout
            </button>
          </>
        ) : (
          // Show these links when logged out
          <>
            <Link to="/login" style={styles.link}>
              Login
            </Link>
            <Link to="/signup" style={styles.link}>
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: '#1976d2',
    color: 'white'
  },
  logo: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '1.5rem',
    fontWeight: 'bold'
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem'
  },
  link: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '1rem'
  },
  userInfo: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '0.9rem'
  },
  logoutButton: {
    backgroundColor: 'transparent',
    color: 'white',
    border: '1px solid white',
    padding: '0.4rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem'
  }
};

export default Navbar;