# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Language:** always reply to the user in Spanish (chat only). Code, comments, docs and
commit messages stay in English. UI text is Spanish (A-40).

## What this is

Multi-tenant system for a construction-materials testing lab (hydraulic concrete first):
Client → Project → FieldRecord → Delivery → Sample → Specimen → SpecimenTest, plus a derived
Bitácora and snapshotted PDF reports. Two independent apps in one repo, **no monorepo
tooling**: `apps/backend` (NestJS 12 + Prisma 7) and `apps/frontend` (Next.js 16). Each is a
standalone **pnpm** project (own `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`);
run commands inside the app folder. Never use npm/yarn (no `package-lock.json`).

**Always read the relevant docs in `docs/` before changing schema, API, or UI.** Status
and what's blocked: `PROJECT_STATUS.md`. Tasks per phase: `docs/roadmap/development-plan.md`.

## The rule that matters most: no domain guessing

The domain is still in discovery. Official lab documents are the source of truth.

- Domain fields come only from analyzed sources (`docs/domain/analysis/`: the forms
  FPC01-01, FPC01-02, FPC06-01, FPC06-04 and the lab's questionnaire answers of
  2026-10-15). Don't add fields beyond them. Calculations follow NMX-C-083 as confirmed
  by the lab and live in `src/specimen-tests/domain/compression.ts`; don't re-derive them.
  Tasks marked 🔒 in `docs/roadmap/development-plan.md` are blocked. Don't start them.
- Code depending on an assumption cites it: `// ASSUMPTION A-12`. Open questions are
  `Q-xx`. IDs live in `docs/domain/assumptions.md` and `docs/domain/open-questions.md`.
  Never silently turn an assumption into a fact. Unknowns are marked `TBD` or
  `TODO: VALIDATE WITH LAB DOCUMENTATION`.
- No hardcoded test ages (7/28 days): ages are the project's defaults
  (`ProjectTestConfiguration`), editable per test until it is tested (Q-20, Q-22).
- Registro, sample and specimen numbers are consecutive **per project** (Q-55, Q-57,
  Q-58). Roles are the lab's (`UserRole`, Q-39); only `QUALITY_MANAGER` issues reports.
- No `jsonb` for unknown domain fields. JSON is only for `reports.snapshot` (ADR-003).
- Architectural change = new ADR in `docs/decisions/` that supersedes the old one.
- When a lab document arrives, follow `docs/domain/discovery-checklist.md`: analyze and
  propose first, implement only after review.

## Commands

Node 24 (`.nvmrc`), pnpm 12. On this machine use `nvm use 24` (nvm-windows).

```bash
docker compose up -d            # root: Postgres :5432 (lab/lab/lab_control), MinIO :9000/:9001

# apps/backend  (API on :3001, prefix /api/v1)
pnpm start:dev
pnpm test                        # all unit tests (vitest, *.spec.ts next to the code)
pnpm test src/specimen-tests     # one folder/file
pnpm test -t "planTestAges"      # one test by name
pnpm test:int                    # integration tests (*.int-spec.ts), needs Docker Postgres
pnpm lint | typecheck | format:check | build
pnpm db:validate | db:generate   # prisma generate also runs on pnpm install
pnpm db:migrate                  # apply/create migrations (needs Postgres)
pnpm cli:create-tenant …         # create a lab + its ADMIN (usage: README; pnpm build first)
pnpm exec playwright-core install chromium-headless-shell  # once: Chromium for report PDFs

# apps/frontend  (on :3000)
pnpm dev
pnpm lint | typecheck | format:check | build
```

Dependency install scripts are opt-in via `allowBuilds` in each app's
`pnpm-workspace.yaml`; pnpm fails the install if a new dependency's script isn't listed.

CI (`.github/workflows/ci.yml`) runs exactly these checks for both apps. The frontend has
no test runner yet.

Migrations: `pnpm db:migrate` (dev) / `pnpm db:migrate:deploy`. `prisma/schema.prisma` holds
only migrated tables; the full domain model waits in `prisma/drafts/domain.prisma`
(`pnpm db:validate:draft`) and moves over phase by phase, one migration per task. If
port 5432 is taken, run compose with `POSTGRES_PORT=5433` and point `DATABASE_URL` at it.

## Backend architecture

Modular monolith (ADR-001). A module owns its tables; other modules read them only
through its exported service. Nobody writes another module's tables. Modules are added
phase by phase, never pre-created as empty folders. Module layout once it has behaviour:
`x.module.ts`, `x.controller.ts` (HTTP only), `x.service.ts` (use cases, transactions),
`dto/`, `domain/` (pure functions + `*.spec.ts`). No repository layer over Prisma, no
generic `BaseRepository`/`CrudService`.

**Multi-tenancy (ADR-002, `docs/architecture/multi-tenancy.md`)** is explicit, not magic:
- Tenant comes only from the JWT (`@CurrentTenant()` in `src/shared/tenancy/`). Never from
  URL, body, or query.
