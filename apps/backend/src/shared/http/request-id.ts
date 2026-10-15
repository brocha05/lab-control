import { randomUUID } from 'crypto';
import type { IncomingMessage } from 'http';

/** Reuse a sane incoming `X-Request-ID`, otherwise generate one. */
export function resolveRequestId(req: IncomingMessage): string {
  const incoming = req.headers['x-request-id'];
  return typeof incoming === 'string' && incoming.length > 0 && incoming.length <= 128
    ? incoming
    : randomUUID();
}

/** The ID pino-http assigned to this request (empty outside the HTTP pipeline, e.g. in tests). */
export function requestIdOf(req: { id?: unknown }): string {
  return typeof req.id === 'string' ? req.id : '';
}
