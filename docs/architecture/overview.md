# Architecture Overview

## Summary

A **modular monolith** (NestJS) behind a **Next.js** frontend, with **PostgreSQL** as
the single source of truth, **S3-compatible storage** for generated PDFs and future
attachments, and **HTML→PDF** rendering through Playwright. It's multi-tenant from day
one (shared database, `tenant_id` column).

```
 Browser (desktop / tablet / phone)
    │  HTTPS
    ▼
 Next.js (App Router)  ── UI only, no business logic, talks to the API with a JWT
    │  REST/JSON
    ▼
 NestJS modular monolith
    ├── auth · tenants · users              identity & tenancy
    ├── clients · projects                  who/what the work is for
    ├── field-records                       field capture (records, deliveries, samples, specimens)
    ├── specimen-tests                      planning, scheduling, results
    ├── bitacora                            READ-ONLY composed view
    ├── reports                             snapshot → HTML → PDF → storage
    └── shared                              prisma, tenancy, dates, errors, config, logging
    │
    ├──▶ PostgreSQL       (all source-of-truth data + report snapshots)
    ├──▶ Object storage   (PDFs; private; signed URLs)
    └──▶ (optional, later) queue → worker   (only if PDF generation gets slow)
```

## Key decisions (see [decisions.md](decisions.md))

| # | Decision |
|---|----------|
| ADR-001 | Modular monolith, not microservices |
| ADR-002 | Shared PostgreSQL + `tenant_id`, with explicit tenant scoping in every query |
| ADR-003 | PostgreSQL as the primary database |
| ADR-004 | Bitácora is a derived read model, not a table |
| ADR-005 | Generated reports are snapshotted historical artifacts |
| ADR-006 | PDFs rendered from HTML/CSS templates with Playwright |
| ADR-007 | Prisma as ORM; same stack as the team's existing boilerplates |

## Module boundaries

A module owns its tables. Other modules may **read** them only through that module's
exported service (or, for the read-only `bitacora` and `reports` modules, through
explicit read queries documented in that module). Nobody **writes** another module's
tables.

| Module | Owns tables | Depends on | Notes |
|--------|-------------|-----------|-------|
| `auth` | refresh tokens | users, tenants | JWT access + refresh. Port from boilerplate. |
| `tenants` | `tenants` | — | Minimal. Admin-provisioned for now. |
| `users` | `users` | tenants | |
| `clients` | `clients` | — | |
| `projects` | `projects`, `project_test_configurations` | clients | Test configuration lives here [A-10]. |
| `field-records` | `field_records`, `deliveries`, `samples`, `specimens` | projects | Deliveries, samples and specimens are part of the field-record aggregate (they're captured together on FPC01-01). Split into separate modules only if they gain their own workflows. |
| `specimen-tests` | `specimen_tests` | projects (config), field-records (reference date) | Scheduling logic is pure and unit-tested. |
| `bitacora` | — (none) | reads all of the above | Query-only. See ADR-004. |
| `reports` | `reports` | bitacora (data), storage | See [../reports/architecture.md](../reports/architecture.md). |
| `shared` | — | — | Infrastructure only. No domain logic. |

> The brief proposed separate `samples/` and `specimens/` modules. We merged them into
> `field-records` because (a) they're created on the same form, (b) separate modules
> with no independent behaviour are "modules for the sake of modules". Revisit after
> Q-10/Q-12 if samples or specimens turn out to have their own lifecycle.

## Cross-cutting concerns

| Concern | Approach |
|---------|----------|
| Validation | `class-validator` DTOs + global `ValidationPipe({ whitelist, forbidNonWhitelisted, transform })` |
| Errors | One global exception filter → `{ success:false, error:{code,message,details}, meta:{requestId} }` |
| Responses | Response interceptor → `{ success:true, data, meta:{requestId} }` (same as boilerplates) |
| Logging | `nestjs-pino`, JSON logs, request ID correlation. Never log request bodies by default. |
| Config | `@nestjs/config` + validated env schema. Fail fast on boot. `.env.example` committed, `.env` never. |
| Dates | Domain dates are **date-only** `CalendarDate` (`YYYY-MM-DD`) values, stored as `DATE`. Timestamps are `timestamptz`, UTC. "Today" is computed in the tenant's timezone [A-14]. |
| Migrations | `prisma migrate`. Every schema change is a reviewed migration. No `db push` outside local experiments. |
| Testing | Unit tests for pure domain logic (scheduling, transitions, calculations). Integration tests for tenant isolation against a real Postgres. |

## Security & auditability

- **Authentication:** JWT access token (short-lived) + rotating refresh token. Ported
  from the existing boilerplate.
- **Authorization:** role guard (roles TBD, Q-39/Q-40) + **tenant scoping** on every
  query ([multi-tenancy.md](multi-tenancy.md)).
- **Files:** private bucket. Downloads only through short-lived pre-signed URLs issued
  after a tenant-scoped lookup of the `Report` row.
- **Secrets:** environment variables or a secret manager only.
- **Audit:** from Phase 2, tenant-owned tables have `created_at`, `updated_at`, and
  (where meaningful) `created_by_id`. A proper `audit_events` table (who, what entity,
  before/after, when) is planned for Phase 10. Its exact shape depends on Q-54. Finalized
  reports are already immutable by design.

## What is intentionally NOT here

Microservices, event bus/CQRS frameworks, generic `BaseRepository`/`CrudService`,
GraphQL, offline sync, Redis (add only when a concrete need such as rate-limiting or a
queue appears), and Row Level Security (documented as a later hardening step).
