const axios = require('axios');
const vm = require('vm'); // Import the vm module
const db = require('../db');
const iconv = require('iconv-lite'); // Import iconv-lite

// Maps for difficulty abbreviations used in `captbl` from scrlist.js
// and their corresponding level indices in the `actbl` arrays (based on get_level(tag, type, 1))
const difficultyMap = {
  'SPN': 5,  // Single Play Normal
  'SPH': 7,  // Single Play Hyper
  'SPA': 9,  // Single Play Another
  'SPL': 11, // Single Play Leggendaria
  'DPN': 15, // Double Play Normal
  'DPH': 17, // Double Play Hyper
  'DPA': 19, // Double Play Another
  'DPL': 21  // Double Play Leggendaria
};


async function scrapeTextage(targetLevel) {
  const titletblUrl = 'https://textage.cc/score/titletbl.js';
  const actblUrl = 'https://textage.cc/score/actbl.js';

  // Fetch data as arraybuffer and convert from Shift-JIS to UTF-8
  const [titletblResponse, actblResponse] = await Promise.all([
    axios.get(titletblUrl, { responseType: 'arraybuffer' }),
    axios.get(actblUrl, { responseType: 'arraybuffer' }),
  ]);

  const titletblContent = iconv.decode(Buffer.from(titletblResponse.data), 'Shift_JIS');
  const actblContent = iconv.decode(Buffer.from(actblResponse.data), 'Shift_JIS');

  // Create a VM context to evaluate the JavaScript files
  const sandbox = {
    titletbl: {},
    actbl: {},
    VERINDEX: 0,
    IDINDEX: 1,
    OPTINDEX: 2,
    GENREINDEX: 3,
    ARTISTINDEX: 4,
    TITLEINDEX: 5,
    SUBTITLEINDEX: 6,
    SS: 35, // This is defined in titletbl.js
    A: 10, B: 11, C: 12, D: 13, E: 14, F: 15 // Defined in actbl.js (A-F are hex values for levels)
  };
  vm.createContext(sandbox); // Contextify the sandbox.

  // Execute titletbl.js content
  vm.runInContext(titletblContent, sandbox, { filename: 'titletbl.js' });

  // Execute actbl.js content
  vm.runInContext(actblContent, sandbox, { filename: 'actbl.js' });

  const titletbl = sandbox.titletbl;
  const actbl = sandbox.actbl;

  const VERINDEX = sandbox.VERINDEX;
  const GENREINDEX = sandbox.GENREINDEX;
  const ARTISTINDEX = sandbox.ARTISTINDEX;
  const TITLEINDEX = sandbox.TITLEINDEX;
  const SUBTITLEINDEX = sandbox.SUBTITLEINDEX;

  // Use a Map to store unique songs based on title and difficulty
  const uniqueSongsToInsert = new Map();

  for (const songTag in titletbl) {
    if (titletbl.hasOwnProperty(songTag)) {
      const songData = titletbl[songTag];
      const chartData = actbl[songTag];

      if (!chartData) {
        continue;
      }

      const version = songData[VERINDEX];
      const genre = songData[GENREINDEX];
      const artist = songData[ARTISTINDEX];
      const title = songData[TITLEINDEX];
      const subtitle = songData[SUBTITLEINDEX] || '';
      const fullTitle = title + (subtitle ? ` ${subtitle}` : '');


      for (const difficultyName in difficultyMap) {
        if (difficultyMap.hasOwnProperty(difficultyName)) {
          const levelIndex = difficultyMap[difficultyName];
          let level = chartData[levelIndex];

          if (typeof level !== 'number' || isNaN(level) || level === 0) {
            continue;
          }

          if (level !== targetLevel) {
            continue;
          }

          const classification = version === 0 ? 'CS' : 'AC';

          const songKey = `${fullTitle}-${difficultyName}`;
          if (!uniqueSongsToInsert.has(songKey)) {
            uniqueSongsToInsert.set(songKey, {
              title: fullTitle,
              genre,
              artist,
              version,
              level,
              difficulty: difficultyName,
              classification,
            });
          }
        }
      }
    }
  }

  const songsToInsert = Array.from(uniqueSongsToInsert.values());

  if (songsToInsert.length > 0) {
    const existingSongsResult = await db.query('SELECT title, difficulty FROM songs');
    const existingSongs = new Set(existingSongsResult.rows.map(r => `${r.title}-${r.difficulty}`));

    for (const song of songsToInsert) {
      const songKey = `${song.title}-${song.difficulty}`;
      if (!existingSongs.has(songKey)) {
        await db.query(
          'INSERT INTO songs (title, genre, artist, version, level, difficulty, classification) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [song.title, song.genre, song.artist, song.version, song.level, song.difficulty, song.classification]
        );
      }
    }
  }
}

if (require.main === module) {
  const level = parseInt(process.argv[2]);
  if (!level) {
    console.error('Please provide a level to scrape, e.g., "10" for SP☆10');
    process.exit(1);
  }
  scrapeTextage(level).then(() => {
    console.log(`Scraping for level ${level} complete.`);
    process.exit(0);
  }).catch(error => {
    console.error(`Error scraping for level ${level}:`, error);
    process.exit(1);
  });
}

module.exports = { scrapeTextage };
