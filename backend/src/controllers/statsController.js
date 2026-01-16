const db = require('../db');

const getLampHistory = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized: User not logged in' });
    }

    const userId = req.user.id;
    const { rows } = await db.query(
      'SELECT lh.* FROM lamp_history lh JOIN user_lamps ul ON lh.user_lamp_id = ul.id WHERE ul.user_id = $1 ORDER BY lh.created_at DESC',
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching lamp history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getClearStatusSummary = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized: User not logged in' });
    }

    const userId = req.user.id;
    const { rows } = await db.query(
      `
      SELECT
        s.level,
        ul.lamp,
        COUNT(ul.lamp) AS count
      FROM
        user_lamps ul
      JOIN
        songs s ON ul.song_id = s.id
      WHERE
        ul.user_id = $1
      GROUP BY
        s.level, ul.lamp
      ORDER BY
        s.level, ul.lamp;
      `,
      [userId]
    );

    // Format the results into a nested object: { level: { lamp: count } }
    const summary = {};
    rows.forEach(row => {
      const { level, lamp, count } = row;
      if (!summary[level]) {
        summary[level] = {};
      }
      summary[level][lamp] = parseInt(count, 10);
    });

    res.json(summary);
  } catch (error) {
    console.error('Error fetching clear status summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


module.exports = {
  getLampHistory,
  getClearStatusSummary,
};