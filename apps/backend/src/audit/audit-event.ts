/**
 * Pure helpers that turn a successful mutating request into an audit row (ADR-010).
 */

export const AUDITED_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const API_PREFIX = /^\/api\/v1/;
const REDACTED = '[redactado]';
/** Resources created under a parent: POST /projects/:projectId/field-records. */
const NESTED_RESOURCES = new Set(['field-records', 'reports']);

export interface AuditDraft {
  action: string;
  entityType: string;
  entityId: string | null;
  payload: unknown;
}

/** Route pattern without the API prefix: "/api/v1/field-records/:id" → "/field-records/:id". */
export function routePattern(path: string): string {
  return path.replace(API_PREFIX, '') || '/';
}

/** Auth endpoints (passwords, tokens) are never audited. */
export function isAudited(method: string, pattern: string): boolean {
  return AUDITED_METHODS.has(method) && !pattern.startsWith('/auth');
}

/** Removes anything that looks like a secret, at any depth. */
export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [
        k,
        /password|token|secret/i.test(k) ? REDACTED : redact(v),
      ]),
    );
  }
  return value;
}

function idOf(response: unknown): string | null {
  return response && typeof response === 'object' && 'id' in response ? String(response.id) : null;
}

/**
 * - `PUT /field-records/:id` → field-records, the route's id.
 * - `POST /field-records/:id/complete` → field-records, the route's id.
 * - `POST /clients` → clients, the created id.
 * - `POST /projects/:projectId/field-records` → field-records, the created id.
 * - `PUT /tests/results` → tests, no id (the payload lists them).
 */
export function draftAuditEvent(input: {
  method: string;
  pattern: string;
  params: Record<string, string | undefined>;
  body: unknown;
  response: unknown;
}): AuditDraft {
  const segments = input.pattern.split('/').filter(Boolean);
  const last = segments[segments.length - 1] ?? '';
  const nestedCreate =
    input.method === 'POST' && segments.length >= 3 && NESTED_RESOURCES.has(last);
  const topCreate = input.method === 'POST' && segments.length === 1;

  let entityId: string | null;
  if (nestedCreate || topCreate) {
    entityId = idOf(input.response);
  } else {
    const param = [...segments]
      .reverse()
      .find((s) => s.startsWith(':'))
      ?.slice(1);
    entityId = param ? (input.params[param] ?? null) : null;
  }
  return {
    action: `${input.method} ${input.pattern}`,
    entityType: nestedCreate ? last : (segments[0] ?? 'unknown'),
    entityId,
    payload: input.body === undefined || input.body === null ? null : redact(input.body),
  };
}
