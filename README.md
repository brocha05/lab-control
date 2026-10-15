# Lab Control

Multi-tenant system for a construction-materials testing laboratory (hydraulic concrete
first): projects, field records, specimens, test scheduling, Bitácora, and historical PDF
reports.

- **Status:** [PROJECT_STATUS.md](PROJECT_STATUS.md)
- **Documentation:** [docs/](docs/README.md). Start with the
  [architecture overview](docs/architecture/overview.md) and the
  [roadmap](docs/roadmap/MVP.md).

## Stack

| Part | Tech |
|------|------|
| Backend (`apps/backend`) | NestJS 12 modular monolith, Prisma 7 + PostgreSQL, pino logging |
| Frontend (`apps/frontend`) | Next.js 16 (App Router), TanStack Query, Zustand, Tailwind 4 |
| Local infra | Docker Compose: PostgreSQL 17, MinIO (S3-compatible) |
| Node / package manager | Node 24 LTS (`.nvmrc`), pnpm 12 (`packageManager` in each app) |

## Local setup

```bash
nvm use                 # Node 24 (nvm-windows: `nvm use 24`)
npm install -g pnpm@12  # or: corepack enable
docker compose up -d    # Postgres on :5432, MinIO on :9000 (console :9001)

# Backend: http://localhost:3001/api/v1
cd apps/backend
cp .env.example .env
pnpm install            # also runs `prisma generate`
pnpm start:dev          # GET /api/v1/health

# Frontend: http://localhost:3000
cd apps/frontend
cp .env.example .env.local
pnpm install
pnpm dev
```

There are no database migrations yet; the first one arrives in Phase 2 (development-plan
2.1). Until then `/health` reports the database connection only.

## Checks (same as CI)

```bash
# apps/backend
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
# apps/frontend
pnpm format:check && pnpm lint && pnpm typecheck && pnpm build
```

## Working rules

Domain behaviour comes from the laboratory's official documents, not from guesses. Read
[CLAUDE.md](CLAUDE.md) and the [documentation rules](docs/README.md#documentation-rules)
before changing schema, API, or UI.
