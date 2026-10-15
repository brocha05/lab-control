# Project Status

Last updated: 2026-10-14

| Phase | State |
|-------|-------|
| 0 Domain discovery | ⛔ **Not started.** No lab documents received yet (see below) |
| 1 Architecture + skeleton | ✅ Done (exit criteria met) |
| 2 Core entities + auth | Next. Not blocked on documents |
| 3 Clients / projects | Can start after Phase 2 (extra fields wait for Q-41) |
| 4, 5, 7, 8, 9 | 🔒 Blocked on lab documents. Do **not** start |
| 6 Test scheduling | Pure logic done (`test-schedule.ts`). The rest is partly blocked (Q-18…Q-23) |

## Known

- Architecture decisions: ADR-001…007 ([docs/architecture/decisions.md](docs/architecture/decisions.md)).
- Backend skeleton: config validation, pino logging with request IDs, Prisma 7 service,
  global error filter + response envelope, `/api/v1/health`, `@CurrentTenant()`.
- Pure domain code: `CalendarDate` utilities and test-schedule functions, unit-tested.
- Draft Prisma schema: identity, ownership, tenancy, lifecycle. **Validated, not migrated.**
- Frontend: login, app layout, API client. Backend auth endpoints don't exist yet (Phase 2),
  so login can't succeed end to end.
- CI runs lint, typecheck, unit tests and build for both apps.

## Assumed

Everything in [docs/domain/assumptions.md](docs/domain/assumptions.md) (A-01…A-52). All
are `OPEN`. None has been confirmed against an official document.

## Unknown

All questions in [docs/domain/open-questions.md](docs/domain/open-questions.md) are
unanswered, including every **P0** question. Field-record content, sample/specimen
content, test measurements and formulas, Bitácora columns, and report layout are unknown.

## Blocked: Phase 0 (needs the laboratory)

Phase 0 can't be done in code. It needs, in order:

1. **0.1** Send the document request list to the lab
   ([discovery-checklist.md §3](docs/domain/discovery-checklist.md#3-documents-to-request-from-the-laboratory)).
2. **0.2** Schedule the end-to-end walkthrough interview (§4).
3. **0.3** For each document received: register it and write `docs/domain/analysis/<doc>.md`.
4. **0.4** Update assumptions / open questions. Write the proposed model changes.
5. **0.5** Review session, then update entities / schema / lifecycle.

Exit criterion: every P0 question answered and the analyses written.

## Next (not blocked)

1. Phase 2: reduce the schema to Phase-2 tables and create the first migration (2.1), seed
   (2.2), port auth from `saas-backend-boilerplate` (2.3–2.4), integration-test harness
   with two tenants (2.5), `GET /me` (2.6).
2. Phase 3: clients and projects CRUD with cross-tenant tests, then the app shell (3.5).

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
