import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { env } from '@/lib/config/env';
import type { SuccessApiResponse } from '@/types';

// Lazy import avoids a circular dependency with the Zustand store.
const getAuthState = () => import('@/store/authStore').then((m) => m.useAuthStore.getState());

// The tenant is NOT sent by the client: the backend reads it from the JWT (ADR-002).
const apiClient: AxiosInstance = axios.create({
  baseURL: env.API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ─── Request interceptor ────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const auth = await getAuthState();
    if (auth.accessToken) {
      config.headers.Authorization = `Bearer ${auth.accessToken}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

function isSuccessEnvelope(body: unknown): body is SuccessApiResponse<unknown> {
  return (
    typeof body === 'object' &&
    body !== null &&
    (body as { success?: unknown }).success === true &&
    'data' in body
  );
}

// ─── Response interceptor — envelope unwrap + token refresh ─────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error || !token) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Backend envelope: { success: true, data: T, meta } → T (docs/api/conventions.md)
    if (isSuccessEnvelope(response.data)) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as
      (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    // Only attempt refresh on 401, and never for the auth endpoints themselves.
    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/')
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const { refreshToken, setTokens, logout } = await getAuthState();

    if (!refreshToken) {
      isRefreshing = false;
      logout();
      return Promise.reject(error);
    }

    try {
      const { data: body } = await axios.post<
        SuccessApiResponse<{ accessToken: string; refreshToken: string }>
      >(`${env.API_URL}/auth/refresh`, { refreshToken });

      const tokens = body.data;
      setTokens(tokens.accessToken, tokens.refreshToken);
      processQueue(null, tokens.accessToken);
      originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;
