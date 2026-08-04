/// =============================================
// src/pages/Profile.jsx
// =============================================
// Main profile page for all users
//
// Has two tabs:
// - My Info       → shows ProfileInfo component
// - My Caregivers → shows ProfileCaregivers component (patients)
// - My Patients   → shows ProfileCaregivers component (caregivers)
// =============================================

import React, { useState } from 'react';
import ProfileInfo from '../components/ProfileInfo';
import ProfileCaregivers from '../components/ProfileCaregivers';

function Profile() {

  // The logged in user from localStorage
  const user = JSON.parse(localStorage.getItem('user'));

  // Controls which tab is active
  // 'info' = My Info tab
  // 'connections' = My Caregivers / My Patients tab
  const [activeTab, setActiveTab] = useState('info');

  return (
    <div style={styles.container}>

      {/* ── Profile Header ── */}
      <div style={styles.profileCard}>
        <div style={styles.avatar}>
          {user.first_name[0]}{user.last_name[0]}
        </div>
        <div style={styles.profileInfo}>
          <h1 style={styles.name}>
            {user.first_name} {user.last_name}
          </h1>
          <p style={styles.email}>{user.email}</p>
          <span style={styles.roleBadge}>{user.role}</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={styles.tabRow}>
        <button
          style={{
            ...styles.tabBtn,
            ...(activeTab === 'info' ? styles.tabBtnActive : {})
          }}
          onClick={() => setActiveTab('info')}
        >
          My Info
        </button>
        <button
          style={{
            ...styles.tabBtn,
            ...(activeTab === 'connections' ? styles.tabBtnActive : {})
          }}
          onClick={() => setActiveTab('connections')}
        >
          {user.role === 'patient' ? 'My Caregivers' : 'My Patients'}
        </button>
      </div>

      {/* ── Tab Content ── */}
      {activeTab === 'info' && <ProfileInfo />}
      {activeTab === 'connections' && <ProfileCaregivers />}

    </div>
  );
}

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '2rem'
  },
  profileCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    backgroundColor: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#1976d2',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    fontWeight: 'bold',
    flexShrink: 0
  },
  profileInfo: {
    flex: 1
  },
  name: {
    color: '#333',
    margin: '0 0 0.25rem'
  },
  email: {
    color: '#666',
    margin: '0 0 0.5rem'
  },
  roleBadge: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: '500'
  },
  tabRow: {
    display: 'flex',
    borderBottom: '2px solid #e0e0e0',
    marginBottom: '1.5rem'
  },
  tabBtn: {
    padding: '0.75rem 1.5rem',
    border: 'none',
    background: 'none',
    fontSize: '1rem',
    cursor: 'pointer',
    color: '#666',
    borderBottom: '2px solid transparent',
    marginBottom: '-2px',
    fontFamily: 'inherit'
  },
  tabBtnActive: {
    color: '#1976d2',
    borderBottom: '2px solid #1976d2',
    fontWeight: '500'
  }
};

export default Profile;