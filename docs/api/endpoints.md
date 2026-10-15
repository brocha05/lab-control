# Endpoints (preliminary)

> Only the endpoints needed for the MVP workflow. Request/response **bodies for domain
> content are TBD**. Don't implement endpoints for a phase that's still blocked.

Legend: **Phase** = roadmap phase · 🔒 = blocked on domain documents

## Auth & tenancy

| Method | Path | Purpose | Phase |
|--------|------|---------|-------|
| POST | `/auth/login` | Email + password → access + refresh tokens | 2 |
| POST | `/auth/refresh` | Rotate refresh token | 2 |
| POST | `/auth/logout` | Revoke refresh token | 2 |
| GET | `/me` | Current user + tenant (incl. timezone) | 2 |
| GET / POST / PATCH | `/users`, `/users/:id` | Tenant admin manages users | 10 |

## Clients & projects

| Method | Path | Purpose | Phase |
|--------|------|---------|-------|
| GET | `/clients` | List (search by name) | 3 |
| POST | `/clients` | Create (`name` only until Q-41) | 3 |
| GET / PATCH | `/clients/:id` | Read / update | 3 |
| GET | `/projects` | List (`?clientId=`) | 3 |
| POST | `/projects` | Create (`clientId`, `name`) | 3 |
| GET / PATCH | `/projects/:id` | Read / update | 3 |
| GET | `/projects/:id/test-configuration` | Configured ages | 6 |
| PUT | `/projects/:id/test-configuration` | Replace the set of `{ ageDays, specimenCount }` | 6 |

## Field records, samples, specimens

| Method | Path | Purpose | Phase |
|--------|------|---------|-------|
| GET | `/projects/:id/field-records` | List for project | 4 |
| POST | `/projects/:id/field-records` | Create `DRAFT` (`recordDate` + 🔒 fields) | 4 |
| GET | `/field-records/:id` | Record with samples + specimens | 4 |
| PATCH | `/field-records/:id` | Edit while `DRAFT` 🔒 | 4 |
| POST | `/field-records/:id/complete` | `DRAFT → COMPLETED`, plans tests 🔒 (Q-33) | 4/6 |
| POST | `/field-records/:id/cancel` | `→ CANCELLED` | 4 |
| POST | `/field-records/:id/samples` | Add sample 🔒 | 5 |
| POST | `/samples/:id/specimens` | Add specimen(s) 🔒 | 5 |
| POST | `/specimens/:id/cancel` | Cancel specimen + open tests | 5 |

> Simpler alternative, decided in Phase 4 after seeing the form: one
> `PUT /field-records/:id` with nested samples/specimens while `DRAFT`, if the form is
> always edited as a whole.

## Tests

| Method | Path | Purpose | Phase |
|--------|------|---------|-------|
| GET | `/tests/pending` | `?until=YYYY-MM-DD&projectId=` → tests with derived `scheduledDate`, `dueStatus` | 6 |
| GET | `/tests/:id` | Detail incl. specimen/record context | 7 |
| POST | `/tests/:id/start` | `SCHEDULED → IN_PROGRESS` (if the state is kept, A-22) | 7 |
| POST | `/tests/:id/complete` | Record results 🔒 (Q-24…Q-26) | 7 |
| POST | `/tests/:id/cancel` | Cancel | 7 |

## Bitácora (read-only)

| Method | Path | Purpose | Phase |
|--------|------|---------|-------|
| GET | `/projects/:id/bitacora` | Composed view. Columns 🔒 (Q-27) | 8 |

## Reports

| Method | Path | Purpose | Phase |
|--------|------|---------|-------|
| GET | `/projects/:id/reports` | List versions | 9 |
| POST | `/projects/:id/reports` | Create + generate (`templateKey`) 🔒 readiness (Q-35) | 9 |
| GET | `/reports/:id` | Metadata (+ snapshot for preview) | 9 |
| POST | `/reports/:id/regenerate` | Regenerate while not `FINAL` | 9 |
| POST | `/reports/:id/finalize` | `GENERATED → FINAL` (role TBD, Q-40) | 9 |
| GET | `/reports/:id/download` | Returns a short-lived signed URL | 9 |
| GET | `/projects/:id/reports/readiness` | Which requirements are missing 🔒 | 9 |

## Dashboard

| Method | Path | Purpose | Phase |
|--------|------|---------|-------|
| GET | `/dashboard/summary` | Counts: due today, overdue, drafts, reports pending. Derived only. | 8+ |

## Ops

| Method | Path | Purpose | Phase |
|--------|------|---------|-------|
| GET | `/health` | Liveness + DB check | 1 ✅ (skeleton) |
