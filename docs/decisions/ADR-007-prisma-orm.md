# ADR-007: Prisma as ORM

- Status: Accepted
- Date: 2026-10-03

## Context

The brief allows Prisma or Drizzle. The team's existing products and boilerplates
(`fixpilot`, `boilerplate-backend-core`) use NestJS 11 + Prisma 7 + PostgreSQL, with
established patterns for PrismaService, migrations, and seeds.

## Decision

Use Prisma 7 (with the `@prisma/adapter-pg` driver adapter) and `prisma migrate` for
migrations. Raw SQL (`$queryRaw` with tagged templates) is allowed for read-heavy
queries (Bitácora, pending tests) when Prisma's query API is awkward. Those queries must
still filter by `tenant_id`.

## Alternatives

| Option | Why not |
|--------|---------|
| Drizzle | Excellent SQL-first ergonomics and likely friendlier to RLS/session variables. But it's a new pattern for the team and gives no decisive advantage at this scale. Reconsider if RLS (Phase 10) proves awkward with Prisma. |
| TypeORM | Weaker type safety. The team doesn't use it. |
| Knex/raw SQL | Loses generated types and the migration workflow. |

## Consequences

- ✅ Reuse of boilerplate code (auth, PrismaService, filters).
- ✅ Typed queries and a mature migration workflow.
- ⚠️ Composite-FK tenant relations make the Prisma schema more verbose (accepted).
- ⚠️ RLS with Prisma needs a per-transaction `set_config('app.tenant_id', …)` pattern (spike in Phase 10).
