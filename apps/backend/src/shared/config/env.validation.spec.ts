import { validateEnv } from './env.validation.js';

describe('validateEnv', () => {
  it('applies defaults', () => {
    expect(validateEnv({ DATABASE_URL: 'postgresql://x' })).toEqual({
      NODE_ENV: 'development',
      PORT: 3001,
      LOG_LEVEL: 'info',
      DATABASE_URL: 'postgresql://x',
      CORS_ORIGIN: 'http://localhost:3000',
    });
  });

  it('parses PORT from a string', () => {
    expect(validateEnv({ DATABASE_URL: 'postgresql://x', PORT: '4000' }).PORT).toBe(4000);
  });

  it('lists every problem at once', () => {
    expect(() => validateEnv({ NODE_ENV: 'staging', PORT: 'abc' })).toThrow(
      /NODE_ENV must be one of[\s\S]*PORT must be a positive integer[\s\S]*DATABASE_URL is required/,
    );
  });
});
