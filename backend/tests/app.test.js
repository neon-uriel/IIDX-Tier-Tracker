const request = require('supertest');
const app = require('../src/app');

describe('GET /', () => {
  it('responds with Hello from IIDX Tier Tracker Backend!', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('Hello from IIDX Tier Tracker Backend!');
  });
});
