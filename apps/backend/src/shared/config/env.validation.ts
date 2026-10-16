const NODE_ENVS = ['development', 'test', 'production'] as const;

export interface Env {
  NODE_ENV: (typeof NODE_ENVS)[number];
  PORT: number;
  LOG_LEVEL: string;
  DATABASE_URL: string;
  CORS_ORIGIN: string;
  /** HMAC secret for access tokens (HS256). At least 32 characters. */
  JWT_ACCESS_SECRET: string;
  JWT_ACCESS_TTL_SECONDS: number;
  REFRESH_TOKEN_TTL_DAYS: number;
  /** Where report PDFs go: a local folder (development, tests) or S3/MinIO (ADR-005). */
  REPORT_STORAGE_DRIVER: 'local' | 's3';
  REPORT_STORAGE_DIR: string;
  S3_ENDPOINT: string | undefined;
  S3_REGION: string;
  S3_BUCKET: string | undefined;
  S3_ACCESS_KEY_ID: string | undefined;
  S3_SECRET_ACCESS_KEY: string | undefined;
  /** HTML → PDF (ADR-006): headless Chromium, or a stub for tests without a browser. */
  PDF_RENDERER: 'playwright' | 'stub';
  /** Optional Chromium executable (e.g. a system Chrome); default: Playwright's own. */
  PDF_CHROMIUM_PATH: string | undefined;
}

const opt = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined;

const MIN_SECRET_LENGTH = 32;

function str(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function positiveInt(value: unknown, fallback: number): number {
  return value === undefined || value === '' ? fallback : Number(value);
}

/** Fail fast on boot with every problem listed at once. */
export function validateEnv(raw: Record<string, unknown>): Env {
  const errors: string[] = [];

  const nodeEnv = str(raw.NODE_ENV, 'development');
  if (!(NODE_ENVS as readonly string[]).includes(nodeEnv)) {
    errors.push(`NODE_ENV must be one of ${NODE_ENVS.join(', ')}`);
  }

  const port = Number(raw.PORT ?? 3001);
  if (!Number.isInteger(port) || port <= 0) {
    errors.push('PORT must be a positive integer');
  }

  const databaseUrl = raw.DATABASE_URL;
  if (typeof databaseUrl !== 'string' || databaseUrl.length === 0) {
    errors.push('DATABASE_URL is required');
  }

  const jwtSecret = raw.JWT_ACCESS_SECRET;
  if (typeof jwtSecret !== 'string' || jwtSecret.length < MIN_SECRET_LENGTH) {
    errors.push(`JWT_ACCESS_SECRET is required (at least ${MIN_SECRET_LENGTH} characters)`);
  }

  const accessTtl = positiveInt(raw.JWT_ACCESS_TTL_SECONDS, 900);
  if (!Number.isInteger(accessTtl) || accessTtl <= 0) {
    errors.push('JWT_ACCESS_TTL_SECONDS must be a positive integer');
  }

  const refreshTtl = positiveInt(raw.REFRESH_TOKEN_TTL_DAYS, 7);
  if (!Number.isInteger(refreshTtl) || refreshTtl <= 0) {
    errors.push('REFRESH_TOKEN_TTL_DAYS must be a positive integer');
  }

  const storage = str(raw.REPORT_STORAGE_DRIVER, 'local');
  if (storage !== 'local' && storage !== 's3') {
    errors.push('REPORT_STORAGE_DRIVER must be local or s3');
  }
  if (
    storage === 's3' &&
    (!opt(raw.S3_BUCKET) || !opt(raw.S3_ACCESS_KEY_ID) || !opt(raw.S3_SECRET_ACCESS_KEY))
  ) {
    errors.push(
      'REPORT_STORAGE_DRIVER=s3 needs S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY',
    );
  }
  const renderer = str(raw.PDF_RENDERER, 'playwright');
  if (renderer !== 'playwright' && renderer !== 'stub') {
    errors.push('PDF_RENDERER must be playwright or stub');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\n- ${errors.join('\n- ')}`);
  }

  return {
    NODE_ENV: nodeEnv as Env['NODE_ENV'],
    PORT: port,
    LOG_LEVEL: str(raw.LOG_LEVEL, 'info'),
    DATABASE_URL: databaseUrl as string,
    CORS_ORIGIN: str(raw.CORS_ORIGIN, 'http://localhost:3000'),
    JWT_ACCESS_SECRET: jwtSecret as string,
    JWT_ACCESS_TTL_SECONDS: accessTtl,
    REFRESH_TOKEN_TTL_DAYS: refreshTtl,
    REPORT_STORAGE_DRIVER: storage as Env['REPORT_STORAGE_DRIVER'],
    REPORT_STORAGE_DIR: str(raw.REPORT_STORAGE_DIR, 'storage/reports'),
    S3_ENDPOINT: opt(raw.S3_ENDPOINT),
    S3_REGION: str(raw.S3_REGION, 'us-east-1'),
    S3_BUCKET: opt(raw.S3_BUCKET),
    S3_ACCESS_KEY_ID: opt(raw.S3_ACCESS_KEY_ID),
    S3_SECRET_ACCESS_KEY: opt(raw.S3_SECRET_ACCESS_KEY),
    PDF_RENDERER: renderer as Env['PDF_RENDERER'],
    PDF_CHROMIUM_PATH: opt(raw.PDF_CHROMIUM_PATH),
  };
}
