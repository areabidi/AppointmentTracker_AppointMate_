// 1. Import our tools
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
// Import the database connection
const pool = require('./db');
// Import routes
const authRoutes = require('./routes/auth');
// Import appointments route
const appointmentRoutes = require('./routes/appointments');
const accessRoutes = require('./routes/access');
const driverRoutes = require('./routes/drivers');
const notesRoutes = require('./routes/notes');


// 2. Load our secret variables from the .env file
dotenv.config();

// 3. Create the Express app
const app = express();

// 4. Tell Express to accept JSON data from React
app.use(express.json());

// Use routes
app.use('/api/auth', authRoutes);
// Use appointments route
app.use('/api/appointments', appointmentRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/notes', notesRoutes);

// 5. Tell Express to allow React (running on a different port) to talk to it
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000'
}));

// 6. A simple test route to confirm the server is running
app.get('/', (req, res) => {
  res.json({ message: 'Appointment app backend is running!' });
});

// 7. Start listening for requests
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

/*** 
```

---

**What each section does in plain English:**

**Section 1 — imports** — We're grabbing the tools we installed earlier. Think of it like getting your equipment out before cooking.

**Section 2 — dotenv** — Your app has secrets like database passwords and API keys. We never write those directly in code. Instead they live in a `.env` file and `dotenv` loads them for us.

**Section 3 — create the app** — This one line creates your entire Express server. Everything else is just configuring it.

**Section 4 — express.json()** — When React sends data to your backend (like a new appointment), it sends it as JSON. This line tells Express to understand and read that format.

**Section 5 — CORS** — Your React app runs on `localhost:3000` and your backend runs on `localhost:5000`. By default browsers block requests between different ports for security. CORS lifts that block so they can talk to each other.

**Section 6 — test route** — This is just a sanity check. When you visit `localhost:5000` in your browser you should see the message. If you do, your server is alive.

**Section 7 — listen** — This starts the server and tells it which port to sit on and wait for requests.

---

*/