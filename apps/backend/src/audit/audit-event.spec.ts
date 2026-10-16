import { draftAuditEvent, isAudited, redact, routePattern } from './audit-event.js';

const draft = (method: string, pattern: string, params = {}, response: unknown = null) =>
  draftAuditEvent({ method, pattern, params, body: { a: 1 }, response });

describe('audit events (ADR-010)', () => {
  it('audits changes but not reads or auth', () => {
    expect(isAudited('PUT', '/field-records/:id')).toBe(true);
    expect(isAudited('GET', '/field-records/:id')).toBe(false);
    expect(isAudited('POST', '/auth/login')).toBe(false);
    expect(routePattern('/api/v1/tests/results')).toBe('/tests/results');
  });

  it('names the entity of each kind of route', () => {
    expect(draft('PUT', '/field-records/:id', { id: 'r1' })).toMatchObject({
      action: 'PUT /field-records/:id',
      entityType: 'field-records',
      entityId: 'r1',
    });
    expect(draft('POST', '/field-records/:id/complete', { id: 'r1' })).toMatchObject({
      entityType: 'field-records',
      entityId: 'r1',
    });
    expect(draft('POST', '/clients', {}, { id: 'c9' })).toMatchObject({
      entityType: 'clients',
      entityId: 'c9',
    });
    expect(
      draft('POST', '/projects/:projectId/field-records', { projectId: 'p1' }, { id: 'r2' }),
    ).toMatchObject({ entityType: 'field-records', entityId: 'r2' });
    expect(draft('POST', '/field-records/:id/reports', { id: 'r1' }, { id: 'rep' })).toMatchObject({
      entityType: 'reports',
      entityId: 'rep',
    });
    expect(draft('PUT', '/tests/results')).toMatchObject({ entityType: 'tests', entityId: null });
  });

  it('redacts secrets at any depth', () => {
    expect(redact({ email: 'x', password: 'p', nested: [{ accessToken: 't', n: 1 }] })).toEqual({
      email: 'x',
      password: '[redactado]',
      nested: [{ accessToken: '[redactado]', n: 1 }],
    });
  });
});
