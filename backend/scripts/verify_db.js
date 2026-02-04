
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../src/db');

async function run() {
    const res = await db.query("SELECT title, sub_level FROM songs WHERE level = 11 AND sub_level IS NOT NULL ORDER BY title LIMIT 20");
    res.rows.forEach(r => {
        console.log(`${r.title}: ${r.sub_level}`);
    });
    process.exit(0);
}
run();
