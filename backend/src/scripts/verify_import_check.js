
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function check() {
    const client = await pool.connect();

    // Check 'Based Drop' or similar
    // The log said: MISS: [地力S] ベィスドロップ・フリークス(L)
    // Maybe verify what is in DB for that.

    const targets = [
        'ベィスドロップ・フリークス',
        'Explorer feat. ぷにぷに電機',
        'ZERO-ONE',
        'Acid Pumper',
        '雫'
    ];

    for (const t of targets) {
        console.log(`Checking: ${t}`);
        const res = await client.query('SELECT id, title, sub_level FROM songs WHERE title LIKE $1', [`%${t}%`]);
        res.rows.forEach(r => {
            console.log(`  Found: [${r.id}] ${r.title} | Sub: ${r.sub_level}`);
        });
    }

    client.release();
    await pool.end();
}

check();
