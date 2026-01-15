const db = require('../db');

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

module.exports = { findOrCreateUser };
