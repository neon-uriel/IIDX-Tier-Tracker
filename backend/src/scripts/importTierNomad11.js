const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

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
    'ﾗ': 'ラ', 'リ': 'リ', 'ﾙ': 'ル', 'ﾚ': 'レ', 'ﾛ': 'ロ',
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

function decodeHtmlEntities(str) {
    if (!str) return '';
    return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&iexcl;/g, '¡')
        .replace(/&cent;/g, '¢')
        .replace(/&pound;/g, '£')
        .replace(/&curren;/g, '¤')
        .replace(/&yen;/g, '¥')
        .replace(/&brvbar;/g, '¦')
        .replace(/&sect;/g, '§')
        .replace(/&uml;/g, '¨')
        .replace(/&copy;/g, '©')
        .replace(/&ordf;/g, 'ª')
        .replace(/&laquo;/g, '«')
        .replace(/&not;/g, '¬')
        .replace(/&shy;/g, '')
        .replace(/&reg;/g, '®')
        .replace(/&macr;/g, '¯')
        .replace(/&deg;/g, '°')
        .replace(/&plusmn;/g, '±')
        .replace(/&sup2;/g, '²')
        .replace(/&sup3;/g, '³')
        .replace(/&acute;/g, '´')
        .replace(/&micro;/g, 'µ')
        .replace(/&para;/g, '¶')
        .replace(/&middot;/g, '·')
        .replace(/&cedil;/g, '¸')
        .replace(/&sup1;/g, '¹')
        .replace(/&ordm;/g, 'º')
        .replace(/&raquo;/g, '»')
        .replace(/&frac14;/g, '¼')
        .replace(/&frac12;/g, '½')
        .replace(/&frac34;/g, '¾')
        .replace(/&iquest;/g, '¿')
        .replace(/&times;/g, '×')
        .replace(/&divide;/g, '÷')
        .replace(/&aelig;/g, 'æ')
        .replace(/&oslash;/g, 'ø')
        .replace(/&Oslash;/g, 'Ø')
        .replace(/&Uuml;/g, 'Ü');
}

