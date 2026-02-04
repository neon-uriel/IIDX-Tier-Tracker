const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../db');

// Katakana conversion map (half-width to full-width)
const h2fMap = {
    'ｱ': 'ア', 'ｲ': 'イ', 'ｳ': 'ウ', 'ｴ': 'エ', 'ｵ': 'オ',
    'ｶ': 'カ', 'ｷ': 'キ', 'ｸ': 'ク', 'ｹ': 'ケ', 'ｺ': 'コ',
    'ｻ': 'サ', 'ｼ': 'シ', 'ｽ': 'ス', 'ｾ': 'セ', 'ｿ': 'ソ',
    'ﾀ': 'タ', 'ﾁ': 'チ', 'ﾂ': 'ツ', 'ﾃ': 'テ', 'ﾄ': 'ト',
    'ﾅ': 'ナ', 'ﾆ': 'ニ', 'ﾇ': 'ヌ', 'ﾈ': 'ネ', 'ﾉ': 'ノ',
    'ﾊ': 'ハ', 'ﾋ': 'ヒ', 'ﾌ': 'フ', 'ﾍ': 'ヘ', 'ﾎ': 'ホ',
    'ﾏ': 'マ', 'ﾐ': 'ミ', 'ﾑ': 'ム', 'ﾒ': 'メ', 'ﾓ': 'モ',
    'ﾔ': 'ヤ', 'ﾕ': 'ユ', 'ﾖ': 'ヨ',
    'ﾗ': 'ラ', 'ﾘ': 'リ', 'ﾙ': 'ル', 'ﾚ': 'レ', 'ﾛ': 'ロ',
    'ﾜ': 'ワ', 'ｦ': 'ヲ', 'ﾝ': 'ン',
    'ｧ': 'ァ', 'ｨ': 'ィ', 'ｩ': 'ゥ', 'ｪ': 'ェ', 'ｫ': 'ォ',
    'ｯ': 'ッ', 'ｬ': 'ャ', 'ｭ': 'ュ', 'ｮ': 'ョ',
    '｡': '。', '､': '、', 'ｰ': 'ー', '｢': '「', '｣': '」', '･': '・'
};
const combinedH2F = {
    'ｶﾞ': 'ガ', 'ｷﾞ': 'ギ', 'ｸﾞ': 'グ', 'ｹﾞ': 'ゲ', 'ｺﾞ': 'ゴ',
    'ｻﾞ': 'ザ', 'ｼﾞ': 'ジ', 'ｽﾞ': 'ズ', 'ｾﾞ': 'ゼ', 'ｿﾞ': 'ゾ',
    'ﾀﾞ': 'ダ', 'ﾁﾞ': 'ヂ', 'ﾂﾞ': 'ヅ', 'ﾃﾞ': 'デ', 'ﾄﾞ': 'ド',
    'ﾊﾞ': 'バ', 'ﾋﾞ': 'ビ', 'ﾌﾞ': 'ブ', 'ﾍﾞ': 'ベ', 'ﾎﾞ': 'ボ',
    'ﾊﾟ': 'パ', 'ﾋﾟ': 'ピ', 'ﾌﾟ': 'プ', 'ﾍﾟ': 'ペ', 'ﾎﾟ': 'ポ',
    'ｳﾞ': 'ヴ'
};

function normalizeTitle(title) {
    if (!title) return '';
    let result = title;

    // Convert half-width Katakana to full-width first
    for (const [h, f] of Object.entries(combinedH2F)) {
        result = result.split(h).join(f);
    }
    for (const [h, f] of Object.entries(h2fMap)) {
        result = result.split(h).join(f);
    }

    // Standardize wave dashes and dashes to a single format
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
        'ø': 'o', 'Ø': 'O', 'ø': 'o',
        'ä': 'a', 'Ä': 'A',
        'ö': 'o', 'Ö': 'O',
        'ü': 'u', 'Ü': 'U',
        'é': 'e', 'É': 'E',
        'æ': 'ae', 'Æ': 'AE',
        'ō': 'o', 'Ō': 'O',
        'é': 'e', 'è': 'e', 'ê': 'e',
        'á': 'a', 'à': 'a', 'â': 'a',
        'í': 'i', 'ì': 'i', 'î': 'i',
        'ó': 'o', 'ò': 'o', 'ô': 'o',
        'ú': 'u', 'ù': 'u', 'û': 'u',
        '¡': 'i', '¿': '?'
    };
    for (const [accent, plain] of Object.entries(accentMap)) {
        result = result.split(accent).join(plain);
    }

    // Special replacements for common tier list typos or variations
    result = result.toUpperCase();

    // Normalize Remix notation
    result = result.replace(/REMIX/g, 'リミックス');

    // Handle specific abbreviations
    // Replace "リミ" only if it's NOT part of "リミックス"
    // Since we don't have good word boundaries, we check if it's followed by "ックス"
    if (result.includes('リミ') && !result.includes('リミックス')) {
        result = result.split('リミ').join('リミックス');
    }

    const specialReplacements = {
        'ALTNATOR': 'ALTNATHOR',
        'REBULD': 'REBUILD',
        'ENC RYPITON': 'ENCRYPTION',
        'ENCRYPITON': 'ENCRYPTION',
        'GANYMADE': 'GANYMEDE',
        'PARTCLE': 'PARTICLE',
        'VALUT OF HEAVN': 'VAULT OF HEAVEN'
    };

    for (const [key, val] of Object.entries(specialReplacements)) {
        if (result.includes(key)) {
            result = result.split(key).join(val);
        }
    }

    return result.trim().toLowerCase();
}

/**
 * Strips all non-alphanumeric characters for a "brute force" match fallback
 */
