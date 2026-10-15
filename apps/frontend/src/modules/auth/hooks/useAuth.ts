'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import { authApi } from '../api/authApi';
import { useAuthStore } from '@/store/authStore';
import type { LoginRequest } from '../types/auth.types';

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const authKeys = {
  me: ['auth', 'me'] as const,
};

// ─── useAuth ─────────────────────────────────────────────────────────────────

export function useAuth() {
  const { user, isAuthenticated, refreshToken, logout: storeLogout } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const logout = useCallback(async () => {
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {
      // Ignore: the token may already be expired or revoked.
    } finally {
      storeLogout();
      queryClient.clear();
      router.push('/login');
    }
  }, [refreshToken, storeLogout, queryClient, router]);

  return { user, isAuthenticated, logout };
}

// ─── useLogin ────────────────────────────────────────────────────────────────

/** Only allow same-site relative paths, to avoid open redirects. */
function safeCallbackUrl(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/dashboard';
}

export function useLogin(callbackUrl: string | null) {
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: async (credentials: LoginRequest) => (await authApi.login(credentials)).data,
    onSuccess: (data) => {
      setAuth(data.user, data.tokens.accessToken, data.tokens.refreshToken);
      // Full navigation so proxy.ts sees the new cookie.
      window.location.href = safeCallbackUrl(callbackUrl);
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        if (!error.response) {
          toast.error('No se pudo conectar con el servidor.');
          return;
        }
        if (error.response.status === 401 || error.response.status === 400) {
          toast.error('Correo o contraseña incorrectos.');
          return;
        }
      }
      toast.error('Ocurrió un error inesperado. Intenta de nuevo.');
    },
  });
}

// ─── useCurrentUser ───────────────────────────────────────────────────────────

export function useCurrentUser() {
  const { isAuthenticated, setUser } = useAuthStore();

  const query = useQuery({
    queryKey: authKeys.me,
    queryFn: async () => (await authApi.getMe()).data,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (query.data) setUser(query.data.user);
  }, [query.data, setUser]);

  return query;
}
