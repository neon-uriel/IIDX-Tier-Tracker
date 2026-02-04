const fs = require('fs');
const path = require('path');
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

    // Standardize wave dashes and dashes
    result = result.replace(/[～〜〜]/g, '～');
    result = result.replace(/[－ー—]/g, 'ー');

    // Standardize spaces
    result = result.replace(/\s+/g, ' ');

    // Handle combined characters (voiced marks etc)
    for (const [h, f] of Object.entries(combinedH2F)) {
        result = result.split(h).join(f);
    }
    // Handle individual characters
    for (const [h, f] of Object.entries(h2fMap)) {
        result = result.split(h).join(f);
    }

    // Convert full-width alphanumeric to half-width
    result = result.replace(/[！-～]/g, (s) => {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });

    // Special replacements for common tier list typos or variations
    const specialReplacements = {
        'ALTNATOR': 'ALTNATHOR',
        'リミ': 'リミックス'
    };

    for (const [key, val] of Object.entries(specialReplacements)) {
        if (result.includes(key)) {
            result = result.split(key).join(val);
        }
    }

    return result.trim().toLowerCase();
}

function stripHtml(html) {
    if (!html) return '';
    const stripped = html.replace(/<[^>]*>?/gm, '');
    return normalizeTitle(stripped);
}

// Mapping based on 11_hard (Nomadblacky Hard Tier)
// 0: S+
// 1, 2, 3: S
// 4, 7: A+
// 8, 11: A
// 12, 13: B+
// 14, 15: B
// 16: C
// 17, 19, 21: F
const tierMapping = {
    0: 'S+',
    1: 'S', 2: 'S', 3: 'S',
    4: 'A+', 7: 'A+',
    8: 'A', 11: 'A',
    12: 'B+', 13: 'B+',
    14: 'B', 15: 'B',
    16: 'C',
    17: 'F', 19: 'F', 21: 'F'
};

function getSubLevelLabel(cat, tier) {
    // Determine category type
    // 地力 (Intellect): NOTES, CHORD, PEAK, CHARGE
    // 個人差 (Individual): SCRATCH, SOF-LAN
    const isIntellect = ['NOTES', 'CHORD', 'PEAK', 'CHARGE'].includes(cat);
    const catLabel = isIntellect ? '地力' : '個人差';

    // Get Tier Label
    const label = tierMapping[tier] || '?';

    // Format: "11.地力 S+"
    return `11.${catLabel} ${label}`;
}

async function run() {
    const rawDataPath = 'url_content_raw.html';
    const logPath = path.join(__dirname, '../../import_misses_11_sp.log');

    if (!fs.existsSync(rawDataPath)) {
        console.error('url_content_raw.html not found. Run the fetch command first.');
        process.exit(1);
    }

    const content = fs.readFileSync(rawDataPath, 'utf-8');
    const match = content.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (!match) {
        console.error('JSON data not found in HTML.');
        process.exit(1);
    }

    const data = JSON.parse(match[1]);
    const tbl = data.props.pageProps.tables.tables.find(t => t.id === '11_hard');
    if (!tbl) {
        console.error('11_hard table not found.');
        process.exit(1);
    }

    const songData = tbl.table.data;

    // Fetch Level 11 SP songs from DB
    const { rows: dbSongs } = await db.query(
        "SELECT id, title, difficulty FROM songs WHERE level = 11 AND difficulty LIKE 'SP%'"
    );

    const dbMap = new Map();
    dbSongs.forEach(s => {
        const cleanTitle = stripHtml(s.title);
        const key = `${cleanTitle}-${s.difficulty}`;
        dbMap.set(key, s.id);
    });

    const updates = [];
    const misses = [];

    for (const song of songData) {
        const normalizedTitle = normalizeTitle(song.name);

        // Difficulty from song.difficulty: 3=H, 4=A. Default to A if not specified clearly.
        const jsonDiffMap = { 3: 'SPH', 4: 'SPA', 5: 'SPL' };
        const diffKey = jsonDiffMap[song.difficulty] || 'SPA';

        const subLevel = getSubLevelLabel(song.category, song.tier);

        // Try exact match first
        let songId = dbMap.get(`${normalizedTitle}-${diffKey}`);

        // If not found, try common LV11 SP difficulties
        if (!songId) {
            songId = dbMap.get(`${normalizedTitle}-SPA`) ||
                dbMap.get(`${normalizedTitle}-SPH`) ||
                dbMap.get(`${normalizedTitle}-SPL`);
        }

        if (songId) {
            updates.push({ id: songId, subLevel, title: song.name });
        } else {
            misses.push({ name: song.name, tier: song.tier, category: song.category, diff: diffKey });
        }
    }

    console.log(`Found ${updates.length} matches. Updating...`);

    for (const update of updates) {
        await db.query('UPDATE songs SET sub_level = $1 WHERE id = $2', [update.subLevel, update.id]);
    }

    console.log('Update complete.');

    if (misses.length > 0) {
        const missLog = misses.map(m => `[${m.diff}] Category ${m.category} Tier ${m.tier}: ${m.name}`).join('\n');
        fs.writeFileSync(logPath, missLog);
        console.log(`Logged ${misses.length} misses to ${logPath}`);
    }

    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
