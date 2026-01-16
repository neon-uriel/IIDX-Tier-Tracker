const express = require('express');
const router = express.Router();
const userLampController = require('../controllers/userLampController');
const passport = require('passport'); // Import passport

// Middleware to ensure user is authenticated
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized: Not authenticated' });
};

router.get('/lamps', ensureAuthenticated, userLampController.getUserLamps);
router.put('/lamps', ensureAuthenticated, userLampController.updateUserLamp);

module.exports = router;
