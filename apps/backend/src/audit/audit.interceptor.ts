import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { HTTP_CODE_METADATA } from '@nestjs/common/constants.js';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { concatMap, Observable } from 'rxjs';
import { requestIdOf } from '../shared/http/request-id.js';
import type { AuthenticatedUser } from '../shared/tenancy/authenticated-user.js';
import { draftAuditEvent, isAudited, routePattern } from './audit-event.js';
import { AuditService } from './audit.service.js';

/**
 * Global (APP_INTERCEPTOR): after every successful change by an authenticated user,
 * one `audit_events` row (ADR-010). Failed requests never reach it (they throw).
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly audit: AuditService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();
    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser; id?: unknown }>();
    const route = (req as { route?: { path?: string } }).route?.path;
    const pattern = route ? routePattern(route) : null;
    if (!pattern || !req.user || !isAudited(req.method, pattern)) return next.handle();
    const user = req.user;

    return next.handle().pipe(
      concatMap(async (body: unknown) => {
        const statusCode =
          this.reflector.get<number | undefined>(HTTP_CODE_METADATA, context.getHandler()) ??
          (req.method === 'POST' ? 201 : 200);
        const response =
          body && typeof body === 'object' && 'success' in body && 'data' in body
            ? (body as { data: unknown }).data
            : body;
        try {
          await this.audit.record(
            user.tenantId,
            user.userId,
            draftAuditEvent({
              method: req.method,
              pattern,
              params: req.params as Record<string, string | undefined>,
              body: req.body as unknown,
              response,
            }),
            { statusCode, requestId: requestIdOf(req) || null },
          );
        } catch (error) {
          // The change is already committed; keep it and make the gap visible (ADR-010).
          this.logger.error(`Audit write failed for ${req.method} ${pattern}: ${String(error)}`);
        }
        return body;
      }),
    );
  }
}
