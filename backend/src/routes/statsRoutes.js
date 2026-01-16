const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const passport = require('passport'); // Import passport

// Middleware to ensure user is authenticated
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized: Not authenticated' });
};

router.get('/stats/history', ensureAuthenticated, statsController.getLampHistory);
router.get('/stats/summary', ensureAuthenticated, statsController.getClearStatusSummary);

module.exports = router;
