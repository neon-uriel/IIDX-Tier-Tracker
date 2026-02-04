const db = require('../db');

/**
 * Get list of admin email addresses from environment variable
 * @returns {string[]} Array of admin email addresses (lowercase)
 */
function getAdminEmails() {
  const adminEmails = process.env.ADMIN_EMAILS;
  if (!adminEmails) {
    return [];
  }
  return adminEmails
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(email => email.length > 0);
}

/**
 * Check if a user is an administrator
 * @param {Object} user - User object with email property
 * @returns {boolean} True if user is an admin
 */
function isAdmin(user) {
  if (!user || !user.email) {
    return false;
  }
  const adminEmails = getAdminEmails();
  return adminEmails.includes(user.email.toLowerCase());
}

async function findOrCreateUser(profile) {
  const { id, displayName, emails } = profile;
  const email = emails[0].value;

  try {
    // Check if user exists
    let { rows } = await db.query('SELECT * FROM users WHERE google_id = $1', [id]);
    if (rows.length > 0) {
      return rows[0];
    }

    // Create new user if they don't exist
    ({ rows } = await db.query(
      'INSERT INTO users (google_id, display_name, email) VALUES ($1, $2, $3) RETURNING *',
      [id, displayName, email]
    ));
    return rows[0];
  } catch (err) {
    console.error('Error in findOrCreateUser:', err);
    throw err;
  }
}

module.exports = { findOrCreateUser, isAdmin, getAdminEmails };
