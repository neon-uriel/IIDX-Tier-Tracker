const request = require('supertest');
const app = require('../src/app');

describe('Auth Routes', () => {
    it('GET /auth/google should redirect to Google', async () => {
        const response = await request(app).get('/auth/google');
        expect(response.status).toBe(302);
        expect(response.headers.location).toContain('accounts.google.com');
    });

    it('GET /api/current_user returns no user when not authenticated', async () => {
        const response = await request(app).get('/api/current_user');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({});
    });
    
    it('GET /auth/logout should redirect', async () => {
        const response = await request(app).get('/auth/logout');
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/');
    });
});
