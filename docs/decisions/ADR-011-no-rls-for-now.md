# ADR-011: No Postgres row-level security for now; isolation stays in code and tests

- Status: Accepted
- Date: 2026-10-16
- Answers development-plan 10.4 (ADR-002 left RLS as a later option)

## Context

Tenant isolation is explicit (ADR-002): the tenant comes only from the JWT, every query
filters by `tenant_id`, children use composite foreign keys `(parent_id, tenant_id)`,
and cross-tenant access answers 404. Since 10.3 one integration test calls every route
that takes an id with another lab's ids and expects 404, besides the per-module tests.

Row-level security would add a second wall in the database: each request sets
`app.tenant_id` on its connection and policies filter every table.

## Decision

Don't enable RLS yet. Keep isolation in the services, the composite keys and the tests.

## Why

- One laboratory today (A-50), a single application role, no direct database access by
  users or other services: the code path is the only path to the data.
- With Prisma's driver adapter and a connection pool, setting the tenant per request
  needs every query inside a transaction that runs `set_config` first; a missed wrapper
  fails open or breaks queries, and the composed read models (Bitácora, worksheet) would
  need the same care.
- The composite foreign keys already make a cross-tenant parent/child row impossible to
  write, and the exhaustive suite catches a missing `tenant_id` filter on read.

## Revisit when

- a second lab goes live, or anyone gets direct SQL / BI access to the database, or
- a reporting replica or another service reads the same tables.

Then: a spike with `set_config('app.tenant_id', …, true)` inside Prisma interactive
transactions, policies on every tenant table, and the same cross-tenant suite as proof.
