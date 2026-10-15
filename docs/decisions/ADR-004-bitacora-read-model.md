# ADR-004: Treat the Bitácora as a derived read model

- Status: Accepted
- Date: 2026-10-03

## Context

The lab's Bitácora is a consolidated log combining project, field records, samples,
specimens, and tests. Today it's probably a spreadsheet maintained by hand. Storing it
as its own table (`project_name`, `client_name`, `pour_date`, `test_date`, …) would
duplicate data that already exists in normalized entities, and the copies would drift.

## Decision

- There is **no `bitacora` table**.
- The `bitacora` module is **read-only**. It runs a composed query (Prisma `include` or
  a SQL view/raw query when needed) over the source entities and returns a view model.
- Derived columns (scheduled dates, ages, due status, and later calculated values) are
  computed at read time by the same domain functions the rest of the system uses.
- The exact Bitácora columns are **TBD** until the official Bitácora is analyzed (Q-27).

## Alternatives

| Option | Why not |
|--------|---------|
| Bitácora table written alongside source data | Two sources of truth that drift; every edit must update both. |
| Materialized view | Possible later for performance. Not needed at A-50 scale. If adopted, document it here as a deliberate denormalization with its refresh strategy. |
| Event-sourced projection | Over-engineering for this scale (see "avoid premature event-driven architecture"). |

## Consequences

- ✅ Always consistent with source data. Corrections show up immediately.
- ✅ No sync code.
- ⚠️ Query cost grows with project size. Mitigate with indexes and pagination. Escalate to a materialized view only with measured need.
- ↪ Historical fidelity (what the Bitácora looked like when a report was issued) is provided by **report snapshots** (ADR-005), not by storing the Bitácora.
