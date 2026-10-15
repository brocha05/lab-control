import apiClient from '@/lib/api/client';
import type { Me } from '@/types';
import type { AuthResponse, AuthTokens, LoginRequest } from '../types/auth.types';

// Endpoints: docs/api/endpoints.md#auth--tenancy (backend implementation: Phase 2).
export const authApi = {
  login: (data: LoginRequest) => apiClient.post<AuthResponse>('/auth/login', data),

  logout: (refreshToken: string) => apiClient.post<void>('/auth/logout', { refreshToken }),

  refresh: (refreshToken: string) => apiClient.post<AuthTokens>('/auth/refresh', { refreshToken }),

  getMe: () => apiClient.get<Me>('/me'),
};
