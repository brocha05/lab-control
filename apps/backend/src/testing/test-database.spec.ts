import { assertTestDatabase, testDatabaseUrl } from './test-database.js';

describe('test database guard', () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  it('appends _test to the DATABASE_URL database name', () => {
    delete process.env.TEST_DATABASE_URL;
    process.env.DATABASE_URL = 'postgresql://lab:lab@localhost:5433/lab_control?schema=public';
    expect(testDatabaseUrl()).toBe(
      'postgresql://lab:lab@localhost:5433/lab_control_test?schema=public',
    );
  });

  it('prefers TEST_DATABASE_URL', () => {
    process.env.TEST_DATABASE_URL = 'postgresql://ci:ci@db:5432/ci_test';
    expect(testDatabaseUrl()).toBe('postgresql://ci:ci@db:5432/ci_test');
  });

  it('refuses a database whose name does not end in _test', () => {
    expect(() => assertTestDatabase('postgresql://lab:lab@localhost/lab_control')).toThrow(
      /must end in _test/,
    );
  });
});
