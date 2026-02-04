const request = require('supertest');

// Mock passport configuration
jest.mock('../src/config/passport');

// Store original env
const originalEnv = process.env;

// We need to set up mocks before requiring the app
let mockIsAdmin = true;

jest.mock('passport', () => ({
    initialize: () => (req, res, next) => next(),
    session: () => (req, res, next) => {
        req.user = { id: 1, email: 'admin@example.com', displayName: 'Admin User' };
        req.isAuthenticated = () => true;
        next();
    },
    authenticate: jest.fn((strategy, options, callback) => (req, res, next) => next()),
    use: jest.fn(),
    serializeUser: jest.fn(),
    deserializeUser: jest.fn(),
}));

// Mock authService to control admin status
jest.mock('../src/services/authService', () => ({
    findOrCreateUser: jest.fn(),
    getAdminEmails: jest.fn(() => ['admin@example.com']),
    isAdmin: jest.fn((user) => {
        if (!user || !user.email) return false;
        return user.email === 'admin@example.com';
    }),
}));

const app = require('../src/app');
const db = require('../src/db');

jest.mock('../src/db', () => ({
    query: jest.fn(),
}));

describe('Admin Routes', () => {
    beforeEach(() => {
        db.query.mockReset();
        jest.resetModules();
    });

    describe('PUT /api/songs/:id/sub_level', () => {
        it('should update sub_level when called by admin', async () => {
            const songId = 1;
            const newSubLevel = '10.5';
            const updatedSong = {
                id: songId,
                title: 'Test Song',
                level: 10,
                difficulty: 'SPA',
                sub_level: newSubLevel
            };

            db.query.mockResolvedValueOnce({ rows: [updatedSong], rowCount: 1 });

            const response = await request(app)
                .put(`/api/songs/${songId}/sub_level`)
                .send({ sub_level: newSubLevel });

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual(updatedSong);
            expect(db.query).toHaveBeenCalledWith(
                'UPDATE songs SET sub_level = $1 WHERE id = $2 RETURNING *',
                [newSubLevel, String(songId)]
            );
        });

        it('should allow setting sub_level to null (unclassified)', async () => {
            const songId = 1;
            const updatedSong = {
                id: songId,
                title: 'Test Song',
                level: 10,
                difficulty: 'SPA',
                sub_level: null
            };

            db.query.mockResolvedValueOnce({ rows: [updatedSong], rowCount: 1 });

            const response = await request(app)
                .put(`/api/songs/${songId}/sub_level`)
                .send({ sub_level: null });

            expect(response.statusCode).toBe(200);
            expect(response.body.sub_level).toBeNull();
        });

        it('should return 404 when song is not found', async () => {
            const songId = 999;

            db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

            const response = await request(app)
                .put(`/api/songs/${songId}/sub_level`)
                .send({ sub_level: '10.5' });

            expect(response.statusCode).toBe(404);
            expect(response.body.error).toBe('Song not found');
        });

        it('should return 400 when sub_level is not provided', async () => {
            const songId = 1;

            const response = await request(app)
                .put(`/api/songs/${songId}/sub_level`)
                .send({});

            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe('sub_level is required');
        });
    });
});

describe('Admin Routes - Non-Admin User', () => {
    beforeAll(() => {
        // Reset modules to apply new mocks
        jest.resetModules();
    });

    it('should return 403 when non-admin tries to update sub_level', async () => {
        // Create a new mock for non-admin user
        jest.doMock('../src/services/authService', () => ({
            findOrCreateUser: jest.fn(),
            getAdminEmails: jest.fn(() => ['admin@example.com']),
            isAdmin: jest.fn(() => false), // Always return false for this test
        }));

        jest.doMock('passport', () => ({
            initialize: () => (req, res, next) => next(),
            session: () => (req, res, next) => {
                req.user = { id: 2, email: 'user@example.com', displayName: 'Regular User' };
                req.isAuthenticated = () => true;
                next();
            },
            authenticate: jest.fn((strategy, options, callback) => (req, res, next) => next()),
            use: jest.fn(),
            serializeUser: jest.fn(),
            deserializeUser: jest.fn(),
        }));

        // Need to clear the module cache for app to pick up new mocks
        jest.resetModules();
        const appWithNonAdmin = require('../src/app');

        const response = await request(appWithNonAdmin)
            .put('/api/songs/1/sub_level')
            .send({ sub_level: '10.5' });

        expect(response.statusCode).toBe(403);
        expect(response.body.error).toBe('Admin access required');
    });
});
