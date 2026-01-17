const axios = require('axios');
const { scrapeTextage } = require('../src/services/dataImportService'); // parseJsObject is no longer exported
const db = require('../src/db');
const iconv = require('iconv-lite'); // Import iconv-lite

jest.mock('axios');
jest.mock('../src/db', () => ({
  query: jest.fn(),
}));

describe('DataImportService', () => {
  beforeEach(() => {
    axios.get.mockReset();
    // Reset db.query mock and add console.log for debugging
    db.query.mockReset();
    db.query.mockImplementation((query, params) => {
      if (query.startsWith('SELECT')) {
        return Promise.resolve({ rows: [] }); // Default for SELECTs unless overridden
      }
      return Promise.resolve({}); // Default for INSERTs unless overridden
    });
  });

  // Removed parseJsObject tests as it's no longer exported and logic changed

  it('should fetch and parse song data from titletbl.js and actbl.js correctly and insert into db', async () => {
    const level = 10;
    const mockTitletbl = `
      VERINDEX=0;
      IDINDEX=1;
      OPTINDEX=2;
      GENREINDEX=3;
      ARTISTINDEX=4;
      TITLEINDEX=5;
      SUBTITLEINDEX=6;
      SS=35;
      titletbl={
        'song_a':[20, 1000, 1, "GENRE_A", "ARTIST_A", "TITLE_A", ""],
        'song_b':[20, 1001, 1, "GENRE_B", "ARTIST_B", "TITLE_B", ""],
        'song_c':[20, 1002, 1, "GENRE_C", "ARTIST_C", "TITLE_C", ""],
      };
    `;
    const mockActbl = `
      A=10, B=11, C=12, D=13, E=14, F=15;
      actbl={
        'song_a':[0,0,0,0,0,0,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // SPA level 10
        'song_b':[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // No level 10 songs
        'song_c':[0,0,0,0,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // SPH level 10
      };
    `;

    axios.get.mockImplementation((url, config) => {
      if (url.includes('titletbl.js')) {
        return Promise.resolve({ data: iconv.encode(mockTitletbl, 'Shift_JIS') });
      }
      if (url.includes('actbl.js')) {
        return Promise.resolve({ data: iconv.encode(mockActbl, 'Shift_JIS') });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
    await scrapeTextage(level);

    expect(axios.get).toHaveBeenCalledWith('https://textage.cc/score/titletbl.js', { responseType: 'arraybuffer' });
    expect(axios.get).toHaveBeenCalledWith('https://textage.cc/score/actbl.js', { responseType: 'arraybuffer' });
    expect(axios.get).toHaveBeenCalledTimes(2);

    expect(db.query).toHaveBeenCalledTimes(3); // 1 for select, 2 for insert (song_a SPA and song_c SPH)

    // Check insert queries
    expect(db.query.mock.calls[1][0]).toContain('INSERT INTO songs');
    expect(db.query.mock.calls[1][1]).toEqual(['TITLE_A', 'GENRE_A', 'ARTIST_A', 20, 10, 'SPA']);

    expect(db.query.mock.calls[2][0]).toContain('INSERT INTO songs');
    expect(db.query.mock.calls[2][1]).toEqual(['TITLE_C', 'GENRE_C', 'ARTIST_C', 20, 10, 'SPH']);
  });

  it('should not insert duplicate songs', async () => {
    const level = 10;
    const mockTitletbl = `
      VERINDEX=0;
      IDINDEX=1;
      OPTINDEX=2;
      GENREINDEX=3;
      ARTISTINDEX=4;
      TITLEINDEX=5;
      SUBTITLEINDEX=6;
      SS=35;
      titletbl={
        'song_a':[20, 1000, 1, "GENRE_A", "ARTIST_A", "TITLE_A", ""],
      };
    `;
    const mockActbl = `
      A=10, B=11, C=12, D=13, E=14, F=15;
      actbl={
        'song_a':[0,0,0,0,0,0,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // SPA level 10
      };
    `;

    axios.get.mockImplementation((url) => {
      if (url.includes('titletbl.js')) {
        return Promise.resolve({ data: mockTitletbl });
      }
      if (url.includes('actbl.js')) {
        return Promise.resolve({ data: mockActbl });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    db.query.mockImplementation((query, params) => {
      if (query.startsWith('SELECT')) {
        return Promise.resolve({ rows: [{ title: 'TITLE_A', difficulty: 'SPA' }] }); // Song already exists
      }
      return Promise.resolve({});
    });

    await scrapeTextage(level);

    expect(db.query).toHaveBeenCalledTimes(1); // Only for SELECT, no INSERT
    expect(db.query.mock.calls[0][0]).toContain('SELECT title, difficulty FROM songs');
  });
});