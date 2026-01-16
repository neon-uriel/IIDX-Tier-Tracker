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

    // Check if the user_lamp already exists
    const existingLampResult = await db.query(
      'SELECT id, lamp FROM user_lamps WHERE user_id = $1 AND song_id = $2',
      [userId, songId]
    );

    let updatedUserLamp;
    if (existingLampResult.rows.length > 0) {
      // Update existing lamp
      const { id: userLampId, lamp: oldLamp } = existingLampResult.rows[0];
      const updateResult = await db.query(
        'UPDATE user_lamps SET lamp = $1, updated_at = NOW() WHERE user_id = $2 AND song_id = $3 RETURNING *',
        [lamp, userId, songId]
      );
      updatedUserLamp = updateResult.rows[0];

      // Log to history only if the lamp actually changed
      if (oldLamp !== lamp) {
        await db.query(
          'INSERT INTO lamp_history (user_lamp_id, lamp) VALUES ($1, $2)',
          [userLampId, lamp]
        );
      }
    } else {
      // Insert new lamp
      const insertResult = await db.query(
        'INSERT INTO user_lamps (user_id, song_id, lamp, updated_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
        [userId, songId, lamp]
      );
      updatedUserLamp = insertResult.rows[0];

      // Log to history for new entry
      await db.query(
        'INSERT INTO lamp_history (user_lamp_id, lamp) VALUES ($1, $2)',
        [updatedUserLamp.id, lamp]
      );
    }

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