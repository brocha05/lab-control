# Development Plan — small executable tasks

Each task should fit in a single PR (≤ ~1 day). ✅ = done in the bootstrap. 🔒 = blocked
on lab documents (do not start). Every task that touches tenant data includes a
cross-tenant test.

## Phase 0 — Domain discovery (owner: product + lab)

- [ ] 0.1 Send the document request list ([discovery-checklist.md §3](../domain/discovery-checklist.md#3-documents-to-request-from-the-laboratory)) to the lab
- [ ] 0.2 Schedule the end-to-end walkthrough interview (§4)
- [x] 0.3 ✅ For each document received: run the checklist and write `docs/domain/analysis/<doc>.md` (2026-10-14: FPC01-01, FPC01-02, FPC06-01, FPC06-04)
- [x] 0.4 ✅ Update assumptions / open-questions. "Proposed model changes": [analysis/README.md](../domain/analysis/README.md)
- [ ] 0.5 Review session with the lab: answer the P0 questions Q-55…Q-61, Q-74 and resolve the four document conflicts. entities.md / schema.md / lifecycle.md were already updated at the owner's request (2026-10-14). Adjust them after the review
- [ ] 0.6 Request the remaining documents: specimen labels, procedures/standards list, org chart and signers, historical spreadsheets, accreditation, one corrected/re-issued report, one record with several samples ([checklist §3](../domain/discovery-checklist.md#3-documents-to-request-from-the-laboratory))

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
- [ ] 2.4 Global JWT guard + `@Public()`. `@CurrentTenant()` reads from `request.user`
- [ ] 2.5 Integration-test harness: Postgres test DB (docker), truncate between tests, two-tenant fixture helper
- [ ] 2.6 `GET /me`

## Phase 3 — Clients & projects

- [ ] 3.1 `clients` module: list/create/get/update (tenant-scoped) + cross-tenant tests
- [ ] 3.2 `projects` module: list/create/get/update. Client must belong to the tenant (composite FK + service check)
- [ ] 3.3 Frontend: clients list/detail/form
- [ ] 3.4 Frontend: projects list/detail/form
- [ ] 3.5 Frontend: app shell with sections Dashboard, Clients, Projects, Field Records, Bitácora, Pending Tests, Reports (empty states for blocked sections)

## Phase 4 — Field records (structure known from FPC01-01; 🔒 items: Q-33, Q-55)

- [ ] 4.1 Migration for `field_records` + `deliveries` (columns drafted in `schema.prisma`; after 0.5)
- [ ] 4.2 `field-records` module: create DRAFT, get, list by project, nested `PUT` (header + deliveries + samples + specimens) while DRAFT
- [ ] 4.3 Transition rules as a pure function + tests. `complete`/`cancel` endpoints
- [ ] 4.4 🔒 Completeness rules (Q-33)
- [ ] 4.5 Frontend: responsive (mobile-first) field record form, mirroring FPC01-01's sections (header, datos de proyecto/remisión, condiciones, trazabilidad, entregas, especímenes, masa unitaria/aire, elementos, observaciones)

## Phase 5 — Samples & specimens (structure known; 🔒 items: Q-57, Q-58)

- [ ] 5.1 Migration for `samples` / `specimens` columns. Confirm the 1:N test cardinality (forms show one test per specimen, A-05)
- [ ] 5.2 Add/edit samples and specimens within a DRAFT record
- [ ] 5.3 🔒 Sample and specimen number generation (Q-57, Q-58)
- [ ] 5.4 Cancel specimen (cascades to open tests)

## Phase 6 — Test scheduling (partly 🔒 Q-18…Q-23)

- [ ] 6.1 Project test configuration endpoints + UI (validate `ageDays > 0`, `specimenCount > 0`, unique ages)
- [ ] 6.2 🔒 Reference date confirmed (`pourDate`, Q-18). Still confirm holidays (Q-21) and age tolerance (Q-62). Adjust `test-schedule.ts` if needed
- [ ] 6.3 🔒 Specimen → age assignment rule (Q-14, Q-74). Observed: ascending specimen number → ascending age
- [ ] 6.4 `planTestsForFieldRecord` on completion (single transaction with the status change)
- [ ] 6.5 `GET /tests/pending` with derived `scheduledDate` + `dueStatus` (today in tenant TZ)
- [ ] 6.6 Frontend: pending tests page (overdue / today / upcoming)

## Phase 7 — Test results (readings known from FPC06-01; 🔒 items: Q-59, Q-61)

- [ ] 7.1 Migration for the `specimen_tests` reading columns (drafted)
- [ ] 7.2 🔒 Calculation functions (area, N, stress, MPa, %, averages, rate), with test vectors from real lab data (MCH-068 specimens 389–408 are the first set). `TODO: VALIDATE WITH LAB DOCUMENTATION` removed only when the formulas are confirmed (Q-59, Q-61) and the vectors pass
- [ ] 7.3 Start / complete / cancel endpoints
- [ ] 7.4 Frontend: test entry screen per project + test date, laid out like FPC06-01 (shows the derived actual age). Printable worksheet (Q-69)
- [ ] 7.5 Decide (ADR) whether calculated values are stored for audit or computed on read

## Phase 8 — Bitácora (columns known from FPC01-02; 🔒 items: Q-66, Q-68)

- [ ] 8.1 `bitacora` module: tenant-scoped composed query, one row per specimen with the FPC01-02 columns, paginated. Scope 🔒 Q-68
- [ ] 8.2 Frontend: Bitácora table (per project), print-friendly
- [ ] 8.3 Optional: CSV/Excel export, if the lab currently works in Excel
- [ ] 8.4 Dashboard summary counts

## Phase 9 — PDF reports (layout known from FPC06-04; 🔒 items: Q-35, Q-37, Q-56, Q-71)

- [ ] 9.1 `ReportStorage` (S3/MinIO) + signed URL download
- [ ] 9.2 `ReportRenderer` (Playwright, shared browser, timeout)
- [ ] 9.3 Reports module (scope: field record): create/generate/regenerate/finalize + version numbering + checksum
- [ ] 9.4 🔒 `concrete-control` view model + assembler + readiness (numbering Q-56, calculations Q-59/Q-61, readiness Q-35)
- [ ] 9.5 `concrete-control` HTML/CSS template matching FPC06-04 (signatures 🔒 Q-37)
- [ ] 9.6 Frontend: report list/generate/download per project

## Phase 10 — Hardening

- [ ] 10.1 🔒 Real roles + permissions matrix (Q-39, Q-40)
- [ ] 10.2 `audit_events` (Q-54)
- [ ] 10.3 Exhaustive cross-tenant test suite (every endpoint)
- [ ] 10.4 RLS spike + ADR (enable or not)
- [ ] 10.5 Rate limiting, security headers, dependency audit

## Phase 11 — Production

- [ ] 11.1 Hosting choice + IaC
- [ ] 11.2 Managed Postgres with PITR backups. Restore drill
- [ ] 11.3 Private bucket, lifecycle rules, encryption
- [ ] 11.4 Log aggregation, error tracking, uptime alerts
- [ ] 11.5 Migration runbook. Seed the production tenant
