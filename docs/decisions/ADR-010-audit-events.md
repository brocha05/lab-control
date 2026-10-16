# ADR-010: Audit trail as one row per successful change, captured at the HTTP boundary

- Status: Accepted
- Date: 2026-10-16
- Amends ADR-003 (JSON is allowed in one more place: `audit_events.payload`)

## Context

The lab's accreditation (NMX-EC-17025, Q-52) requires a record of who changed what and
when (Q-54). Records, results and reports can be corrected (Q-34, Q-36, A-85). Every
change already enters through a small set of mutating HTTP endpoints, authenticated and
tenant-scoped.

## Decision

- Table `audit_events` (owned by the `audit` module): tenant, actor, `action` (the route,
  e.g. `PUT /field-records/:id`), `entity_type` (the resource, e.g. `field-records`),
  `entity_id` (the route's id, or the id of what was created), HTTP status, request id,
  `payload` and `created_at`. Append only: no update or delete endpoint, no cascade.
- A global `AuditInterceptor` writes one row after every **successful** `POST`, `PUT`,
  `PATCH` or `DELETE` by an authenticated user. `/auth/*` is skipped; keys named like
  `password` are redacted.
- `payload` is the request body as `jsonb`: for the nested `PUT` endpoints it is the
  full new state, so consecutive events show what changed. This is a technical record of
  a request, not unknown domain fields, so ADR-003's "no JSON for domain fields" holds.
- Read: `GET /audit-events` (`audit.read`: Jefe de Control de Calidad and Coordinador del
  SGC), filtered by entity. Retention: at least 4 years like the records (Q-52).

## Alternatives

| Option | Why not |
|--------|---------|
| Calls to an audit service inside every use case | More precise (before/after values), but every service and future endpoint must remember it; one missed call is a gap in an accreditation record. |
| Database triggers | Capture every row change, but lose the actor and the intent unless the actor is passed through the session; harder to read for the lab. |
| Temporal tables / event sourcing | Far beyond what the lab needs (ADR-005). |

## Consequences

- Complete by construction for anything changed through the API.
- No before-values in a row: the previous event of the same entity (or its snapshot for
  reports) holds them.
- An audit write that fails after the change is logged as an error; the change stays.
  Revisit (same transaction) if the lab requires all-or-nothing.
