const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();

// Passport config
require('./config/passport');

const authRoutes = require('./routes/auth');
const songRoutes = require('./routes/songRoutes'); // Import songRoutes
const userLampRoutes = require('./routes/userLampRoutes'); // Import userLampRoutes

const app = express();

app.use(cors({
  origin: 'http://localhost:5173', // Allow the frontend origin
  credentials: true, // Allow cookies to be sent
}));
app.use(express.json());

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
  res.send('Hello from IIDX Tier Tracker Backend!');
});

// Routes
app.use('/auth', authRoutes);
app.use('/api', authRoutes); // for /api/current_user
app.use('/api', songRoutes); // Use songRoutes for /api/songs
app.use('/api', userLampRoutes); // Use userLampRoutes for /api/lamps

module.exports = app;
