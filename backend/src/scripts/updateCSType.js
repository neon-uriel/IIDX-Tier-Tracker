const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

function decodeHtmlEntities(str) {
    if (!str) return '';
    return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&hearts;/g, '♥')
        .replace(/&sup2;/g, '²')
        .replace(/&eacute;/g, 'é');
}

function normalizeTitle(title) {
    if (!title) return '';
    let result = decodeHtmlEntities(title);
    result = result.replace(/\(.*\)/g, ''); // Remove parens for broad matching
    result = result.replace(/\[.*\]/g, '');
    result = result.replace(/[！-～]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
    result = result.replace(/\s+/g, '').toLowerCase();
    return result;
}

async function run() {
    console.log("Updating CS songs in database...");

    try {
        const mdPath = path.join(__dirname, '../../cs_songs.md');
        if (!fs.existsSync(mdPath)) {
            throw new Error("cs_songs.md not found!");
        }

        const content = fs.readFileSync(mdPath, 'utf8');
        const lines = content.split('\n');

        // Extract songs from Markdown table
        // | Title | Artist | Genre | ID |
        const songs = [];
        for (const line of lines) {
            if (!line.startsWith('|') || line.includes('Title') || line.includes('---')) continue;
            const parts = line.split('|').map(p => p.trim());
            if (parts.length < 5) continue; // empty, title, artist, genre, id, empty

            const title = parts[1];
            const artist = parts[2];

            if (title && title.length > 0) {
                songs.push({ title, artist });
            }
        }

        console.log(`Found ${songs.length} entries in cs_songs.md`);

        const client = await pool.connect();

        // Fetch all songs to match against
        const { rows: dbSongs } = await client.query("SELECT id, title, artist, classification FROM songs");

        let updateCount = 0;
        let skippedCount = 0;
        let notFoundCount = 0;

        for (const target of songs) {
            const normTargetTitle = normalizeTitle(target.title);

            // Find matches in DB
            // 1. Exact title match (normalized)
            let matches = dbSongs.filter(s => normalizeTitle(s.title) === normTargetTitle);

            // 2. If no match, try contains
            if (matches.length === 0) {
                matches = dbSongs.filter(s => normalizeTitle(s.title).includes(normTargetTitle));
            }

            if (matches.length === 0) {
                // console.log(`Not found: ${target.title}`);
                notFoundCount++;
                continue;
            }

            for (const match of matches) {
                if (match.classification !== 'CS') {
                    await client.query("UPDATE songs SET classification = 'CS', version = 0 WHERE id = $1", [match.id]);
                    updateCount++;
                    // console.log(`Updated: ${match.title} -> CS`);
                } else {
                    skippedCount++;
                }
            }
        }

        console.log(`Update Summary:`);
        console.log(`- Updated to CS: ${updateCount}`);
        console.log(`- Already CS: ${skippedCount}`);
        console.log(`- Not Found in DB: ${notFoundCount}`);

        client.release();

    } catch (error) {
        console.error("Update failed:", error);
    } finally {
        await pool.end();
    }
}

run();
