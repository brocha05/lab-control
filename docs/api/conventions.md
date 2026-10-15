# API Conventions

Same conventions as the team's existing boilerplates, so the frontend API client and
hooks can be reused.

## Basics

- REST + JSON over HTTPS. Base path `/api/v1`.
- Auth: `Authorization: Bearer <access token>`. Every endpoint is authenticated except
  `/health` and `/auth/*`.
- **Tenant is never in the URL or body.** It comes from the token (ADR-002).
- IDs are UUIDs. Cross-tenant or missing IDs → `404`.
- Resource names are plural kebab-case: `/field-records`, `/tests`.
- Nesting only for **creation and listing within a parent** (`POST /projects/:id/field-records`).
  Item access is flat (`GET /field-records/:id`).

## Responses

Success (wrapped by the global interceptor):

```json
{ "success": true, "data": { ... }, "meta": { "requestId": "…" } }
```

Paginated list (services return `{ data, total, page, limit, pages }`, and the
interceptor reshapes it):

```json
{ "success": true,
  "data": { "items": [ ... ], "total": 120, "page": 1, "limit": 20, "pages": 6 },
  "meta": { "requestId": "…" } }
```

Error (global filter):

```json
{ "success": false,
  "error": { "code": "NOT_FOUND", "message": "Project not found", "details": [] },
  "meta": { "requestId": "…" } }
```

| Status | When |
|--------|------|
| 400 | DTO validation failed (`details` lists the field errors) |
| 401 / 403 | Not authenticated / role not allowed |
| 404 | Not found **or belongs to another tenant** |
| 409 | Invalid state transition (e.g. completing a `CANCELLED` record), unique conflict |
| 422 | Business rule violated (e.g. report not ready). Used once the rules are known. |

## State changes are actions, not field updates

```
POST /field-records/:id/complete
POST /field-records/:id/cancel
POST /tests/:id/complete
POST /reports/:id/finalize
```

`PATCH` never accepts `status`. This keeps transitions in one place (lifecycle.md).

## Lists

- Query: `?page=1&limit=20` (max 100), `?sort=field:asc`, explicit filters
  (`?status=SCHEDULED&from=2026-10-01&to=2026-10-31`).
- Dates in query/body: `YYYY-MM-DD` for domain dates, ISO-8601 with offset for instants.

## Validation

`ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`.
Unknown fields are rejected, so the API surface can't silently drift ahead of the
validated domain.

## Versioning

URI prefix `/api/v1`. Breaking changes → `/api/v2` for the affected resources. Not
expected before production.

## Documentation

Swagger/OpenAPI generated with `@nestjs/swagger` at `/api/docs` (non-production only).
