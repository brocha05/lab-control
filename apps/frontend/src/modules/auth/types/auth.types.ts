import type { User } from '@/types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** `POST /auth/login` response (apps/backend/src/auth/auth.service.ts `LoginResult`). */
export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}
