const db = require('../db');

const getSongs = async (req, res) => {
  try {
    const { level } = req.query;
    let query = 'SELECT * FROM songs';
    let params = [];

    if (level) {
      query += ' WHERE level = $1';
      params.push(level);
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
