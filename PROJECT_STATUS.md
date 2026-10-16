# Project Status

Last updated: 2026-10-16 (dashboard summary, 8.4)

| Phase | State |
|-------|-------|
| 0 Domain discovery | ✅ Documents analyzed (2026-10-14) and questionnaire answered (2026-10-15). Follow-ups Q-79 … Q-86 open |
| 1 Architecture + skeleton | ✅ Done |
| 2 Core entities + auth | ✅ Done: migrations, tenant CLI, auth, global guard, `/me`, integration tests |
| 3 Clients / projects | ✅ Done: API with cross-tenant tests, screens, app shell; client/project codes for report numbers |
| 4, 5 Field records, samples, specimens | ✅ Done: catalogs + holidays, migration, API (create, nested save, complete/cancel, cancel specimen), transcription screen. Front numbering (Q-79) open |
| 6 Test scheduling | ✅ Done (2026-10-16): project default ages, tests planned on completion, pending list with Sunday/holiday shift, per-test age changes, screens |
| 7 Test results | ✅ Done (2026-10-16): FPC06-01 worksheet per project and date, results saved per sheet and derived on read (ADR-008), printable sheet. Test time, corrections and scope assumed (A-83 … A-91) |
| 8 Bitácora | ✅ Done (2026-10-16): per-project read model, screen, print, Excel export (a tab per project). Dashboard counts endpoint (8.4). Historical import (8.5) left out of the MVP |
| 9 Reports | ✅ Done (2026-10-16): FPC06-04 PDF per record, frozen snapshot + SHA-256, versions with the same number, issue by the Jefe de Control de Calidad. Open: scanned signatures (Q-101), partial reports (Q-82) |
| 10 Hardening | ✅ Done (2026-10-16): permissions per role + staff accounts, audit trail (ADR-010) with history screens, security headers, sign-in rate limit, exhaustive cross-tenant suite, no RLS for now (ADR-011) |

## Known

- Architecture decisions: ADR-001…007 ([docs/architecture/decisions.md](docs/architecture/decisions.md)).
- Backend skeleton: config validation, pino logging with request IDs, Prisma 7 service,
  global error filter + response envelope, `/api/v1/health`, `@CurrentTenant()`.
- Domain analysis ([docs/domain/analysis/](docs/domain/analysis/README.md)): FPC01-01,
  FPC01-02, FPC06-01, FPC06-04, the process diagram, and the lab's questionnaire answers
  (numbering, formulas, scheduling, roles, regulatory). The answered Word file stays out
  of git.
- Database: migrations `init`, `refresh_tokens`, `client_project_codes`, `lab_roles`. The
  rest of the model waits in `apps/backend/prisma/drafts/domain.prisma`, validated in CI.
- Pure domain code with tests: `CalendarDate`/`TimeOfDay`, test scheduling
  (`test-schedule.ts`), age tolerance (`age-tolerance.ts`), compressive-strength
  calculations (`compression.ts`, vectors from the MCH-068 worksheets).
- Auth: login / refresh (rotating, reuse detection) / logout, global JWT guard, `GET /me`.
  Roles: Jefe de Control de Calidad, Coordinador del SGC, Jefe de Laboratorio, Jefe de
  Brigada de Campo. Labs are created with `pnpm cli:create-tenant`.
- Clients and projects (with 3–4 letter codes): API and screens.
- Frontend: the "Laboratorio" visual design (`docs/design/README.md`, 2026-10-16): app
  shell with breadcrumbs and project picker, dashboard, clients, projects with tabs
  (summary, records, tests, configuration), field records as a 5-step wizard, pending
  tests. Sections of later phases show "disponible próximamente".
- CI runs lint, typecheck, unit tests and build for both apps, plus backend integration
  tests against Postgres.
- Regulatory: accredited under NMX-EC-17025-ONNCCE-2018 (ema); records kept 4 years; an
  audit trail of changes is required.

## Assumed

[docs/domain/assumptions.md](docs/domain/assumptions.md). Most structural assumptions
are now confirmed. Rejected by the lab: A-07, A-13, A-33, A-69, A-71. Open gaps: A-76 …
A-81 (codes, MPa input, holidays, fronts, averages, user admin).

## Unknown

[docs/domain/open-questions.md](docs/domain/open-questions.md), section 9: front
numbering (Q-79), MPa input and average decimals (Q-80), holidays (Q-81), partial-report
numbering (Q-82), who manages users (Q-83), tolerance for unlisted ages (Q-84), the
historical Excel (Q-85), age printed after a Sunday shift (Q-86).

## Next

1. Ask the lab for Q-79 … Q-103 (section 9 of the questionnaire); adjust the permission matrix and assumptions.
2. Signatures on the report once the lab sends them (Q-101).
3. Phase 11 (production) once hosting is decided. After the MVP: 8.5 historical import (Q-85).

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
- 2026-10-15: the lab answered the questionnaire. Recorded in the docs, the draft model
  updated, and code added for client/project codes, real roles, scheduling rules, age
  tolerance and the strength calculations.
