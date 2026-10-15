# Multi-Tenancy

Decision: [ADR-002](../decisions/ADR-002-multi-tenancy.md). One PostgreSQL database
holds all tenants, and every tenant-owned row has `tenant_id`.

## Rules

1. **Every tenant-owned table has a non-null `tenant_id`**, including deep children
   (`samples`, `specimens`, `specimen_tests`). Scoping a query never requires a join.
2. **The tenant comes from the authenticated principal, never from the request.** No
   `tenantId` in URLs, bodies, or query strings. Controllers get it with
   `@CurrentTenant()`.
3. **Every service method that touches tenant data takes `tenantId` as its first
   argument**, and every Prisma `where` includes it:

   ```ts
   // ✅
   findOne(tenantId: string, id: string) {
     return this.prisma.project.findFirst({ where: { id, tenantId } });
   }

   // ❌ never
   findOne(id: string) {
     return this.prisma.project.findUnique({ where: { id } });
   }
   ```

   Use `findFirst({ where: { id, tenantId } })` (or a compound unique key), not
   `findUnique({ where: { id } })`. Updates and deletes use `updateMany` /
   `deleteMany` with `{ id, tenantId }` and check `count === 1`, or first load the
   row with a scoped query.
4. **Cross-tenant access returns 404, not 403.** Don't reveal whether an ID exists.
5. **Parent/child tenant consistency is enforced by the database.** Each parent has a
   unique key on `(id, tenant_id)`, and each child's foreign key is the composite
   `(parent_id, tenant_id)`. A Sample can't point at another tenant's FieldRecord, even
   because of a bug. See [../database/relationships.md](../database/relationships.md).
6. **No global queries in request paths.** Anything that genuinely spans tenants (e.g.
   a platform-admin metric) lives in an explicitly named service and is reviewed
   separately.

   The only exceptions are in `AuthService`, before a tenant is known: login looks the
   user up by email (globally unique, A-32), and refresh/logout look the token up by
   the SHA-256 of an unguessable secret. The tenant then comes from that row, and every
   write that follows is scoped by it.

## Why explicit, not magic

We considered a Prisma client extension or `AsyncLocalStorage` that injects `tenantId`
automatically. We chose **explicit parameters** for now because:

- It's visible in code review. A missing `tenantId` stands out.
- It's trivially testable.
- Magic scoping fails silently when bypassed (raw SQL, `$transaction` callbacks,
  nested writes).

Explicit scoping alone can still be forgotten. Compensating controls:

- Composite FKs (rule 5) block cross-tenant *links*.
- An **integration test per module** creates two tenants and asserts that tenant B gets
  404 on every endpoint for tenant A's resources (Phase 10 makes this exhaustive).
- **Row Level Security** (`SET app.tenant_id` per transaction + policies) is the
  planned defence-in-depth step in Phase 10. Explicit scoping stays in place either way.

## Tenant-level settings

`Tenant.timezone` (IANA, e.g. `America/Mexico_City`) is used to compute "today" for
pending/overdue tests [A-14]. `legalName`, `address` and `phone` feed the report header
and footer (FPC06-04). Logos and report numbering wait for Q-52 / Q-56.

## Provisioning

Tenants and their first admin user are created with `pnpm cli:create-tenant`
(development-plan 2.2, usage in the README). No self-service signup (it's not needed
for a single customer).

## Authentication

The access token (JWT, HS256, `JWT_ACCESS_TTL_SECONDS`, default 15 min) carries `sub`,
`tenantId` and `role`. Refresh tokens are opaque, stored only as SHA-256, rotated on
every use and valid for `REFRESH_TOKEN_TTL_DAYS` (default 7). Presenting an already
used token revokes every token of that user (theft detection). Logout revokes the given
refresh token and works with an expired access token.
