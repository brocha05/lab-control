# ADR-003: PostgreSQL as the primary relational database

- Status: Accepted
- Date: 2026-10-03

## Context

The data is strongly relational (client → project → record → sample → specimen →
test), needs transactional consistency, needs date arithmetic for scheduling, and needs
flexible storage for report snapshots. The team already runs PostgreSQL in other
products.

## Decision

Use PostgreSQL (16+) as the single system of record. Use:

- `DATE` for domain calendar dates and `timestamptz` for instants
- `jsonb` **only** for report snapshots (and other documented, opaque payloads), never as
  a substitute for modelling known domain fields
- native enums (through Prisma) for lifecycle states

## Alternatives

| Option | Why not |
|--------|---------|
| MySQL/MariaDB | Viable, but weaker JSON and date support, no RLS, and the team's existing stack is Postgres. |
| MongoDB / document DB | The domain is relational and consistency-sensitive. Unknown fields are not a reason to go schemaless: we will learn them. |
| SQLite | Not suitable for a multi-user hosted service. |

## Consequences

- ✅ Strong consistency, foreign keys, composite keys for tenant safety, RLS available later.
- ✅ Managed offerings everywhere (RDS, Cloud SQL, Neon, Supabase…).
- ⚠️ The temptation to put unknown domain fields in `jsonb` "for flexibility". **Rejected**: domain fields become real columns after document analysis.
