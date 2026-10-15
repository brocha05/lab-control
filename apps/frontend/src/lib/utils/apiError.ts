import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import type { ErrorApiResponse } from '@/types';

/** Extracts the backend error envelope (docs/api/conventions.md#responses), if present. */
export function getApiError(error: unknown): ErrorApiResponse['error'] | null {
  if (isAxiosError<ErrorApiResponse>(error)) {
    return error.response?.data?.error ?? null;
  }
  return null;
}

/** Shows validation details one by one, otherwise the backend message, otherwise `fallback`. */
export function toastApiError(error: unknown, fallback: string): void {
  const apiError = getApiError(error);
  if (apiError?.details?.length) {
    apiError.details.forEach((d) => toast.error(d));
    return;
  }
  toast.error(apiError?.message || fallback);
}
