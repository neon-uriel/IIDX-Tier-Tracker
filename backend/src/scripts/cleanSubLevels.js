const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    console.log("Cleaning up sub_level spacing in database...");

    try {
        // Fetch all songs with a sub_level
        const { rows } = await pool.query("SELECT id, sub_level FROM songs WHERE sub_level IS NOT NULL");
        console.log(`Found ${rows.length} songs with sub_level.`);

        let updateCount = 0;

        for (const row of rows) {
            if (!row.sub_level) continue;

            // Remove spaces after '.' and between kanji/symbols if any
            // Example: "11.地力 S+" -> "11.地力S+"
            // We'll just remove ALL spaces from the label part (everything after the first '.')
            const parts = row.sub_level.split('.');
            if (parts.length < 2) continue;

            const level = parts[0];
            const label = parts.slice(1).join('.').replace(/\s+/g, '').trim();
            const newSubLevel = `${level}.${label}`;

            if (newSubLevel !== row.sub_level) {
                await pool.query("UPDATE songs SET sub_level = $1 WHERE id = $2", [newSubLevel, row.id]);
                updateCount++;
            }
        }

        console.log(`Successfully updated ${updateCount} records.`);

    } catch (error) {
        console.error("Cleanup failed:", error);
    } finally {
        await pool.end();
    }
}

run();
