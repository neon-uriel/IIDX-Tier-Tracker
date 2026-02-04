const { findOrCreateUser, isAdmin, getAdminEmails } = require('../src/services/authService');
const db = require('../src/db');

// Mock the db module
jest.mock('../src/db');

describe('Auth Service', () => {
    const profile = {
        id: '12345',
        displayName: 'Test User',
        emails: [{ value: 'test@example.com' }]
    };

    beforeEach(() => {
        // Clear all instances and calls to constructor and all methods:
        db.query.mockClear();
    });

    it('should find an existing user', async () => {
        const existingUser = { id: 1, google_id: '12345', display_name: 'Test User', email: 'test@example.com' };
        db.query.mockResolvedValueOnce({ rows: [existingUser] });

        const user = await findOrCreateUser(profile);

        expect(db.query).toHaveBeenCalledWith('SELECT * FROM users WHERE google_id = $1', [profile.id]);
        expect(user).toEqual(existingUser);
    });

    it('should create a new user if one does not exist', async () => {
        const newUser = { id: 2, google_id: '12345', display_name: 'Test User', email: 'test@example.com' };
        // First query finds no user
        db.query.mockResolvedValueOnce({ rows: [] });
        // Second query creates and returns the new user
        db.query.mockResolvedValueOnce({ rows: [newUser] });

        const user = await findOrCreateUser(profile);

        expect(db.query).toHaveBeenCalledWith('SELECT * FROM users WHERE google_id = $1', [profile.id]);
        expect(db.query).toHaveBeenCalledWith(
            'INSERT INTO users (google_id, display_name, email) VALUES ($1, $2, $3) RETURNING *',
            [profile.id, profile.displayName, profile.emails[0].value]
        );
        expect(user).toEqual(newUser);
    });

    it('should throw an error if db.query fails', async () => {
        const error = new Error('Database error');
        db.query.mockRejectedValue(error); // Mock db.query to throw an error

        await expect(findOrCreateUser(profile)).rejects.toThrow('Database error');
    });
});

describe('Admin Identification', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    describe('getAdminEmails', () => {
        it('should return empty array when ADMIN_EMAILS is not set', () => {
            delete process.env.ADMIN_EMAILS;
            const { getAdminEmails } = require('../src/services/authService');
            expect(getAdminEmails()).toEqual([]);
        });

        it('should return empty array when ADMIN_EMAILS is empty string', () => {
            process.env.ADMIN_EMAILS = '';
            const { getAdminEmails } = require('../src/services/authService');
            expect(getAdminEmails()).toEqual([]);
        });

        it('should parse single email from ADMIN_EMAILS', () => {
            process.env.ADMIN_EMAILS = 'admin@example.com';
            const { getAdminEmails } = require('../src/services/authService');
            expect(getAdminEmails()).toEqual(['admin@example.com']);
        });

        it('should parse multiple comma-separated emails from ADMIN_EMAILS', () => {
            process.env.ADMIN_EMAILS = 'admin1@example.com,admin2@example.com,admin3@example.com';
            const { getAdminEmails } = require('../src/services/authService');
            expect(getAdminEmails()).toEqual(['admin1@example.com', 'admin2@example.com', 'admin3@example.com']);
        });

        it('should trim whitespace from emails', () => {
            process.env.ADMIN_EMAILS = ' admin1@example.com , admin2@example.com ';
            const { getAdminEmails } = require('../src/services/authService');
            expect(getAdminEmails()).toEqual(['admin1@example.com', 'admin2@example.com']);
        });

        it('should filter out empty entries', () => {
            process.env.ADMIN_EMAILS = 'admin@example.com,,another@example.com,';
            const { getAdminEmails } = require('../src/services/authService');
            expect(getAdminEmails()).toEqual(['admin@example.com', 'another@example.com']);
        });
    });

    describe('isAdmin', () => {
        it('should return false when user is null', () => {
            process.env.ADMIN_EMAILS = 'admin@example.com';
            const { isAdmin } = require('../src/services/authService');
            expect(isAdmin(null)).toBe(false);
        });

        it('should return false when user is undefined', () => {
            process.env.ADMIN_EMAILS = 'admin@example.com';
            const { isAdmin } = require('../src/services/authService');
            expect(isAdmin(undefined)).toBe(false);
        });

        it('should return false when user has no email', () => {
            process.env.ADMIN_EMAILS = 'admin@example.com';
            const { isAdmin } = require('../src/services/authService');
            expect(isAdmin({ id: 1, display_name: 'Test' })).toBe(false);
        });

        it('should return false when user email is not in admin list', () => {
            process.env.ADMIN_EMAILS = 'admin@example.com';
            const { isAdmin } = require('../src/services/authService');
            expect(isAdmin({ id: 1, email: 'user@example.com' })).toBe(false);
        });

        it('should return true when user email is in admin list', () => {
            process.env.ADMIN_EMAILS = 'admin@example.com';
            const { isAdmin } = require('../src/services/authService');
            expect(isAdmin({ id: 1, email: 'admin@example.com' })).toBe(true);
        });

        it('should return true when user email matches one of multiple admins', () => {
            process.env.ADMIN_EMAILS = 'admin1@example.com,admin2@example.com';
            const { isAdmin } = require('../src/services/authService');
            expect(isAdmin({ id: 1, email: 'admin2@example.com' })).toBe(true);
        });

        it('should be case-insensitive for email comparison', () => {
            process.env.ADMIN_EMAILS = 'Admin@Example.com';
            const { isAdmin } = require('../src/services/authService');
            expect(isAdmin({ id: 1, email: 'admin@example.com' })).toBe(true);
        });

        it('should return false when ADMIN_EMAILS is not configured', () => {
            delete process.env.ADMIN_EMAILS;
            const { isAdmin } = require('../src/services/authService');
            expect(isAdmin({ id: 1, email: 'anyone@example.com' })).toBe(false);
        });
    });
});
