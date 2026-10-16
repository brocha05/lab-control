# Project Status

Last updated: 2026-10-15 (lab questionnaire answered)

| Phase | State |
|-------|-------|
| 0 Domain discovery | ✅ Documents analyzed (2026-10-14) and questionnaire answered (2026-10-15). Follow-ups Q-79 … Q-86 open |
| 1 Architecture + skeleton | ✅ Done |
| 2 Core entities + auth | ✅ Done: migrations, tenant CLI, auth, global guard, `/me`, integration tests |
| 3 Clients / projects | ✅ Done: API with cross-tenant tests, screens, app shell; client/project codes for report numbers |
| 4, 5 Field records, samples, specimens | ✅ Done (2026-10-15): catalogs + holidays, migration, API (create, nested save, complete/cancel), transcription screen. Front numbering (Q-79) open; 5.4 (cancel one specimen) pending |
| 6 Test scheduling | **Next.** Rules implemented (Sunday/holiday shift, ascending assignment, age tolerance). Migration of `specimen_tests`, planning on completion, pending list |
| 7 Test results | Formulas implemented and checked against the lab's worksheets. Endpoints/UI pending |
| 8 Bitácora | Columns and scope (per project) known |
| 9 Reports | Layout, numbering, versions, signatures known. Partial-report numbering open (Q-82) |
| 10 Hardening | Real roles migrated; permissions and the **required** audit trail (Q-54) pending |

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
- Frontend: login, app shell with every section (pending ones show "disponible
  próximamente"), clients and projects screens, dashboard counts.
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

1. Phase 6: migrate `specimen_tests`, plan tests when a record is completed (project
   default ages, ascending assignment, Sunday/holiday shift), pending-tests list.
2. Phase 7: test entry screen per test date using `compression.ts`.
3. Ask the lab for Q-79 … Q-86 and the historical Excel.

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
