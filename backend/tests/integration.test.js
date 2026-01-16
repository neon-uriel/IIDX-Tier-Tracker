const request = require('supertest');

// Mock `passport` configuration so it doesn't try to set up serializeUser/deserializeUser
jest.mock('../src/config/passport'); // This prevents src/config/passport.js from executing its code

// Mock the passport module itself for middleware functions
jest.mock('passport', () => ({
  initialize: () => (req, res, next) => next(),
  session: () => (req, res, next) => {
    // Mock a logged-in user and isAuthenticated for ensureAuthenticated middleware
    req.user = { id: 1, googleId: '12345', displayName: 'Test User' };
    req.isAuthenticated = () => true;
    next();
  },
  authenticate: jest.fn((strategy, options, callback) => (req, res, next) => {
    // This authenticate is typically used in specific routes, not globally.
    // It will also set req.user, but session mock already handles it for our current needs.
    next();
  }),
  use: jest.fn(), // If any strategies are used
  // Add these mocks to avoid errors if something tries to access them,
  // although with config/passport mocked, they shouldn't be called directly.
  serializeUser: jest.fn(),
  deserializeUser: jest.fn(),
}));


const app = require('../src/app'); // Require app AFTER passport is mocked
const db = require('../src/db'); // Import your db module

jest.mock('../src/db', () => ({
  query: jest.fn(),
}));

describe('Backend Integration Test', () => {
  beforeEach(() => {
    db.query.mockReset(); // Reset the mock before each test
  });

  it('GET / responds with "Hello from IIDX Tier Tracker Backend!"', async () => {
    const response = await request(app).get('/'); // Use 'app' directly instead of API_URL
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('Hello from IIDX Tier Tracker Backend!');
  });

  it('GET /api/songs should return a list of songs', async () => {
    const mockSongs = [
      { id: 1, title: 'Song A', genre: 'Genre 1', artist: 'Artist 1', version: 28, level: 10, difficulty: 'SPA' },
      { id: 2, title: 'Song B', genre: 'Genre 2', artist: 'Artist 2', version: 28, level: 11, difficulty: 'SPH' },
    ];
    db.query.mockResolvedValueOnce({ rows: mockSongs });

    const response = await request(app).get('/api/songs');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(mockSongs);
    expect(db.query).toHaveBeenCalledWith('SELECT * FROM songs', []);
  });

  it('GET /api/songs?level=10 should return a filtered list of songs for level 10', async () => {
    const mockSongs = [
      { id: 1, title: 'Song A', genre: 'Genre 1', artist: 'Artist 1', version: 28, level: 10, difficulty: 'SPA' },
    ];
    db.query.mockResolvedValueOnce({ rows: mockSongs });

    const response = await request(app).get('/api/songs?level=10');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(mockSongs);
    expect(db.query).toHaveBeenCalledWith('SELECT * FROM songs WHERE level = $1', ['10']);
  });

  it('GET /api/lamps should return a list of user lamps for the logged-in user', async () => {
    const mockUserLamps = [
      { id: 1, userId: 1, songId: 1, lamp: 'EASY CLEAR' },
      { id: 2, userId: 1, songId: 2, lamp: 'CLEAR' },
    ];
    db.query.mockResolvedValueOnce({ rows: mockUserLamps });

    const response = await request(app).get('/api/lamps');
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(mockUserLamps);
    expect(db.query).toHaveBeenCalledWith('SELECT * FROM user_lamps WHERE user_id = $1', [1]);
  });

  it('PUT /api/lamps should update lamp information and log history', async () => {
    const userId = 1;
    const songId = 101;
    const newLamp = 'HARD CLEAR';
    const existingLamp = 'EASY CLEAR';

    // Mock existing user lamp (for upsert logic)
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, userId: userId, songId: songId, lamp: existingLamp }] }); // Check if lamp exists
    // Mock the update operation
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, userId: userId, songId: songId, lamp: newLamp }] }); // Update user_lamps
    // Mock the insert history operation
    db.query.mockResolvedValueOnce({}); // Insert into lamp_history

    const response = await request(app)
      .put('/api/lamps')
      .send({ songId, lamp: newLamp })
      .expect(200);

    expect(response.body).toEqual({ id: 1, userId: userId, songId: songId, lamp: newLamp });
    expect(db.query).toHaveBeenCalledWith(
      'SELECT id, lamp FROM user_lamps WHERE user_id = $1 AND song_id = $2',
      [userId, songId]
    );
    expect(db.query).toHaveBeenCalledWith(
      'UPDATE user_lamps SET lamp = $1, updated_at = NOW() WHERE user_id = $2 AND song_id = $3 RETURNING *',
      [newLamp, userId, songId]
    );
    expect(db.query).toHaveBeenCalledWith(
      'INSERT INTO lamp_history (user_lamp_id, lamp) VALUES ($1, $2)',
      [1, newLamp] // Assuming user_lamp_id is 1 from the update return
    );
  });

  it('GET /api/stats/history should return a list of lamp history entries for the logged-in user', async () => {
    const mockLampHistory = [
      { id: 1, userLampId: 1, lamp: 'NO PLAY', createdAt: '2026-01-01T00:00:00Z' },
      { id: 2, userLampId: 1, lamp: 'EASY CLEAR', createdAt: '2026-01-02T00:00:00Z' },
    ];
    db.query.mockResolvedValueOnce({ rows: mockLampHistory });

    const response = await request(app).get('/api/stats/history');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(mockLampHistory);
    // Assuming we need to join user_lamps and lamp_history
    expect(db.query).toHaveBeenCalledWith(
      'SELECT lh.* FROM lamp_history lh JOIN user_lamps ul ON lh.user_lamp_id = ul.id WHERE ul.user_id = $1 ORDER BY lh.created_at DESC',
      [1]
    );
  });

  it('GET /api/stats/summary should return clear status summary per level for the logged-in user', async () => {
    const mockSummaryData = [
      { level: 10, lamp: 'EASY CLEAR', count: '5' },
      { level: 10, lamp: 'HARD CLEAR', count: '3' },
      { level: 11, lamp: 'CLEAR', count: '10' },
    ];
    db.query.mockResolvedValueOnce({ rows: mockSummaryData });

    const expectedSummary = {
      10: { 'EASY CLEAR': 5, 'HARD CLEAR': 3 },
      11: { 'CLEAR': 10 },
    };

    const response = await request(app).get('/api/stats/summary');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(expectedSummary);
    expect(db.query).toHaveBeenCalledWith(
      `
      SELECT
        s.level,
        ul.lamp,
        COUNT(ul.lamp) AS count
      FROM
        user_lamps ul
      JOIN
        songs s ON ul.song_id = s.id
      WHERE
        ul.user_id = $1
      GROUP BY
        s.level, ul.lamp
      ORDER BY
        s.level, ul.lamp;
      `,
      [1]
    );
  });
});