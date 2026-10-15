// Response envelope shared with the frontend API client (docs/api/conventions.md).

export interface ResponseMeta {
  requestId: string;
}

export interface SuccessApiResponse<T> {
  success: true;
  data: T;
  meta: ResponseMeta;
}

export interface ErrorApiResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string[];
  };
  meta: ResponseMeta;
}

/** What services return for lists. The interceptor reshapes it to `{ items, ...page }`. */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
