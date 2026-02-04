const db = require('../db');

/**
 * Get songs with optional filtering
 */
const getSongs = async (req, res) => {
  try {
    const { level, songName, playMode, subLevel, classification } = req.query; // Added classification
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
    // Add condition for playMode
    if (playMode) {
      if (playMode === 'SP') {
        conditions.push(`difficulty LIKE 'SP%'`);
      } else if (playMode === 'DP') {
        conditions.push(`difficulty LIKE 'DP%'`);
      }
    }
    // Add condition for subLevel
    if (subLevel) {
      if (subLevel === 'null') {
        conditions.push(`sub_level IS NULL`);
      } else {
        conditions.push(`sub_level = $${params.length + 1}`);
        params.push(subLevel);
      }
    }
    // Add condition for classification
    if (classification) {
      conditions.push(`classification = $${params.length + 1}`);
      params.push(classification);
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

/**
 * Update sub_level for a song (admin only)
 */
const updateSubLevel = async (req, res) => {
  try {
    const { id } = req.params;
    const { sub_level } = req.body;

    // Check if sub_level was provided in the request body
    if (sub_level === undefined) {
      return res.status(400).json({ error: 'sub_level is required' });
    }

    const { rows, rowCount } = await db.query(
      'UPDATE songs SET sub_level = $1 WHERE id = $2 RETURNING *',
      [sub_level, id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Song not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating sub_level:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update classification for a song (admin only)
 */
const updateClassification = async (req, res) => {
  try {
    const { id } = req.params;
    const { classification } = req.body;

    if (!classification) {
      return res.status(400).json({ error: 'classification is required' });
    }

    const { rows, rowCount } = await db.query(
      'UPDATE songs SET classification = $1 WHERE id = $2 RETURNING *',
      [classification, id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Song not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating classification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getSongs,
  updateSubLevel,
  updateClassification,
};
