const db = require('../db');

const getSongs = async (req, res) => {
  try {
    const { level, songName } = req.query;
    let query = 'SELECT * FROM songs';
    let params = [];
    const conditions = [];

    if (level) {
      conditions.push(`level = $${params.length + 1}`);
      params.push(level);
    }
    if (songName) {
      conditions.push(`title ILIKE $${params.length + 1}`); // ILIKE for case-insensitive search
      params.push(`%${songName}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching songs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getSongs,
};