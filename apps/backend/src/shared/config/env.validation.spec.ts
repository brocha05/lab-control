import { validateEnv } from './env.validation.js';

const SECRET = 'x'.repeat(32);
const required = { DATABASE_URL: 'postgresql://x', JWT_ACCESS_SECRET: SECRET };

describe('validateEnv', () => {
  it('applies defaults', () => {
    expect(validateEnv(required)).toEqual({
      NODE_ENV: 'development',
      PORT: 3001,
      LOG_LEVEL: 'info',
      DATABASE_URL: 'postgresql://x',
      CORS_ORIGIN: 'http://localhost:3000',
      JWT_ACCESS_SECRET: SECRET,
      JWT_ACCESS_TTL_SECONDS: 900,
      REFRESH_TOKEN_TTL_DAYS: 7,
      REPORT_STORAGE_DRIVER: 'local',
      REPORT_STORAGE_DIR: 'storage/reports',
      S3_ENDPOINT: undefined,
      S3_REGION: 'us-east-1',
      S3_BUCKET: undefined,
      S3_ACCESS_KEY_ID: undefined,
      S3_SECRET_ACCESS_KEY: undefined,
      PDF_RENDERER: 'playwright',
      PDF_CHROMIUM_PATH: undefined,
    });
  });

  it('requires the S3 settings when storing reports in S3', () => {
    expect(() => validateEnv({ ...required, REPORT_STORAGE_DRIVER: 's3' })).toThrow(
      /S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY/,
    );
    expect(() => validateEnv({ ...required, PDF_RENDERER: 'wkhtml' })).toThrow(/PDF_RENDERER/);
  });

  it('parses PORT from a string', () => {
    expect(validateEnv({ ...required, PORT: '4000' }).PORT).toBe(4000);
  });

  it('lists every problem at once', () => {
    expect(() => validateEnv({ NODE_ENV: 'staging', PORT: 'abc' })).toThrow(
      /NODE_ENV must be one of[\s\S]*PORT must be a positive integer[\s\S]*DATABASE_URL is required[\s\S]*JWT_ACCESS_SECRET is required/,
    );
  });

  it('rejects a short JWT secret and invalid token lifetimes', () => {
    expect(() =>
      validateEnv({
        ...required,
        JWT_ACCESS_SECRET: 'short',
        JWT_ACCESS_TTL_SECONDS: '0',
        REFRESH_TOKEN_TTL_DAYS: '1.5',
      }),
    ).toThrow(/JWT_ACCESS_SECRET[\s\S]*JWT_ACCESS_TTL_SECONDS[\s\S]*REFRESH_TOKEN_TTL_DAYS/);
  });
});
