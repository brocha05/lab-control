# Development Plan — small executable tasks

Each task should fit in a single PR (≤ ~1 day). ✅ = done in the bootstrap. 🔒 = blocked
on lab documents (do not start). Every task that touches tenant data includes a
cross-tenant test.

## Phase 0 — Domain discovery (owner: product + lab)

- [ ] 0.1 Send the document request list ([discovery-checklist.md §3](../domain/discovery-checklist.md#3-documents-to-request-from-the-laboratory)) to the lab
- [ ] 0.2 Schedule the end-to-end walkthrough interview (§4)
- [ ] 0.3 For each document received: run the checklist and write `docs/domain/analysis/<doc>.md`
- [ ] 0.4 Update assumptions / open-questions. Write a "proposed model changes" doc for review
- [ ] 0.5 Review session. Approve the changes, then update entities.md / schema.md / lifecycle.md

## Phase 1 — Architecture & skeleton

- [x] 1.1 ✅ Documentation structure, ADRs, assumptions, open questions
- [x] 1.2 ✅ Backend skeleton: NestJS strict TS, config validation, pino logging, Prisma service, error filter + response interceptor, `/health`
- [x] 1.3 ✅ `CalendarDate` utilities + pure test-schedule functions with unit tests
- [x] 1.4 ✅ Draft Prisma schema (validated, not migrated)
- [x] 1.5 ✅ `docker-compose.yml` (Postgres + MinIO)
- [ ] 1.6 Bootstrap `apps/frontend` from `boilerplate-frontend`. Remove billing/subscription modules. Keep auth, API client, layout
- [ ] 1.7 ESLint + Prettier config for the backend (copy from the boilerplate)
- [ ] 1.8 CI: install, lint, typecheck, unit tests (GitHub Actions or equivalent)
- [ ] 1.9 Decide Node version (Prisma 7 tooling warns on Node 20, recommends ≥ 22). Add `.nvmrc`

## Phase 2 — Core entities & auth (structure only)

- [ ] 2.1 Reduce `schema.prisma` to Phase-2 tables (tenants, users, clients, projects, project_test_configurations). Create the first migration
- [ ] 2.2 Seed / CLI: create tenant + admin user
- [ ] 2.3 Port auth from boilerplate (login, refresh, logout, JWT strategy). JWT carries `sub`, `tenantId`, `role`
- [ ] 2.4 Global JWT guard + `@Public()`. `@CurrentTenant()` reads from `request.user`
- [ ] 2.5 Integration-test harness: Postgres test DB (docker), truncate between tests, two-tenant fixture helper
- [ ] 2.6 `GET /me`

## Phase 3 — Clients & projects

- [ ] 3.1 `clients` module: list/create/get/update (tenant-scoped) + cross-tenant tests
- [ ] 3.2 `projects` module: list/create/get/update. Client must belong to the tenant (composite FK + service check)
- [ ] 3.3 Frontend: clients list/detail/form
- [ ] 3.4 Frontend: projects list/detail/form
- [ ] 3.5 Frontend: app shell with sections Dashboard, Clients, Projects, Field Records, Bitácora, Pending Tests, Reports (empty states for blocked sections)

## Phase 4 — Field records 🔒 (Q-01…Q-09, Q-33)

- [ ] 4.1 🔒 Add the validated field-record columns (migration)
- [ ] 4.2 `field-records` module: create DRAFT, get, list by project, update while DRAFT
- [ ] 4.3 Transition rules as a pure function + tests. `complete`/`cancel` endpoints
- [ ] 4.4 🔒 Completeness rules (Q-33)
- [ ] 4.5 Frontend: responsive (mobile-first) field record form, mirroring the official form's sections

## Phase 5 — Samples & specimens 🔒 (Q-10…Q-16)

- [ ] 5.1 🔒 Add validated columns. Decide on the 1:1 vs 1:N test cardinality (Q-16)
- [ ] 5.2 Add/edit samples and specimens within a DRAFT record
- [ ] 5.3 🔒 Specimen identifier generation (Q-13)
- [ ] 5.4 Cancel specimen (cascades to open tests)

## Phase 6 — Test scheduling (partly 🔒 Q-18…Q-23)

- [ ] 6.1 Project test configuration endpoints + UI (validate `ageDays > 0`, `specimenCount > 0`, unique ages)
- [ ] 6.2 🔒 Confirm the reference date (Q-18) and weekend rule (Q-21). Adjust `test-schedule.ts` if needed
- [ ] 6.3 🔒 Specimen → age assignment rule (Q-14, Q-16)
- [ ] 6.4 `planTestsForFieldRecord` on completion (single transaction with the status change)
- [ ] 6.5 `GET /tests/pending` with derived `scheduledDate` + `dueStatus` (today in tenant TZ)
- [ ] 6.6 Frontend: pending tests page (overdue / today / upcoming)

## Phase 7 — Test results 🔒 (Q-24…Q-30)

- [ ] 7.1 🔒 Result columns (migration)
- [ ] 7.2 🔒 Calculation functions, verbatim from the documented formulas, with test vectors from real lab data. `TODO: VALIDATE WITH LAB DOCUMENTATION` removed only when the vectors pass
- [ ] 7.3 Start / complete / cancel endpoints
- [ ] 7.4 Frontend: test entry screen (shows the derived actual age)
- [ ] 7.5 Decide (ADR) whether calculated values are stored for audit or computed on read

## Phase 8 — Bitácora 🔒 (Q-27)

- [ ] 8.1 `bitacora` module: tenant-scoped composed query, paginated
- [ ] 8.2 Frontend: Bitácora table (per project), print-friendly
- [ ] 8.3 Optional: CSV/Excel export, if the lab currently works in Excel
- [ ] 8.4 Dashboard summary counts

## Phase 9 — PDF reports 🔒 (Q-31…Q-38, Q-51)

- [ ] 9.1 `ReportStorage` (S3/MinIO) + signed URL download
- [ ] 9.2 `ReportRenderer` (Playwright, shared browser, timeout)
- [ ] 9.3 Reports module: create/generate/regenerate/finalize + version numbering + checksum
- [ ] 9.4 🔒 `concrete-control` view model + assembler + readiness
- [ ] 9.5 🔒 `concrete-control` HTML/CSS template matching the official report
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
