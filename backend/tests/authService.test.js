const { findOrCreateUser } = require('../src/services/authService');
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
