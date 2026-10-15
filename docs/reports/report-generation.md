# Report Generation (operational flow)

## Sequence

```
User              API (ReportsService)          Assembler      Renderer     Storage     DB
 │ POST /field-records/:id/reports {templateKey}
 │────────────────▶│
 │                 │ load record + project (tenant-scoped) ────────────────────────▶│
 │                 │ readiness.check() → missing[]  🔒 Q-35
 │                 │   if missing → 422 { missing }
 │                 │ insert Report(DRAFT, version = max+1) ─────────────────────────▶│
 │                 │ assemble() ───────────▶│
 │                 │◀────── viewModel ──────│
 │                 │ html = template(viewModel)
 │                 │ pdf = render(html) ─────────────────▶│
 │                 │ sha = sha256(pdf)
 │                 │ put(key, pdf) ───────────────────────────────────▶│
 │                 │ update Report(GENERATED, snapshot, key, sha) ──────────────────▶│
 │◀── 201 report ──│
```

Failure handling:

- If rendering or upload fails, the report stays `DRAFT`, the error is logged with the
  request ID, and the API returns 500. Retry with `POST /reports/:id/regenerate`.
- The row update to `GENERATED` happens **after** the upload succeeds. An orphaned
  object (upload OK, DB update failed) is harmless and can be swept later.

## Versioning

- `version` increments per `(tenant, fieldRecord, templateKey)` (scope A-68).
- Regenerating a non-final report overwrites its snapshot/PDF **in place** (same
  version).
- After `FINAL`, a correction is a **new** report (version + 1). Whether the old one is
  marked "superseded" on the new PDF is Q-36.

## Performance & async

- Expected: one PDF of a few pages, rendered in under 2 s with a warm browser.
  Keep one shared Chromium instance per process. Open a new context per render.
- Timeout: 30 s per render.
- If renders get slow or start to pile up: introduce `report-generation` jobs (SQS or
  Postgres-backed queue) and a worker process **running the same codebase** with a
  different entry point. API returns `202` and the report is `DRAFT` until done. That
  is when the `FAILED` status gets added.

## Local development

- `docker compose up` starts Postgres + MinIO.
- Template preview (Phase 9): a dev-only endpoint that renders the HTML of a stored
  snapshot without creating a PDF, for fast CSS iteration.

## Testing

- Unit: assembler output for fixture data (snapshot test of the view model).
- Unit: readiness rules (once known).
- Integration: generate → GENERATED, checksum stored, object exists, finalize, then
  regeneration rejected (409).
- Visual: manual comparison against the official PDF during Phase 9 sign-off.
