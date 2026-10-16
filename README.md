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
                        # 5432 taken? POSTGRES_PORT=5433 docker compose up -d, and use 5433 in .env

# Backend: http://localhost:3001/api/v1
cd apps/backend
cp .env.example .env
pnpm install            # also runs `prisma generate`
pnpm db:migrate         # apply migrations
pnpm build
ADMIN_PASSWORD=change-me-please pnpm cli:create-tenant \
  --name "Laboratorio demo" --slug demo --timezone America/Mexico_City \
  --admin-email admin@demo.local --admin-name "Jefe de Control de Calidad"   # role QUALITY_MANAGER
pnpm start:dev          # GET /api/v1/health

# Frontend: http://localhost:3000
cd apps/frontend
cp .env.example .env.local
pnpm install
pnpm dev
```

## Checks (same as CI)

```bash
# apps/backend
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm test:int   # integration tests: needs Postgres; uses <db>_test, created and migrated automatically
# apps/frontend
pnpm format:check && pnpm lint && pnpm typecheck && pnpm build
```

## Working rules

Domain behaviour comes from the laboratory's official documents, not from guesses. Read
[CLAUDE.md](CLAUDE.md) and the [documentation rules](docs/README.md#documentation-rules)
before changing schema, API, or UI.
