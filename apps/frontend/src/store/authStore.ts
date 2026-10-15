import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types';

// ─── Cookie sync ──────────────────────────────────────────────────────────────
// The route guard (proxy.ts) reads the access token from a cookie because it
// cannot access localStorage. Keep both in sync.

function setCookieToken(token: string | null) {
  if (typeof document === 'undefined') return;
  if (token) {
    document.cookie = `access-token=${token}; path=/; SameSite=Lax`;
  } else {
    document.cookie = 'access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

interface AuthActions {
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setUser: (user) => set({ user }),

      setTokens: (accessToken, refreshToken) => {
        setCookieToken(accessToken);
        set({ accessToken, refreshToken });
      },

      setAuth: (user, accessToken, refreshToken) => {
        setCookieToken(accessToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      logout: () => {
        setCookieToken(null);
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : ({} as Storage)
      ),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      // Sync the cookie when the store rehydrates from localStorage on page load.
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          setCookieToken(state.accessToken);
        }
      },
    }
  )
);
