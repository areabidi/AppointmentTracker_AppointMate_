// =============================================
// middleware/authMiddleware.js
// =============================================
// This file protects routes that require
// the user to be logged in.
//
// It checks every request for a valid JWT token
// before allowing access to the route.
//
// Think of it like a security guard at the door
// of every protected room in the hospital.
// You must show your wristband (JWT token)
// before you can enter.
// =============================================

const jwt = require('jsonwebtoken');

// =============================================
// verifyToken middleware
// =============================================
// This function runs BEFORE the route handler
// It checks if the request has a valid JWT token
// If yes → allows the request through
// If no  → sends back "not authorized"
const verifyToken = (req, res, next) => {

  // Step 1 — Get the token from the request headers
  // React sends the token in the Authorization header
  // It looks like this:
  // Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  const authHeader = req.headers['authorization'];

  // Step 2 — Check if the header exists
  if (!authHeader) {
    return res.status(401).json({ 
      error: 'Access denied. No token provided.' 
    });
  }

  // Step 3 — Extract the token from the header
  // The header looks like "Bearer tokengoeshere"
  // We split by space and take the second part
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      error: 'Access denied. Invalid token format.' 
    });
  }

  // Step 4 — Verify the token is valid
  // jwt.verify checks if the token was signed
  // with our JWT_SECRET and has not expired
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Step 5 — Attach the user info to the request
    // This makes the user's id and role available
    // in every protected route via req.user
    req.user = decoded;

    // Step 6 — Call next() to allow the request through
    // Without this the request would be stuck here forever
    next();

  } catch (error) {
    return res.status(401).json({ 
      error: 'Access denied. Token is invalid or expired.' 
    });
  }
};

// =============================================
// verifyPatient middleware
// =============================================
// This checks if the logged in user is a patient
// Used on routes that only patients can access
const verifyPatient = (req, res, next) => {
  if (req.user.role !== 'patient') {
    return res.status(403).json({ 
      error: 'Access denied. Patients only.' 
    });
  }
  next();
};

// =============================================
// verifyCaregiver middleware
// =============================================
// This checks if the logged in user is a caregiver
// Used on routes that only caregivers can access
const verifyCaregiver = (req, res, next) => {
  if (req.user.role !== 'caregiver') {
    return res.status(403).json({ 
      error: 'Access denied. Caregivers only.' 
    });
  }
  next();
};

module.exports = { verifyToken, verifyPatient, verifyCaregiver };
/**What this file gives us:**
```
verifyToken      → checks if user is logged in
                   used on ALL protected routes

verifyPatient    → checks if user is a patient
                   used on patient only routes

verifyCaregiver  → checks if user is a caregiver
                   used on caregiver only routes*/