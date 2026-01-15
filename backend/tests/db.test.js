const { query, pool } = require('../src/db');

// This test will only pass if the database is running and accessible.
describe('Database Module', () => {
  afterAll(() => {
    pool.end();
  });

  it('should connect to the database and execute a simple query', async () => {
    const { rows } = await query('SELECT NOW()');
    expect(rows[0].now).toBeDefined();
  });
});
