# Architecture Decisions Index

Full ADRs live in [../decisions/](../decisions/). Template: Context · Decision ·
Alternatives · Consequences. To change a decision, write a new ADR that supersedes the
old one. Don't rewrite history.

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-001](../decisions/ADR-001-modular-monolith.md) | Modular monolith instead of microservices | Accepted |
| [ADR-002](../decisions/ADR-002-multi-tenancy.md) | Shared PostgreSQL with `tenant_id` for multi-tenancy | Accepted |
| [ADR-003](../decisions/ADR-003-postgresql.md) | PostgreSQL as primary relational database | Accepted |
| [ADR-004](../decisions/ADR-004-bitacora-read-model.md) | Bitácora as a derived read model | Accepted |
| [ADR-005](../decisions/ADR-005-report-snapshots.md) | Report snapshots for historical reports | Accepted |
| [ADR-006](../decisions/ADR-006-html-pdf-generation.md) | Generate PDFs from HTML/CSS templates | Accepted |
| [ADR-007](../decisions/ADR-007-prisma-orm.md) | Prisma as ORM | Accepted |

> Note: the original brief listed ADR-003/004 under two different numberings. This
> project uses the numbering from the brief's §14 (the one above).

## Decisions deferred (record an ADR when made)

- Whether to enable PostgreSQL Row Level Security (Phase 10).
- Whether to move PDF generation to a queue + worker (only if it becomes slow).
- Offline/PWA strategy for field capture (Phase 12).
- How to model additional materials (soil, asphalt): see [../roadmap/future.md](../roadmap/future.md).
- Audit trail storage design (Phase 10, depends on Q-54).
