# Project Status

Last updated: 2026-10-14 (lab documents analyzed)

| Phase | State |
|-------|-------|
| 0 Domain discovery | 🟡 **First documents analyzed** (2026-10-14). Review with the lab pending (0.5) |
| 1 Architecture + skeleton | ✅ Done (exit criteria met) |
| 2 Core entities + auth | Next. Not blocked on documents |
| 3 Clients / projects | Can start after Phase 2. Fields known (FPC01-01, FPC06-04) |
| 4, 5 Field records, samples, specimens | Structure known and drafted in the schema. 🔒 items: completeness (Q-33), numbering (Q-55, Q-57, Q-58) |
| 6 Test scheduling | Pure logic done (`test-schedule.ts`); reference date confirmed. 🔒 items: age assignment (Q-14, Q-74), holidays/tolerance (Q-21, Q-62) |
| 7 Test results | Readings known and drafted. 🔒 calculations (Q-59 rounding, Q-61 factors) |
| 8 Bitácora | Columns known. 🔒 scope (Q-68) |
| 9 Reports | Layout known; scope = field record. 🔒 numbering (Q-56), readiness (Q-35), signatures (Q-37) |

## Known

- Architecture decisions: ADR-001…007 ([docs/architecture/decisions.md](docs/architecture/decisions.md)).
- Backend skeleton: config validation, pino logging with request IDs, Prisma 7 service,
  global error filter + response envelope, `/api/v1/health`, `@CurrentTenant()`.
- Pure domain code: `CalendarDate` utilities and test-schedule functions, unit-tested.
- **Lab documents analyzed** ([docs/domain/analysis/](docs/domain/analysis/README.md)):
  FPC01-01 field record, FPC01-02 Bitácora, FPC06-01 compression worksheet (3 and 7
  days), FPC06-04 report, plus `docs/general_flow.png`. One real case end to end
  (registro MCH-068).
- Database: first migration (`init`) with the Phase-2 tables. The full domain model from
  the forms (incl. `Delivery`, report scoped per field record) waits in
  `apps/backend/prisma/drafts/domain.prisma`, validated in CI, not migrated.
- Frontend: login, app layout, API client. Backend auth endpoints don't exist yet (Phase 2),
  so login can't succeed end to end.
- CI runs lint, typecheck, unit tests and build for both apps, plus backend integration
  tests against Postgres.

## Assumed

Everything in [docs/domain/assumptions.md](docs/domain/assumptions.md). Confirmed by the
documents: A-03, A-11, A-12, A-40, A-41. Rejected: A-07 (reports are per field record,
not per project). New assumptions A-60…A-75 fill gaps the forms leave open.

## Unknown

[docs/domain/open-questions.md](docs/domain/open-questions.md). Most P0 questions about
content are answered. Still-open P0s: registro/report/sample/specimen numbering (Q-55…Q-58),
calculation rounding and factors (Q-59, Q-61), "edad definitiva" vs test ages (Q-74),
completeness (Q-33), readiness (Q-35), regulatory (Q-52).

Conflicts between documents that the lab must resolve: % resistance rounding (Q-59),
failure type of specimen 407 (Q-60), report number "CON" vs "CTO" (Q-56), obra name
(Q-78).

## Phase 0: what's left

1. **0.5** Review session with the lab: the P0 questions and conflicts above.
2. **0.6** Request the remaining documents: specimen labels, procedures/standards,
   signers, historical spreadsheets, accreditation, a re-issued report, a record with
   several samples.

## Next (not blocked)

1. Phase 2: `GET /me` (2.6). Auth, global guard and the integration-test harness are done.
2. Phase 3: clients and projects CRUD (with contact and location fields) and
   cross-tenant tests, then the app shell (3.5).

## Notes

- 2026-10-14: the source for development-plan 1.2–1.5 was missing from the repository
  (only a compiled `dist/` existed). It was reconstructed from that build output, then
  re-verified (build, lint, typecheck, 40 unit tests).
- 2026-10-14: moved both apps to pnpm 12 and the latest stable libraries (NestJS 12,
  TypeScript 6.0, ESLint 10 in the backend, Next.js 16.4, React 19.3). The backend follows
  the NestJS 12 template for new projects: native ESM and Vitest 5 (instead of Jest). Prisma stays on 7.10
  (8.x is still RC) and TypeScript on 6.0 (tooling doesn't support 7 yet). Remaining
  audit findings are dev-only: `deepmerge-ts` (Prisma CLI, needs a major bump),
  `braces` (Next's ESLint plugin, no patch).
- MinIO no longer publishes community images to Docker Hub. `docker-compose.yml` uses
  `cgr.dev/chainguard/minio`. Revisit when object storage is first used (Phase 9).
- 2026-10-14: first lab documents analyzed. At the owner's request, the model changes
  were applied to the draft schema and docs in the same pass, instead of after a
  separate review (checklist step 13). The lab review (0.5) can still change them.
