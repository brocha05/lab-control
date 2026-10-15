# ADR-005: Use report snapshots for historical generated reports

- Status: Accepted
- Date: 2026-10-03

## Context

A report issued to a client is a formal, possibly legally relevant document. If a
project name, a test result, or a client address is edited six months later, an
already-issued PDF must not change. Re-rendering from live data could also differ
because of template changes.

## Decision

On generation, the `reports` module:

1. Assembles a **report view model** (DTO) from source data.
2. Stores it as `reports.snapshot` (`jsonb`), together with `template_key`,
   `template_version`, and `snapshot_schema_version`.
3. Renders the PDF **from the snapshot**, not from live data.
4. Stores the PDF in private object storage. Records `storage_key` and a SHA-256
   `content_sha256`.
5. A `FINAL` report is immutable: snapshot, PDF, and checksum never change. Corrections
   create a new `version` row.

Minimal now: one table, one JSON column. No snapshot diffing, no per-field provenance.

## Alternatives

| Option | Why not |
|--------|---------|
| Only store the PDF | The PDF is immutable, but we lose machine-readable data (re-rendering, search, audits, "what changed between v1 and v2"). |
| Re-render from live data on demand | Violates historical fidelity. |
| Temporal/versioned tables for all entities | Much more complex. Solves a broader problem we don't have yet. May be considered if Q-34/Q-54 demand full history. |

## Consequences

- ✅ Issued reports are reproducible and tamper-evident (checksum).
- ✅ Snapshot schema versioning lets templates evolve.
- ⚠️ Snapshot data duplicates source data **by design**. This is the one sanctioned duplication.
- ⚠️ Snapshot JSON shape must be versioned (`snapshot_schema_version`). Old snapshots are never migrated in place.
