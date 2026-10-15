const NODE_ENVS = ['development', 'test', 'production'] as const;

export interface Env {
  NODE_ENV: (typeof NODE_ENVS)[number];
  PORT: number;
  LOG_LEVEL: string;
  DATABASE_URL: string;
  CORS_ORIGIN: string;
}

function str(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
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

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\n- ${errors.join('\n- ')}`);
  }

  return {
    NODE_ENV: nodeEnv as Env['NODE_ENV'],
    PORT: port,
    LOG_LEVEL: str(raw.LOG_LEVEL, 'info'),
    DATABASE_URL: databaseUrl as string,
    CORS_ORIGIN: str(raw.CORS_ORIGIN, 'http://localhost:3000'),
  };
}
