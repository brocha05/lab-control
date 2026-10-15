# Report Architecture

Decisions: [ADR-005](../decisions/ADR-005-report-snapshots.md) (snapshots),
[ADR-006](../decisions/ADR-006-html-pdf-generation.md) (HTML→PDF).

## Pipeline

```
 Source entities (Postgres)
        │   ReportAssembler<TemplateKey>.assemble(tenantId, projectId)
        ▼
 Report view model (typed DTO, all values final & formatted-ready)
        │   persisted as reports.snapshot (jsonb) + snapshot_schema_version
        ▼
 HTML template  (templates/<key>/template.html + styles.css)
        │   ReportRenderer.render(html) → Playwright page.pdf()
        ▼
 PDF bytes ── sha256 ──▶ reports.content_sha256
        │   ReportStorage.put(key, bytes)  (private bucket)
        ▼
 Object storage  ──(signed URL, minutes)──▶ user download
```

## Components (in `apps/backend/src/reports/`, Phase 9)

| Component | Responsibility | Notes |
|-----------|---------------|-------|
| `ReportsService` | Orchestrates create / generate / finalize. Owns state transitions. | Only writer of `reports` |
| `ReportAssembler` (interface) | Builds the view model for one template key from source data | One implementation per report type. Uses the same domain functions as the Bitácora (no duplicated calculations). |
| `ReportReadiness` (per template) | Lists the missing requirements | 🔒 Q-35 |
| `TemplateRegistry` | `templateKey → { assembler, readiness, templateDir, templateVersion, snapshotSchemaVersion }` | Adding a report = registering one entry |
| `ReportRenderer` (interface) | HTML → PDF bytes | `PlaywrightReportRenderer`. Swappable for Gotenberg or a worker. |
| `ReportStorage` (interface) | put / signed URL | S3 implementation. MinIO locally. |

## Extension point: new report types

```
reports/templates/
  concrete-control/          ← first one, layout 🔒 Q-32
    template.html
    styles.css
    assembler.ts
    readiness.ts
    view-model.ts            ← the snapshot type; bump snapshotSchemaVersion on change
  <future-template>/
```

## Rules

1. **Templates never compute.** Every number, label, and date to print is already in the
   view model (formatted or ready to format with simple helpers).
2. **Render from the snapshot only**, never from live entities.
3. **FINAL is immutable.** No regeneration, no snapshot or PDF overwrite. Corrections
   → new version.
4. **Private storage.** The object key is `tenants/<tenantId>/reports/<reportId>/v<version>.pdf`.
   Downloads go through `GET /reports/:id/download`, which checks the tenant and then
   returns a signed URL valid for ~5 minutes.
5. Templates include a visible version/ID footer. Verification QR/signature: Q-38.

## Known from FPC06-04 (2026-10-14)

- Scope: one field record / sample (A-68). Layout, sections, fixed notes and the
  signature blocks are listed in [../domain/analysis/FPC06-04.md](../domain/analysis/FPC06-04.md).
- Template key `concrete-control`. Portrait letter size, up to 6 specimen columns.
  Unused columns are struck through.
- The view model holds every printed value already formatted, including the
  calculated ones (stress, MPa, %, averages). Rule 1 still applies.

## Unknown (🔒)

Numbering (Q-56), rounding and conversion factors (Q-59, Q-61), signatures (Q-37, Q-38),
readiness (Q-35), more than 6 specimens or several samples per record (Q-71), revisions
(Q-36), and whether partial reports (e.g. 3-day results only) are issued.
