const request = require('supertest');

const API_URL = 'http://localhost:5000';

describe('Backend Integration Test', () => {
  it('GET / responds with "Hello from IIDX Tier Tracker Backend!"', async () => {
    const response = await request(API_URL).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('Hello from IIDX Tier Tracker Backend!');
  });
});
