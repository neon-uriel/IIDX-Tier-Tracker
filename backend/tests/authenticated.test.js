const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');

// This is a common technique to test protected endpoints
// We can "login" a user by mocking the Passport session
const login = (agent, user) => {
  return new Promise((resolve, reject) => {
    agent
      .get('/auth/mock') // A special route just for tests
      .query({ user: JSON.stringify(user) })
      .expect(200)
      .end((err, res) => {
        if (err) return reject(err);
        resolve();
      });
  });
};


describe('Authenticated Routes', () => {
    let agent;
    const testUser = { id: 99, display_name: 'Authenticated Test User', email: 'auth@test.com' };

    beforeAll(async () => {
        // Setup a test route only in test environment
        if (process.env.NODE_ENV === 'test') {
            app.get('/auth/mock', (req, res) => {
                const user = JSON.parse(req.query.user);
                req.logIn(user, (err) => {
                    if (err) {
                        return res.status(500).send('Failed to login');
                    }
                    res.status(200).send('Logged in');
                });
            });
        }
        // Insert a test user
        await db.query(`
            INSERT INTO users (id, google_id, display_name, email) 
            VALUES ($1, $2, $3, $4) 
            ON CONFLICT (id) DO NOTHING;
        `, [testUser.id, 'google-id-99', testUser.display_name, testUser.email]);
    });

    beforeEach(() => {
        agent = request.agent(app); // Create an agent to maintain session cookies
    });

    afterAll(async () => {
        await db.query('DELETE FROM users WHERE id = $1', [testUser.id]);
        db.pool.end(); // Close the pool from the main db module
    });

    it('GET /api/current_user should return user info for an authenticated user', async () => {
        // "Log in" our test user
        await login(agent, testUser);

        // Now make a request to the protected endpoint
        const response = await agent.get('/api/current_user');
        
        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
        expect(response.body.id).toBe(testUser.id);
        expect(response.body.display_name).toBe(testUser.display_name);
    });
});
