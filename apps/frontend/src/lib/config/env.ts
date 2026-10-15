// NEXT_PUBLIC_* values must be read with literal property access so Next.js can inline them.
export const env = {
  API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1',
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME ?? 'Lab Control',
} as const;

export type Env = typeof env;