function normalizeTitle(title, ignoreParens = false) {
    if (!title) return '';
    let result = decodeHtmlEntities(title);

    if (ignoreParens) {
        // Remove everything inside parenthesis
        result = result.replace(/\(.*\)/g, '');
    } else {
        // Only remove specific difficulty suffixes in parenthesis
        result = result.replace(/\((L|HCN|A|H)\)$/i, '');
    }

    // Standardize symbols
    result = result.replace(/[～〜〜]/g, '～');
    result = result.replace(/[－ー—]/g, 'ー');
    result = result.replace(/[“”]/g, '"');
    result = result.replace(/[‘’]/g, "'");

    // Replace special font characters used in titles like POLKAMANIA or CODE:0
    const fontMap = {
        '&#xA4D8;': 'K', // For POLKAMANIA K
        '&#x3000;': ' ', // Full-width space entity
        'И': 'N', 'А': 'A', 'М': 'M', 'Φ': 'O', 'Σ': 'S',
        'Χ': 'X', 'Ü': 'U', 'ü': 'u',
        'Ｂ': 'B', 'Ｅ': 'E'
    };

    // Some titles use very specific Unicode characters for fonts.
    // Let's add common mappings found in DB.
    result = result.replace(/&#xA4D8;/g, 'K');
    result = result.replace(/И/g, 'N');
    result = result.replace(/А/g, 'A');
    result = result.replace(/М/g, 'M');
    result = result.replace(/Φ/g, 'O');
    result = result.replace(/Χ/g, 'X');
    result = result.replace(/&#x3000;/g, ' ');
    result = result.replace(/Ø/g, '0'); // Fix for CODE:0 <-> CODE:Ø
    result = result.replace(/&Oslash;/g, '0');

    // Convert full-width alphanumeric to half-width
    result = result.replace(/[！-～]/g, (s) => {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });

    // Space normalization
    result = result.replace(/　/g, ' ');
    result = result.replace(/\s+/g, ' ');

    // Accented characters
    result = result.replace(/[øØ]/g, 'o');
    result = result.replace(/[äÄ]/g, 'a');
    result = result.replace(/[öÖ]/g, 'o');
    result = result.replace(/[üÜ]/g, 'u');
    result = result.replace(/[æÆ]/g, 'ae');

    // Katakana conversion
    for (const [h, f] of Object.entries(combinedH2F)) {
        result = result.split(h).join(f);
    }
    for (const [h, f] of Object.entries(h2fMap)) {
        result = result.split(h).join(f);
    }

    // Common abbreviations
    result = result.replace(/リミ/g, 'リミックス');

    return result.trim().toLowerCase();
}

function ultraNormalize(title) {
    if (!title) return '';
    return normalizeTitle(title)
        .replace(/[^a-z0-9ぁ-んァ-ヶ亜-熙]/gi, '') // Remove everything except alphanumeric and Japanese characters
        .toLowerCase();
}

// Mapping Rules provided by User
const tierMapping = {
    0: '未定',
    1: '地力S+',
    2: '個人差S+',
    3: '地力S',
    4: '個人差S',
    7: '地力A',
    8: '個人差A',
    11: '地力B',
    12: '個人差B',
    13: '地力C',
    14: '個人差C',
    15: '地力D',
    16: '個人差D',
    21: '地力E'
};

function getSubLevelName(tier) {
    const label = tierMapping[tier];
    if (!label) return null;
    return `11.${label}`;
}

async function run() {
    const nomadUrl = 'https://iidx-difficulty-table-checker.nomadblacky.dev/table/11_normal';
    console.log(`Fetching Nomad Table data from ${nomadUrl}...`);

    try {
        const response = await axios.get(nomadUrl);
        const html = response.data;

        // Extract JSON from __NEXT_DATA__ script tag
        const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
        if (!match) {
            throw new Error('Could not find __NEXT_DATA__ in the HTML.');
        }

        const jsonData = JSON.parse(match[1]);
        const tables = jsonData.props.pageProps.tables.tables;
        const targetTable = tables.find(t => t.id === '11_normal');

        if (!targetTable) {
            throw new Error('Table with id "11_normal" not found.');
        }

        const songData = targetTable.table.data;
        console.log(`Found ${songData.length} songs in JSON.`);

        // Fetch Level 11 songs from DB
        const { rows: dbSongs } = await pool.query(
            "SELECT id, title, difficulty FROM songs WHERE level = 11"
        );
        console.log(`Fetched ${dbSongs.length} songs from DB.`);

        // Build DB Maps for matching
        const dbMap = new Map(); // normalized -> id
        const ultraMap = new Map(); // ultra -> id

        dbSongs.forEach(s => {
            // DB titles often contain HTML like <font color="...">Title</font>
            const cleanDbTitle = s.title.replace(/<[^>]*>?/gm, '').trim();
            const norm = normalizeTitle(cleanDbTitle);
            const normNoParens = normalizeTitle(cleanDbTitle, true);
            const ultra = ultraNormalize(cleanDbTitle);

            const key = `${norm}-${s.difficulty}`;
            dbMap.set(key, s.id);

            // Also map without parens for fallback
            const keyNoParens = `${normNoParens}-${s.difficulty}`;
            if (!dbMap.has(keyNoParens)) {
                dbMap.set(keyNoParens, s.id);
            }

            // For ultra match, we might have collisions, but it's a fallback
            if (!ultraMap.has(ultra)) ultraMap.set(ultra, []);
            ultraMap.get(ultra).push({ id: s.id, diff: s.difficulty });
        });

        let successCount = 0;
        let missCount = 0;
        const misses = [];

        for (const nomadSong of songData) {
            const name = nomadSong.name;
            const tier = nomadSong.tier;
            const subLevel = getSubLevelName(tier);

            if (!subLevel) continue;

            // Nomad Table often has (A) or (H) at the end of the name which DB doesn't have in the title column.
            const cleanNomadName = name.replace(/\([A-Z]\)$/, '').trim();
            const normName = normalizeTitle(cleanNomadName);
            const normNameNoParens = normalizeTitle(cleanNomadName, true);
            const ultraName = ultraNormalize(cleanNomadName);

            // Difficulty mapping from debug: 2=SPH, 3=SPA, 4=SPA?, 5=SPL
            const jsonDiffMap = { 2: 'SPH', 3: 'SPA', 4: 'SPA', 5: 'SPL' };
            const diffKey = jsonDiffMap[nomadSong.difficulty];

            let songId = null;

            // 1. Precise match (Title + Difficulty)
            if (diffKey) {
                songId = dbMap.get(`${normName}-${diffKey}`) || dbMap.get(`${normNameNoParens}-${diffKey}`);
            }

            // 2. Fallback to common diffs
            if (!songId) {
                songId = dbMap.get(`${normName}-SPA`) ||
                    dbMap.get(`${normNameNoParens}-SPA`) ||
                    dbMap.get(`${normName}-SPL`) ||
                    dbMap.get(`${normName}-SPH`);
            }

            // 3. Fallback to ultra normalize match
            if (!songId) {
                const ultraBasename = ultraNormalize(cleanNomadName.replace(/\(.*\)/g, ''));
                const candidates = ultraMap.get(ultraName) || ultraMap.get(ultraBasename);
                if (candidates && candidates.length > 0) {
                    const matchingDiff = diffKey ? candidates.find(c => c.diff === diffKey) : null;
                    const preferred = matchingDiff || candidates.find(c => c.diff === 'SPA') || candidates[0];
                    songId = preferred.id;
                }
            }

            if (songId) {
                await pool.query('UPDATE songs SET sub_level = $1 WHERE id = $2', [subLevel, songId]);
                successCount++;
            } else {
                missCount++;
                misses.push(`${name} (tier: ${tier}, diff_code: ${nomadSong.difficulty}, norm: ${normName})`);
            }
        }

        console.log(`\nImport Summary:`);
        console.log(`- Success: ${successCount}`);
        console.log(`- Missed: ${missCount}`);

        if (misses.length > 0) {
            fs.writeFileSync('import_nomad11_misses.log', misses.join('\n'));
            console.log(`Check import_nomad11_misses.log for details.`);
        }

    } catch (error) {
        console.error('Import failed:', error.message);
    } finally {
        await pool.end();
    }
}

run();
