# Development Plan — small executable tasks

Each task should fit in a single PR (≤ ~1 day). ✅ = done in the bootstrap. 🔒 = blocked
on lab documents (do not start). Every task that touches tenant data includes a
cross-tenant test.

## Phase 0 — Domain discovery (owner: product + lab)

- [x] 0.1 ✅ Send the document request list ([discovery-checklist.md §3](../domain/discovery-checklist.md#3-documents-to-request-from-the-laboratory)) to the lab
- [ ] 0.2 Schedule the end-to-end walkthrough interview (§4)
- [x] 0.3 ✅ For each document received: run the checklist and write `docs/domain/analysis/<doc>.md` (2026-10-14: FPC01-01, FPC01-02, FPC06-01, FPC06-04)
- [x] 0.4 ✅ Update assumptions / open-questions. "Proposed model changes": [analysis/README.md](../domain/analysis/README.md)
- [x] 0.5 ✅ Questionnaire answered by the lab (2026-10-15): conflicts resolved, numbering, formulas, scheduling, roles. [analysis/questionnaire-2026-10-15.md](../domain/analysis/questionnaire-2026-10-15.md)
- [ ] 0.7 Follow-up questions Q-79 … Q-86 (front numbering, MPa input, holidays, partial reports, user admin, unlisted tolerances, historical Excel, age after a Sunday shift)
- [ ] 0.6 Request the remaining documents: the historical Excel (Q-53), one record with several samples, one corrected report, 14/28-day examples, specimen labels, procedures ([checklist §3](../domain/discovery-checklist.md#3-documents-to-request-from-the-laboratory))

## Phase 1 — Architecture & skeleton

- [x] 1.1 ✅ Documentation structure, ADRs, assumptions, open questions
- [x] 1.2 ✅ Backend skeleton: NestJS strict TS, config validation, pino logging, Prisma service, error filter + response interceptor, `/health`
- [x] 1.3 ✅ `CalendarDate` utilities + pure test-schedule functions with unit tests
- [x] 1.4 ✅ Draft Prisma schema (validated, not migrated)
- [x] 1.5 ✅ `docker-compose.yml` (Postgres + MinIO)

> 2026-10-14: the source for 1.2–1.5 was missing from the repository (only a compiled
> `dist/` was present). It was reconstructed from that build output and re-verified.
- [x] 1.6 ✅ Bootstrap `apps/frontend` from `boilerplate-frontend` (`saas-frontend-boilerplate`). Removed billing/subscription, admin, company selector, files, usage, users, register/password-reset pages. Kept auth (login only, no self-signup), API client (unwraps the envelope, refresh on 401, no tenant header), layout. UI in Spanish (A-40)
- [x] 1.7 ✅ ESLint + Prettier config for the backend (from the boilerplate, with the `no-unsafe-*` and `no-explicit-any` rules kept on)
- [x] 1.8 ✅ CI: `.github/workflows/ci.yml` (GitHub Actions). Backend: prisma validate/generate, format check, lint, typecheck, unit tests, build. Frontend: format check, lint, typecheck, build
- [x] 1.9 ✅ Node **24 LTS** (`.nvmrc`, `engines.node >= 24`). Meets Prisma 7's ≥ 22 recommendation with the longest support window. Package manager: **pnpm 12** (one standalone project per app)

## Phase 2 — Core entities & auth (structure only)

- [x] 2.1 ✅ Reduce `schema.prisma` to Phase-2 tables (tenants, users, clients, projects, project_test_configurations). Create the first migration. The full domain model stays in `prisma/drafts/domain.prisma`
- [x] 2.2 ✅ Seed / CLI: create tenant + admin user (`pnpm cli:create-tenant`, see README). Passwords hashed with Node scrypt (`src/auth/domain/password.ts`), no native dependency
- [x] 2.3 ✅ Auth ported from the boilerplate and simplified: login, refresh (rotation + reuse detection), logout, access-token verification. JWT carries `sub`, `tenantId`, `role`. Only `@nestjs/jwt` (no passport). Refresh tokens stored hashed (migration `refresh_tokens`)
- [x] 2.4 ✅ Global JWT guard (`APP_GUARD`) + `@Public()` (auth endpoints, `/health`). `@CurrentTenant()` reads from `request.user`
- [x] 2.5 ✅ Integration-test harness: `pnpm test:int` (`*.int-spec.ts`), `<db>_test` database created + migrated automatically, `truncateAll()`, `createTwoTenants()`. First suites: auth, create-tenant. CI job `backend-integration` with a Postgres service
- [x] 2.6 ✅ `GET /me` (user + tenant), with integration tests: forged/expired tokens, cross-tenant claims, deactivated user

## Phase 3 — Clients & projects

- [x] 3.1 ✅ `clients` module: list (paginated, search)/create/get/update (tenant-scoped) + cross-tenant tests. Shared `ListQueryDto` / `paginated()` in `src/shared/http/pagination.ts`
- [x] 3.2 ✅ `projects` module: list (search, `clientId` filter)/create/get/update. Client must belong to the tenant (composite FK + `ClientsService.assertExists`); client names via `ClientsService.namesByIds` (no cross-module table reads)
- [x] 3.3 ✅ Frontend: clients list (search, pagination)/detail/form (create in a modal, edit on the detail page). Shared `Table`, `Pagination`, `SearchInput`, `FormField`, `useListState`
- [x] 3.4 ✅ Frontend: projects list (search, client filter)/detail/form, `ClientSelect`, and the client page lists its projects with "Nuevo proyecto" pre-selecting the client
- [x] 3.5 ✅ Frontend: app shell with sections Dashboard (client/project counts), Clients, Projects, Field Records, Bitácora, Pending Tests, Reports ("disponible próximamente" pages via `UpcomingSection` for blocked sections)

## Phase 4 — Field records (FPC01-01 + questionnaire; 🔒 item: Q-79)

- [x] 4.0 ✅ `catalogs` module: `concrete_suppliers` / `cement_types` (pick or add, names unique ignoring case, Q-06) and `holidays` (Q-21, Q-81): migration, endpoints, cross-tenant tests, "Configuración" screen
- [x] 4.1 ✅ Migration `field_records`: `field_records`, `deliveries`, `samples`, `specimens` (also 5.1) with per-project unique numbers and positive CHECKs; ticket values per delivery (Q-65)
- [ ] 4.2 `field-records` module: create DRAFT, get, list by project, nested `PUT` (header + deliveries + samples + specimens) while DRAFT
- [ ] 4.3 Transition rules as a pure function + tests. `complete`/`cancel` endpoints
- [ ] 4.4 Completeness rule: everything filled in on the lab's example + visto bueno (Q-33, Q-73)
- [ ] 4.5 Frontend: **desktop-first** transcription form (records are filled on paper first, Q-49), mirroring FPC01-01's sections (header, datos de proyecto, condiciones, trazabilidad, entregas with their remisión data, especímenes, masa unitaria/aire, elementos, observaciones, visto bueno)
- [ ] 4.6 Registro number: propose the project's next `registry_sequence`, editable, unique per project (Q-55; per front 🔒 Q-79)

## Phase 5 — Samples & specimens (structure and numbering known)

- [x] 5.1 ✅ Migrated with 4.1
- [ ] 5.2 Add/edit samples and specimens within a DRAFT record
- [ ] 5.3 Sample and specimen numbers: consecutive per project, proposed automatically, editable (Q-57, Q-58); molds paired by position (A-62)
- [ ] 5.4 Cancel specimen (cascades to open tests)

## Phase 6 — Test scheduling (rules known)

- [ ] 6.1 Project default test ages: endpoints + UI (validate `ageDays > 0`, `specimenCount > 0`, unique ages; no closed list, Q-19)
- [x] 6.2 ✅ Scheduling rules in `test-schedule.ts`: pour date + age, Sunday/holiday shift unless `keepExactDate` (Q-21); `age-tolerance.ts` per NMX-C-083 (Q-62). Open: Q-81, Q-84, Q-86
- [x] 6.3 ✅ `assignSpecimensToAges`: ascending specimen numbers → ascending ages (Q-14)
- [ ] 6.4 `planTestsForFieldRecord` on completion (single transaction with the status change)
- [ ] 6.4b `PATCH /tests/:id/schedule`: change a test's age / exact-date flag until it is tested (Q-22)
- [ ] 6.5 `GET /tests/pending` with derived `scheduledDate` + `dueStatus` (today in tenant TZ)
- [ ] 6.6 Frontend: pending tests page (overdue / today / upcoming)

## Phase 7 — Test results (readings and formulas known)

- [ ] 7.1 Migration for the `specimen_tests` reading columns, incl. `test_time` (drafted)
- [x] 7.2 ✅ Calculation functions in `compression.ts` (area, N, stress, MPa, %, averages, rate, unit weight), confirmed by the lab (Q-26, Q-59, Q-61); the MCH-068 worksheets (specimens 389–408) are the test vectors. Open: Q-80 (MPa input, average decimals)
- [ ] 7.3 Start / complete / cancel endpoints
- [ ] 7.4 Frontend: test entry screen per project + test date, laid out like FPC06-01 (derived actual age, age tolerance, load-time spot check 1 in 10, Q-63). Printable worksheet, kept signed on paper (Q-69)
- [ ] 7.5 Decide (ADR) whether calculated values are stored for audit or computed on read

## Phase 8 — Bitácora (columns and scope known)

- [ ] 8.1 `bitacora` module: tenant-scoped composed query **per project** (one tab per project, Q-68), one row per specimen with the FPC01-02 columns; slump shows both readings (Q-66)
- [ ] 8.2 Frontend: Bitácora table (per project), print-friendly
- [ ] 8.3 Excel export (the lab works in Excel today, Q-68)
- [ ] 8.5 Import the historical Excel (July 2025 → 2026, Q-53) once the file arrives (Q-85)
- [ ] 8.4 Dashboard summary counts

## Phase 9 — PDF reports (layout and rules known; 🔒 item: Q-82)

- [ ] 9.1 `ReportStorage` (S3/MinIO) + signed URL download
- [ ] 9.2 `ReportRenderer` (Playwright, shared browser, timeout)
- [ ] 9.3 Reports module (scope: field record): create/generate/regenerate/finalize (QUALITY_MANAGER only, Q-40), corrections as new versions with the same number + `superseded_at` (Q-36), partial reports (Q-35), checksum
- [ ] 9.4 `concrete-control` view model + assembler: report number (Q-56), one page per sample and a second page above 6 specimens (Q-71), values from `compression.ts`, failure type from the test (Q-60), out-of-tolerance note (Q-23), report-time fields prefilled from the project (Q-64)
- [ ] 9.5 `concrete-control` HTML/CSS template matching FPC06-04; scanned signatures of Jefe de Laboratorio and Jefe de Control de Calidad, Technical Signatory (Q-37)
- [ ] 9.6 Frontend: report list/generate/download per project

## Phase 10 — Hardening

- [ ] 10.1 Permissions per role (roles migrated 2026-10-15; matrix in [entities.md](../domain/entities.md#roles)) and user management screens (A-81, Q-83)
- [ ] 10.2 `audit_events`: **required** by the accreditation (Q-54). ADR for its shape; move earlier if corrections after issuing (Q-34) ship first
- [ ] 10.3 Exhaustive cross-tenant test suite (every endpoint)
- [ ] 10.4 RLS spike + ADR (enable or not)
- [ ] 10.5 Rate limiting, security headers, dependency audit

## Phase 11 — Production

- [ ] 11.1 Hosting choice + IaC
- [ ] 11.2 Managed Postgres with PITR backups. Restore drill
- [ ] 11.3 Private bucket, lifecycle rules, encryption
- [ ] 11.4 Log aggregation, error tracking, uptime alerts
- [ ] 11.5 Migration runbook. Seed the production tenant
