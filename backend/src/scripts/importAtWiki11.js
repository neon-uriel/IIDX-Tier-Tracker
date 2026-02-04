const fs = require('fs');
const cheerio = require('cheerio');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const filePath = '/home/kacho/src/github.com/neon-uriel/IIDX-Tier-Tracker/backend/view-source_https___w.atwiki.jp_bemani2sp11_pages_22.html';
const logPath = '/home/kacho/src/github.com/neon-uriel/IIDX-Tier-Tracker/backend/import_atwiki_11.log';
const TARGET_LEVEL = 11;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

/**
 * Simple HTML entity decoder
 */
function decodeHtmlEntities(text) {
    if (!text) return '';
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&iexcl;/g, '¡')
        .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
        .replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
}

// Helper to normalize song names
function normalizeTitle(title) {
    if (!title) return '';
    let result = title;

    // Standardize wave dashes and dashes
    result = result.replace(/[～〜〜]/g, '~');
    result = result.replace(/[－ー—−-]/g, '-');

    // Standardize spaces
    result = result.replace(/\s+/g, ' ');

    // Convert full-width alphanumeric to half-width
    result = result.replace(/[！-～]/g, (s) => {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });

    // Handle special characters with accents/marks
    const accentMap = {
        'ø': 'o', 'Ø': 'O',
        'ä': 'a', 'Ä': 'A',
        'ö': 'o', 'Ö': 'O',
        'ü': 'u', 'Ü': 'U',
        'é': 'e', 'É': 'E',
        'æ': 'ae', 'Æ': 'AE',
        'ō': 'o', 'Ō': 'O',
        'á': 'a', 'à': 'a', 'â': 'a',
        'í': 'i', 'ì': 'i', 'î': 'i',
        'ó': 'o', 'ò': 'o', 'ô': 'o',
        'ú': 'u', 'ù': 'u', 'û': 'u'
    };
    for (const [accent, plain] of Object.entries(accentMap)) {
        result = result.split(accent).join(plain);
    }

    // Special Greek/Symbol replacements
    const symbolMap = {
        'Ξ': 'XI', 'Θ': 'THETA', 'Σ': 'SIGMA', 'Φ': 'PHI', 'Ω': 'OMEGA', 'α': 'alpha', 'β': 'beta',
        '≡': '=', '†': '', '♡': '', '☆': '', '★': ''
    };
    for (const [sym, rep] of Object.entries(symbolMap)) {
        result = result.split(sym).join(rep);
    }

    return result.trim().toLowerCase();
}

/**
 * Strips all non-alphanumeric characters for a "brute force" match fallback
 */
function ultraNormalize(title) {
    if (!title) return '';
    let norm = normalizeTitle(title);
    return norm.replace(/[^\w\d\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, '');
}

// Helper to format labels "地力S" -> "11.地力 S"
function formatLabel(label) {
    if (!label) return `${TARGET_LEVEL}.未定`;
    if (label === '未定') return `${TARGET_LEVEL}.未定`;

    // Add space between prefix and rank if missing (e.g. "地力S" -> "地力 S")
    const match = label.match(/^([^A-Za-z0-9]+)([A-Za-z0-9\+\-]+)$/);
    if (match) {
        return `${TARGET_LEVEL}.${match[1]} ${match[2]}`;
    }
    return `${TARGET_LEVEL}.${label}`;
}

async function main() {
    console.log(`Starting Level ${TARGET_LEVEL} Import (Enhanced Matching)...`);
    console.log(`Reading file: ${filePath}`);

    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');

        // Parse view-source to get real HTML
        const $view = cheerio.load(fileContent);
        let rawHtml = "";
        $view('td.line-content').each((i, el) => {
            rawHtml += $view(el).text() + "\n";
        });

        console.log(`Reconstructed HTML size: ${rawHtml.length} chars`);
        const $ = cheerio.load(rawHtml);

        const updates = [];

        // Find all H4 headers and their corresponding tables
        $('h4').each((i, h4El) => {
            const headerText = $(h4El).text().trim();

            // Extract sub-level from header (e.g., "地力S+ (14曲)")
            const match = headerText.match(/^(.+?)\s*\(/);
            if (!match) return;

            const subLevelLabel = match[1].replace(/\s+/g, '').trim();
            if (subLevelLabel.includes('難易度表について') || subLevelLabel.includes('更新履歴')) return;

            // Find the next table after this h4
            let nextElement = $(h4El).next();
            while (nextElement.length > 0 && nextElement[0].name !== 'table' && nextElement[0].name !== 'h4' && nextElement[0].name !== 'h2' && nextElement[0].name !== 'h3') {
                nextElement = nextElement.next();
            }

            if (nextElement.length === 0 || nextElement[0].name !== 'table') return;

            // Process all rows in this table
            nextElement.find('tbody tr').each((j, tr) => {
                const tds = $(tr).find('td');
                if (tds.length < 2) return;

                // Column 1 is the song name
                const nameCell = $(tds[1]);
                let name = nameCell.text().trim();

                // Remove line breaks and extra whitespace (CRITICAL for multi-line titles)
                name = name.replace(/\s+/g, ' ').trim();

                if (!name || name === '曲名') return;

                updates.push({ name, label: subLevelLabel });
            });
        });

        console.log(`Found ${updates.length} songs in Wiki.`);

        const client = await pool.connect();

        try {
            // Get all Level 11 songs from DB for efficient matching
            const { rows: dbSongs } = await client.query(`SELECT id, title FROM songs WHERE level = ${TARGET_LEVEL}`);
            const normMap = new Map();
            const ultraMap = new Map();
            const ultraList = [];

            dbSongs.forEach(s => {
                const title = s.title.replace(/\s+/g, ' ').trim();
                const norm = normalizeTitle(title);
                const ultra = ultraNormalize(title);

                normMap.set(norm, s.id);
                if (!ultraMap.has(ultra)) ultraMap.set(ultra, s.id);
                ultraList.push({ id: s.id, ultra, title: s.title });
            });

            console.log(`Clearing existing Level ${TARGET_LEVEL} sub_levels...`);
            await client.query(`UPDATE songs SET sub_level = NULL WHERE level = ${TARGET_LEVEL}`);

            const logStream = fs.createWriteStream(logPath, { flags: 'w' });
            let updatedCount = 0;
            let missedCount = 0;

            for (const item of updates) {
                const formattedLabel = formatLabel(item.label);
                const normName = normalizeTitle(item.name);
                const ultraName = ultraNormalize(item.name);

                let id = normMap.get(normName) || ultraMap.get(ultraName);

                // Fallback 1: Substring Match
                if (!id) {
                    const found = ultraList.find(dbS =>
                        dbS.ultra.startsWith(ultraName) || ultraName.startsWith(dbS.ultra)
                    );
                    if (found) id = found.id;
                }

                if (id) {
                    await client.query('UPDATE songs SET sub_level = $1 WHERE id = $2', [formattedLabel, id]);
                    updatedCount++;
                } else {
                    missedCount++;
                    logStream.write(`MISS: [${formattedLabel}] ${item.name} (Norm: ${normName}, Ultra: ${ultraName})\n`);
                }
            }

            logStream.end();
            console.log(`Import completed. Updated: ${updatedCount}, Missed: ${missedCount}`);
            console.log(`Logs available at ${logPath}`);

        } catch (err) {
            console.error('Error during import DB operations:', err);
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Error reading/parsing file:', err);
    } finally {
        await pool.end();
    }
}

main();