function ultraNormalize(title) {
    if (!title) return '';
    // First apply base normalization
    let norm = normalizeTitle(title);
    // Remove all symbols including † and other special marks
    return norm.replace(/[^\w\d\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, '');
}

/**
 * Simple HTML entity decoder for common entities found in song titles
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

function stripHtml(html) {
    if (!html) return '';
    // Decode entities FIRST
    const decoded = decodeHtmlEntities(html);
    // Strip HTML tags then apply normalization
    const stripped = decoded.replace(/<[^>]*>?/gm, '');
    return normalizeTitle(stripped);
}

async function run() {
    const csvPath = path.join(__dirname, '../../../iidx_7-10 - ☆１０.csv');
    const logPath = path.join(__dirname, '../../import_misses.log');

    console.log('Reading CSV:', csvPath);
    const content = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(content, {
        skip_empty_lines: true,
        relax_column_count: true
    });

    // Tiers are in columns: 3 (Tier 10), 5 (Tier 9), ..., 23 (Tier 0)
    // CSV Header row is index 3 (難度10...)
    // Data rows start from index 4
    const dataRows = records.slice(4);

    // Fetch all Level 10 SP songs from DB for comparison
    const { rows: dbSongs } = await db.query(
        "SELECT id, title, difficulty FROM songs WHERE level = 10 AND difficulty LIKE 'SP%'"
    );

    const normMap = new Map(); // normalized -> id
    const ultraMap = new Map(); // ultra-normalized -> id
    const ultraList = []; // Array for fuzzy/prefix fallback

    // Debug list for known misses
    dbSongs.forEach(s => {
        const cleanTitle = stripHtml(s.title);
        const normKey = `${cleanTitle}-${s.difficulty}`;
        const uTitle = ultraNormalize(cleanTitle);
        const ultraKey = `${uTitle}-${s.difficulty}`;

        normMap.set(normKey, s.id);
        if (!ultraMap.has(ultraKey)) {
            ultraMap.set(ultraKey, s.id);
        }
        ultraList.push({ id: s.id, uTitle, difficulty: s.difficulty, title: s.title });
    });

    const updates = [];
    const misses = [];

    for (const row of dataRows) {
        for (let tierIdx = 0; tierIdx <= 10; tierIdx++) {
            const colIdx = 3 + ((10 - tierIdx) * 2);
            const rawTitle = row[colIdx];

            if (!rawTitle || rawTitle.includes('地力') || rawTitle.includes('個人差') || rawTitle.includes('予定')) {
                continue;
            }

            // Remove Japanese comments like ※...
            let cleanRawTitle = rawTitle.replace(/※.*$/, '').trim();

            const normalizedTitle = normalizeTitle(cleanRawTitle);

            // Determine difficulty and actual title
            let difficulty = 'SPA';
            let matchTitle = normalizedTitle;

            if (normalizedTitle.endsWith('(h)')) {
                difficulty = 'SPH';
                matchTitle = normalizedTitle.slice(0, -3).trim();
            } else if (normalizedTitle.endsWith('(l)')) {
                difficulty = 'SPL';
                matchTitle = normalizedTitle.slice(0, -3).trim();
            } else if (normalizedTitle.endsWith('(a)')) {
                difficulty = 'SPA';
                matchTitle = normalizedTitle.slice(0, -3).trim();
            }

            // SubLevel calculated: 10.9-10.0
            const folderId = Math.max(0, tierIdx - 1);
            const subLevel = `10.${folderId}`;

            const normKey = `${matchTitle}-${difficulty}`;
            const uMatchTitle = ultraNormalize(matchTitle);

            let songId = normMap.get(normKey);
            let matchMethod = 'norm';

            if (!songId) {
                songId = ultraMap.get(`${uMatchTitle}-${difficulty}`);
                matchMethod = 'ultra';

                // One more try: if it's SPA and not found, try without difficulty suffix in ultra
                if (!songId && difficulty === 'SPA') {
                    songId = ultraMap.get(`${uMatchTitle}-SPA`);
                }
            }

            // Fallback 1: Prefix/Substring Match
            if (!songId) {
                const found = ultraList.find(dbS => {
                    if (dbS.difficulty !== difficulty) return false;
                    // Search: DB "Bloody Tears (IIDX EDITION)" vs CSV "Bloody Tears"
                    // Or: DB "CROSSROAD" vs CSV "CROSS ROAD ~Left Story~"
                    return dbS.uTitle.startsWith(uMatchTitle) || uMatchTitle.startsWith(dbS.uTitle);
                });
                if (found) {
                    songId = found.id;
                    matchMethod = 'fuzzy';
                }
            }

            if (songId) {
                updates.push({ id: songId, subLevel, title: rawTitle, method: matchMethod });
            } else {
                misses.push({
                    title: rawTitle,
                    normalized: matchTitle,
                    ultra: uMatchTitle,
                    difficulty,
                    tier: tierIdx
                });
            }
        }
    }

    console.log(`Found ${updates.length} matches. Updating...`);

    for (const update of updates) {
        await db.query('UPDATE songs SET sub_level = $1 WHERE id = $2', [update.subLevel, update.id]);
    }

    console.log('Update complete.');

    if (misses.length > 0) {
        const missLog = misses.map(m => `[${m.difficulty}] Tier ${m.tier}: ${m.title} (Norm: ${m.normalized}, Ultra: ${m.ultra}) -- Candidates: ${m.candidates}`).join('\n');
        fs.writeFileSync(logPath, missLog);
        console.log(`Logged ${misses.length} misses to ${logPath}`);
    } else {
        if (fs.existsSync(logPath)) fs.unlinkSync(logPath);
        console.log('No misses found!');
    }

    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
