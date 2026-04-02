// =============================================
// src/App.js
// =============================================
// This is the main file of our React app
// It sets up all the pages and navigation
//
// Think of it like a table of contents
// It maps URLs to pages:
// /login        → Login page
// /signup       → Signup page
// /dashboard    → Dashboard page
// /appointments → Appointments page
// /profile      → Profile page
//
// It also protects certain pages so only
// logged in users can access them
// =============================================

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';

// =============================================
// PrivateRoute
// =============================================
// This protects pages that require login
// If user is not logged in redirect to /login
// If user is logged in show the page
//
// Think of it like the middleware we built
// on the backend but for the frontend
const PrivateRoute = ({ children }) => {
  // Check if token exists in localStorage
  const token = localStorage.getItem('token');

  // If no token redirect to login page
  if (!token) {
    return <Navigate to="/login" />;
  }

  // If token exists show the page
  return children;
};

function App() {
  return (
    // BrowserRouter enables navigation between pages
    <BrowserRouter>
      {/* Navbar shows on all pages */}
      <Navbar />

      {/* Routes defines all our pages */}
      <Routes>

        {/* Public routes — anyone can access */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Private routes — must be logged in */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />

        <Route path="/appointments" element={
          <PrivateRoute>
            <Appointments />
          </PrivateRoute>
        } />

        <Route path="/profile" element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        } />

        {/* Default route — redirect to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;