- Every service method touching tenant data takes `tenantId` first, and every Prisma
  `where` includes it: `findFirst({ where: { id, tenantId } })`, never
  `findUnique({ where: { id } })`. Updates/deletes use `updateMany`/`deleteMany` with
  `{ id, tenantId }` and check `count === 1`.
- Cross-tenant access returns **404**, not 403.
- In the schema, every parent has `@@unique([id, tenantId])` and children use composite
  FKs `(parentId, tenantId)`. `tenantId` leads every composite index.
- Each module gets an integration test with two tenants asserting 404 across tenants:
  `*.int-spec.ts` next to the module, using `createTestApp()`, `truncateAll()` and
  `createTwoTenants()` from `src/testing/`. They run on a separate `<db>_test` database.

**HTTP conventions (`docs/api/conventions.md`)**: global `ValidationPipe` with
`whitelist + forbidNonWhitelisted`; `ResponseInterceptor` wraps success as
`{ success, data, meta: { requestId } }` and reshapes a service's
`{ data, total, page, limit, pages }` into `{ items, ... }`; `GlobalExceptionFilter`
emits `{ success:false, error:{ code, message, details? }, meta }`. State changes are
action endpoints (`POST /field-records/:id/complete`). `PATCH` never accepts `status`.
Transition rules live in one pure, unit-tested function per entity
(`docs/domain/lifecycle.md`).

**Dates**: domain dates are date-only `CalendarDate` (`YYYY-MM-DD`, `src/shared/dates/`),
stored as `DATE`; arithmetic is on UTC midnights. "Today" is always
`calendarDateInTimeZone(tenant.timezone)` (A-14). Timestamps are `timestamptz`.

**Derived, not stored**: scheduled test date (`pourDate + ageDays`, moved past Sundays and
holidays, `test-schedule.ts`), age tolerance, calculated results, due status,
specimen "scheduled/tested", the whole Bitácora (ADR-004, no table). `SpecimenTest.ageDays`
is the one deliberate copy (A-15). Reports are the one sanctioned duplication: frozen
`snapshot` + PDF + SHA-256; `FINAL` is immutable, corrections are a new version (ADR-005).

**Prisma 7**: datasource URL lives in `prisma.config.ts` (not in the schema); runtime uses
the `@prisma/adapter-pg` adapter in `PrismaService`. The `prisma-client` generator writes
the client to `src/generated/prisma` (gitignored, excluded from lint/format): import from
there, **not** from `@prisma/client`. Env is validated at boot by
`src/shared/config/env.validation.ts` (add new variables there and in `.env.example`).

**Module system**: native ESM (`"type": "module"`, `module: nodenext`), following the
NestJS 12 ESM template. Relative imports **must** end in `.js` (`'./health.controller.js'`)
even though the source is `.ts`. No `__dirname`/`require`: use `import.meta.dirname` /
`import`. Types used in decorated constructors (DI) must be value imports, not
`import type`, or the decorator metadata is lost. Tests run on Vitest with globals
(`describe/it/expect/vi`, no imports needed); Vite 8 emits the decorator metadata Nest
needs. TypeScript is pinned to 6.0.x (`typescript-eslint` and the Nest CLI don't support 7);
TS 6 needs explicit `rootDir` and `types` in tsconfig.

`SpecimenTest` (module `specimen-tests`, URL `/tests`) is named that way to avoid clashing
with test-framework vocabulary.

## Frontend architecture

Bootstrapped from the team's `saas-frontend-boilerplate` with billing, admin, and
multi-company features removed. Route groups: `app/(auth)/login` and `app/(app)/*`.
Feature code goes in `src/modules/<domain>/{api,hooks,types,components,schemas}`.
`src/lib/api/client.ts` (axios) adds the bearer token, unwraps the backend envelope (so
callers get `data` directly), and refreshes on 401. It sends no tenant header.
`src/proxy.ts` is the Next 16 route guard (cookie `access-token`), a UX redirect only.
Zustand is for auth/UI state (`store/uiStore.ts`: top-bar project, breadcrumbs set with
`useBreadcrumbs`, "Nuevo registro" dialog); server data goes through TanStack Query. UI
text is Spanish (A-40). Visual system (tokens, status chips, light only):
`docs/design/README.md`; domain status → chip in `src/lib/status.ts`. Field records live
under their project (no global list); a DRAFT opens as the step wizard. Format domain dates with the `formatDate*` helpers in
`lib/utils/formatters.ts`, never `new Date('YYYY-MM-DD')`.
Auth and `/me` types mirror the backend (`LoginResult`, `MeView` in `apps/backend/src/auth/auth.service.ts`).

## Repo conventions

- `.gitattributes` forces LF; Prettier configs differ per app (backend `trailingComma:
  all`, frontend `es5`).
- ESLint: backend on 10, frontend stays on 9 (`eslint-config-next`'s react/import/jsx-a11y
  plugins don't support 10 yet).
- Reference boilerplate for porting auth etc.: `github.com/brocha05/saas-backend-boilerplate`
  (called `boilerplate-backend-core` in the docs).
