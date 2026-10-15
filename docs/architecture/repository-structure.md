# Repository Structure

Single repository, two applications, shared documentation. No monorepo tooling (Nx,
Turborepo) until there's shared code that justifies it. Each app has its own
`package.json` and lockfile.

```
lab-control/
├── README.md                    entry point
├── PROJECT_STATUS.md            known / assumed / unknown / blocked / next
├── CLAUDE.md                    working rules for AI-assisted development
├── docker-compose.yml           local Postgres + MinIO (S3-compatible)
├── docs/                        all architecture & domain documentation
│   ├── architecture/  domain/  database/  api/  reports/  roadmap/  decisions/
│   └── domain/analysis/         (created when the first lab document is analyzed)
│
├── apps/
│   ├── backend/                 NestJS modular monolith
│   │   ├── prisma/
│   │   │   ├── schema.prisma    DRAFT schema (TBD-annotated)
│   │   │   └── migrations/      (created in Phase 2)
│   │   ├── prisma.config.ts
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── shared/          infrastructure only — no domain logic
│   │       │   ├── config/      env validation
│   │       │   ├── dates/       CalendarDate (date-only) utilities
│   │       │   ├── http/        exception filter, response interceptor
│   │       │   ├── prisma/      PrismaService/Module
│   │       │   └── tenancy/     @CurrentTenant(), AuthenticatedUser
│   │       ├── health/
│   │       ├── specimen-tests/
│   │       │   └── domain/      test-schedule.ts (+ .spec.ts)   ← only domain code so far
│   │       │
│   │       │   ── added phase by phase, NOT pre-created as empty folders ──
│   │       ├── auth/  tenants/  users/                (Phase 2 / 10)
│   │       ├── clients/  projects/                    (Phase 3)
│   │       ├── field-records/                         (Phase 4–5)
│   │       ├── bitacora/                              (Phase 8)
│   │       └── reports/                               (Phase 9)
│   │           └── templates/concrete-control/{template.html,styles.css}
│   │
│   └── frontend/                Next.js (bootstrapped in Phase 1 from boilerplate-frontend)
│
└── (later) infra/               IaC, only when deploying (Phase 11)
```

## Inside a backend module

A module should look like this once it has real behaviour. Don't create the empty
folders up front.

```
projects/
├── projects.module.ts
├── projects.controller.ts        HTTP only: DTO in, call service, return
├── projects.service.ts           use cases; takes tenantId first; owns transactions
├── dto/                          class-validator request DTOs, response mapping
└── domain/                       pure functions/types: rules, transitions, calculations
    └── *.spec.ts                 unit tests next to the code
```

No repository layer on top of Prisma unless a module's queries become complex enough to
need one. Prisma already *is* the data-access layer.

## Frontend (planned)

Mirrors `boilerplate-frontend` conventions (Next.js App Router, TanStack Query, Zustand
for UI state only, Tailwind):

```
apps/frontend/src/
├── app/(auth)/login
├── app/(app)/dashboard | clients | projects | field-records | bitacora | tests/pending | reports
└── modules/<domain>/{api,hooks,types,components}
```
