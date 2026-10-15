import type { User } from '@/types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * `POST /auth/login` response. Provisional: the contract is fixed when auth is
 * ported from the backend boilerplate (development-plan 2.3).
 */
export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}
