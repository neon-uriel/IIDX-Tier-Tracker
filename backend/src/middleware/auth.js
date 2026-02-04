const { isAdmin } = require('../services/authService');

/**
 * Middleware to ensure user is authenticated
 */
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
}

/**
 * Middleware to ensure user is an admin
 * Must be used after passport authentication middleware
 */
function requireAdmin(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!isAdmin(req.user)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
}

module.exports = { ensureAuthenticated, requireAdmin };
