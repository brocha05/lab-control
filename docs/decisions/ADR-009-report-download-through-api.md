# ADR-009: Serve report PDFs through the API, not pre-signed URLs

- Status: Accepted
- Date: 2026-10-16
- Supersedes: the "short-lived pre-signed URLs" download in `docs/architecture/overview.md`
  and A-51 (storage stays private and S3-compatible, ADR-005)

## Context

Report PDFs live in private storage (S3 or MinIO in production, a local folder in
development and tests). The original plan returned a short-lived pre-signed URL from
`GET /reports/:id/download`. A local folder can't sign URLs, and a signed URL can be
forwarded and used by anyone until it expires.

## Decision

- `GET /reports/:id/pdf` checks the tenant like every other endpoint (404 across labs) and
  streams the file from `ReportStorage` with `Content-Type: application/pdf`.
- `ReportStorage` has two implementations: `LocalReportStorage` (folder, dev/tests) and
  `S3ReportStorage` (S3 or MinIO), selected by `REPORT_STORAGE_DRIVER`.
- File responses (`StreamableFile`) skip the JSON envelope.

## Alternatives

| Option | Why not |
|--------|---------|
| Pre-signed URLs | Needs S3 everywhere (no local mode); a leaked link works until it expires. |
| PDF in a `bytea` column | Bloats the database and its backups; ADR-005 already chose object storage. |

## Consequences

- One code path for every environment; downloads always pass auth and tenancy.
- The API carries the PDF bytes (a few hundred KB per report at the lab's volume, A-50).
  Revisit with pre-signed URLs if large files or heavy traffic appear.
