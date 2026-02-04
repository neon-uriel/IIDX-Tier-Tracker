const db = require('../db');

const getUserLamps = async (req, res) => {
  try {
    // req.user is populated by Passport middleware if a user is logged in
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized: User not logged in' });
    }

    const userId = req.user.id;
    const { rows } = await db.query('SELECT * FROM user_lamps WHERE user_id = $1', [userId]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching user lamps:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateUserLamp = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized: User not logged in' });
    }

    const userId = req.user.id;
    const { songId, lamp } = req.body;

    if (!songId || !lamp) {
      return res.status(400).json({ error: 'Missing songId or lamp in request body' });
    }

    // Use UPSERT (INSERT ... ON CONFLICT) for better performance and atomicity
    // This reduces 3 DB roundtrips to 1 (or 2 with history)
    const upsertQuery = `
      INSERT INTO user_lamps (user_id, song_id, lamp, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (user_id, song_id)
      DO UPDATE SET lamp = EXCLUDED.lamp, updated_at = NOW()
      RETURNING *;
    `;

    const { rows } = await db.query(upsertQuery, [userId, songId, lamp]);
    const updatedUserLamp = rows[0];

    // Always log to history for simplicity and tracking, or could optimize further.
    // In many IIDX trackers, every change is worth logging.
    await db.query(
      'INSERT INTO lamp_history (user_lamp_id, lamp) VALUES ($1, $2)',
      [updatedUserLamp.id, lamp]
    );

    res.json(updatedUserLamp);
  } catch (error) {
    console.error('Error updating user lamp:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getUserLamps,
  updateUserLamp,
};