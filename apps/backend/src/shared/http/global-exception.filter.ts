import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ErrorApiResponse } from './api-response.js';
import { requestIdOf } from './request-id.js';

const STATUS_CODE_NAMES: Record<number, string> = Object.fromEntries(
  Object.entries(HttpStatus)
    .filter(([key]) => isNaN(Number(key)))
    .map(([name, code]) => [code, name]),
);

/** One error shape for the whole API: `{ success:false, error:{code,message,details}, meta }`. */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request & { id?: unknown }>();
    const res = ctx.getResponse<Response>();
    const requestId = requestIdOf(req);

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: string[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      const raw: unknown =
        typeof body === 'object' && body !== null ? (body as { message?: unknown }).message : body;
      if (Array.isArray(raw)) {
        // ValidationPipe errors: one entry per invalid field.
        details = raw.map(String);
        message = 'Validation failed';
      } else if (typeof raw === 'string') {
        message = raw;
      } else {
        message = exception.message;
      }
    } else {
      // Unknown errors are logged but never leaked to the client.
      this.logger.error(
        exception instanceof Error ? (exception.stack ?? exception.message) : String(exception),
      );
    }

    const payload: ErrorApiResponse = {
      success: false,
      error: {
        code: STATUS_CODE_NAMES[status] ?? 'INTERNAL_SERVER_ERROR',
        message,
        ...(details !== undefined && { details }),
      },
      meta: { requestId },
    };

    res.status(status).json(payload);
  }
}
