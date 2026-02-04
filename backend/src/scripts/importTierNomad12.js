const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

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
        .replace(/&eacute;/g, 'é')
        .replace(/&hearts;/g, '♥')
        .replace(/&#332;/g, 'O')
        .replace(/&Oslash;/g, '0')
        .replace(/&Uuml;/g, 'Ü');
}

function normalizeTitle(title, ignoreParens = false) {
    if (!title) return '';
    let result = decodeHtmlEntities(title);

    // Remove text like <br> from DB titles
    result = result.replace(/<br\s*\/?>/gi, ' ');

    if (ignoreParens) {
        result = result.replace(/\(.*\)/g, '');
    } else {
        result = result.replace(/\((L|HCN|A|H)\)$/i, '');
    }

    result = result.replace(/[～〜〜]/g, '～');
    result = result.replace(/[－ー—]/g, 'ー');
    result = result.replace(/[“”]/g, '"');
    result = result.replace(/[‘’]/g, "'");
    result = result.replace(/[！？]/g, (s) => s === '！' ? '!' : '?');

    result = result.replace(/&#xA4D8;/g, 'K');
    result = result.replace(/И/g, 'N');
    result = result.replace(/А/g, 'A');
    result = result.replace(/М/g, 'M');
    result = result.replace(/Φ/g, 'O');
    result = result.replace(/Χ/g, 'X');
    result = result.replace(/&#x3000;/g, ' ');
    result = result.replace(/[Øø]/g, '0');
    result = result.replace(/&Oslash;/g, '0');
    result = result.replace(/&#332;/g, 'O');
    result = result.replace(/Ō/g, 'O');

    result = result.replace(/[！-～]/g, (s) => {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });

    result = result.replace(/　/g, ' ');
    result = result.replace(/\s+/g, ' ');

    result = result.replace(/[øØ]/g, 'o');
    result = result.replace(/[äÄ]/g, 'a');
    result = result.replace(/[öÖ]/g, 'o');
    result = result.replace(/[üÜ]/g, 'u');
    result = result.replace(/[æÆ]/g, 'ae');
    result = result.replace(/[éÉ]/g, 'e');

    for (const [h, f] of Object.entries(combinedH2F)) {
        result = result.split(h).join(f);
    }
    for (const [h, f] of Object.entries(h2fMap)) {
        result = result.split(h).join(f);
    }

    result = result.replace(/リミ/g, 'リミックス');

    return result.trim().toLowerCase();
}

function ultraNormalize(title) {
    if (!title) return '';
    return normalizeTitle(title)
        .replace(/[^a-z0-9ぁ-んァ-ヶ亜-熙]/gi, '')
        .toLowerCase();
}

// Tier Mapping for ★12 (Corrected by User)
const tierMapping = {
    0: '未定',
    1: '地力S+',
    2: '個人差S+',
    3: '地力S',
    4: '個人差S',
    5: '地力A+',
    6: '個人差A+',
    7: '地力A',
    8: '個人差A',
    9: '地力B+',
    10: '個人差B+',
    11: '地力B',
    12: '個人差B',
    13: '地力C',
    14: '個人差C',
    15: '地力D',
    16: '個人差D',
    17: '地力E',
    18: '個人差E',
    19: '地力F',
    20: '地力F',
    21: '個人差F'
};

function getSubLevelName(tier) {
    const label = tierMapping[tier];
    if (!label) return null;
    return `12.${label}`;
}

async function run() {
    const nomadUrl = 'https://iidx-difficulty-table-checker.nomadblacky.dev/table/11_normal';
    console.log(`Fetching Nomad Table data for ★12...`);

    try {
        const response = await axios.get(nomadUrl);
        const html = response.data;
        const jsonStartMarker = '<script id="__NEXT_DATA__" type="application/json">';
        const scriptStart = html.indexOf(jsonStartMarker);
        if (scriptStart === -1) throw new Error('Could not find __NEXT_DATA__');

        const jsonStart = html.indexOf('{', scriptStart);
        const jsonEnd = html.indexOf('</script>', jsonStart);
        const jsonData = JSON.parse(html.substring(jsonStart, jsonEnd));

        const tables = jsonData.props.pageProps.tables.tables;
        const targetTable = tables.find(t => t.id === '12_normal');

        if (!targetTable) throw new Error('Table with id "12_normal" not found.');

        const songData = targetTable.table.data;
        console.log(`Found ${songData.length} songs in JSON.`);

        const { rows: dbSongs } = await pool.query(
            "SELECT id, title, difficulty FROM songs WHERE level = 12"
        );
        console.log(`Fetched ${dbSongs.length} songs from DB.`);

        const dbMap = new Map();
        const ultraMap = new Map();

        dbSongs.forEach(s => {
            const cleanDbTitle = s.title.replace(/<[^>]*>?/gm, '').trim();
            const norm = normalizeTitle(cleanDbTitle);
            const normNoParens = normalizeTitle(cleanDbTitle, true);
            const ultra = ultraNormalize(cleanDbTitle);

            dbMap.set(`${norm}-${s.difficulty}`, s.id);
            if (!dbMap.has(`${normNoParens}-${s.difficulty}`)) {
                dbMap.set(`${normNoParens}-${s.difficulty}`, s.id);
            }

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

            const cleanNomadName = name.replace(/\([A-Z]\)$/, '').trim();
            const normName = normalizeTitle(cleanNomadName);
            const normNameNoParens = normalizeTitle(cleanNomadName, true);
            const ultraName = ultraNormalize(cleanNomadName);

            const jsonDiffMap = { 2: 'SPH', 3: 'SPA', 4: 'SPA', 5: 'SPL' };
            const diffKey = jsonDiffMap[nomadSong.difficulty];

            let songId = null;

            if (diffKey) {
                songId = dbMap.get(`${normName}-${diffKey}`) || dbMap.get(`${normNameNoParens}-${diffKey}`);
            }

            if (!songId) {
                songId = dbMap.get(`${normName}-SPA`) ||
                    dbMap.get(`${normNameNoParens}-SPA`) ||
                    dbMap.get(`${normName}-SPL`) ||
                    dbMap.get(`${normName}-SPH`);
            }

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
                misses.push(`${name} (tier: ${tier}, diff_code: ${nomadSong.difficulty})`);
            }
        }

        console.log(`\nImport Summary (★12):`);
        console.log(`- Success: ${successCount}`);
        console.log(`- Missed: ${missCount}`);

        if (misses.length > 0) {
            fs.writeFileSync('import_nomad12_misses.log', misses.join('\n'));
            console.log(`Check import_nomad12_misses.log for details.`);
        }

    } catch (error) {
        console.error('Import failed:', error.message);
    } finally {
        await pool.end();
    }
}

run();
