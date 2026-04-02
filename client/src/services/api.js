// =============================================
// src/services/api.js
// =============================================
// This file sets up the connection between
// React and our Express backend
//
// Instead of writing the full URL every time:
// axios.get('http://localhost:5000/api/appointments')
//
// We set it up once here and just write:
// api.get('/appointments')
//
// This also automatically attaches the JWT token
// to every request so we don't have to do it manually
// =============================================

import axios from 'axios';

// The base URL of our backend
// In development this is localhost:5000
// In production this will be our Render URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create an axios instance with the base URL
const api = axios.create({
  baseURL: API_URL,
});

// =============================================
// Request Interceptor
// =============================================
// This runs before EVERY request we make
// It automatically attaches the JWT token
// to the Authorization header
//
// Without this we would have to manually add
// the token to every single API call
// With this it happens automatically
api.interceptors.request.use(
  (config) => {
    // Get the token from localStorage
    // This is where we store it after login
    const token = localStorage.getItem('token');

    // If token exists add it to the header
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =============================================
// Response Interceptor
// =============================================
// This runs after EVERY response we receive
// If the backend sends back a 401 (unauthorized)
// it means the token expired
// We automatically log the user out
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      // Clear localStorage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;