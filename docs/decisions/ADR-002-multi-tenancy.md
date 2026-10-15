# ADR-002: Shared PostgreSQL with `tenant_id` for multi-tenancy

- Status: Accepted
- Date: 2026-10-03

## Context

The first deployment has one tenant (one laboratory), but the product must support
several without a rewrite. Tenant isolation is a hard requirement: a lab must never see
another lab's clients, projects, or results.

## Decision

- One database, one schema. Every tenant-owned table has `tenant_id UUID NOT NULL`,
  including deep children (samples, specimens, tests).
- The tenant ID comes **only** from the authenticated user (JWT claim). It's never read
  from URLs or bodies.
- Every service method takes `tenantId` explicitly and includes it in every query.
  Cross-tenant lookups return 404.
- Parent/child tenant consistency is enforced with **composite foreign keys**
  `(parent_id, tenant_id) → parent(id, tenant_id)`.
- PostgreSQL Row Level Security is **deferred** to Phase 10 as defence in depth.

Details: [../architecture/multi-tenancy.md](../architecture/multi-tenancy.md).

## Alternatives

| Option | Why not (now) |
|--------|---------------|
| Database per tenant | Strongest isolation, but per-tenant migrations, connections, and backups are excessive for 1–5 tenants. |
| Schema per tenant | Same migration fan-out problem. Prisma support is awkward. |
| Automatic scoping via Prisma extension / AsyncLocalStorage | Less boilerplate, but invisible in review and silently bypassed by raw SQL or some nested operations. May be revisited, together with RLS. |
| RLS from day one | Good defence in depth, but adds connection/session handling complexity before there's a second tenant. Planned for Phase 10. |

## Consequences

- ✅ Simple operations: one migration, one backup, one connection pool.
- ✅ Composite FKs make cross-tenant links impossible at the database level.
- ⚠️ Isolation of *reads* depends on developer discipline until RLS is enabled. Mitigated by code review and per-module cross-tenant integration tests.
- ⚠️ Every query needs `tenant_id` indexes (always the leading column in composite indexes).
- ↪ Moving one large tenant to its own database later is still possible (all rows are tagged).
