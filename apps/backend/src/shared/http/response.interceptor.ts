import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request } from 'express';
import { map, Observable } from 'rxjs';
import type { PaginatedResult, ResponseMeta, SuccessApiResponse } from './api-response.js';
import { requestIdOf } from './request-id.js';

function isPaginated(value: unknown): value is PaginatedResult<unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.data) &&
    typeof v.total === 'number' &&
    typeof v.page === 'number' &&
    typeof v.limit === 'number' &&
    typeof v.pages === 'number'
  );
}

/** Wraps every success body as `{ success:true, data, meta:{requestId} }`. */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<SuccessApiResponse<unknown>> {
    const req = context.switchToHttp().getRequest<Request & { id?: unknown }>();
    const meta: ResponseMeta = { requestId: requestIdOf(req) };

    return next.handle().pipe(
      map((body: unknown) => {
        if (isPaginated(body)) {
          const { data: items, ...page } = body;
          return { success: true as const, data: { items, ...page }, meta };
        }
        return { success: true as const, data: body ?? null, meta };
      }),
    );
  }
}
