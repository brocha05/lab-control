# Endpoints (preliminary)

> Only the endpoints needed for the MVP workflow. Request/response **bodies for domain
> content are TBD**. Don't implement endpoints for a phase that's still blocked.

Legend: **Phase** = roadmap phase · 🔒 = blocked on domain documents

## Auth & tenancy

| Method | Path | Purpose | Phase |
|--------|------|---------|-------|
| POST | `/auth/login` | `{ email, password }` → `{ user, tokens: { accessToken, refreshToken } }` | 2 ✅ |
| POST | `/auth/refresh` | `{ refreshToken }` → `{ accessToken, refreshToken }` (rotated) | 2 ✅ |
| POST | `/auth/logout` | `{ refreshToken }` → 204. Idempotent | 2 ✅ |
| GET | `/me` | `{ user, tenant: { id, name, slug, timezone } }` | 2 ✅ |
| GET / POST / PATCH | `/users`, `/users/:id` | Tenant admin manages users | 10 |

## Clients & projects

| Method | Path | Purpose | Phase |
|--------|------|---------|-------|
| GET | `/clients` | `?page&limit&q` (q = name or code, case-insensitive), sorted by name | 3 ✅ |
| POST | `/clients` | Create (`name`, `code` 3–4 letters unique per lab → 409, `contactName?`, `contactPhone?`) | 3 ✅ |
| GET / PATCH | `/clients/:id` | Read / update (`null` or `""` clears an optional field). No delete (A-24) | 3 ✅ |
| GET | `/projects` | `?page&limit&q&clientId` (q = name, code or location), sorted by name. Items include `client: { id, name }` | 3 ✅ |
| POST | `/projects` | Create (`clientId`, `name`, `code` 3–4 letters unique per client → 409, `location?`). Another tenant's client → 404 | 3 ✅ |
| GET / PATCH | `/projects/:id` | Read / update (`clientId` re-checked). No delete (A-24) | 3 ✅ |
| GET | `/projects/:id/test-configuration` | Default test ages, ascending | 6 ✅ |
| PUT | `/projects/:id/test-configuration` | `{ ages: [{ ageDays, specimenCount }] }` replaces the set; repeated age → 400. Planned tests don't move | 6 ✅ |

## Field records, deliveries, samples, specimens

Bodies follow FPC01-01 ([analysis](../domain/analysis/FPC01-01.md)). Column list:
[schema.md](../database/schema.md#field_records-fpc01-01).

| Method | Path | Purpose | Phase |
|--------|------|---------|-------|
| GET | `/projects/:id/field-records` | `?page&limit&q&status` (q = elements), newest pour first, with delivery/sample/specimen counts | 4 ✅ |
| GET | `/projects/:id/field-records/next-numbers` | Next registro, sample and specimen numbers of the project (Q-55, Q-57, Q-58) | 4 ✅ |
| POST | `/projects/:id/field-records` | Create `DRAFT` (`pourDate`, `registrySequence?` = next number if omitted, `frontNumber?`). Taken number → 409 | 4 ✅ |
| GET | `/field-records/:id` | Record with deliveries → samples → specimens; derived `registryNumber`, `sheet`, `sheetCount`, `cumulativeVolumeM3` | 4 ✅ |
| PUT | `/field-records/:id` | Replace the whole form while `DRAFT` (otherwise 409): header + nested deliveries (numbered by position), samples, specimens. Repeated numbers → 400, numbers used elsewhere in the project → 409 | 4 ✅ |
| POST | `/field-records/:id/complete` | `DRAFT → COMPLETED` and plans a SCHEDULED test per specimen with the project's ages (ascending numbers → ascending ages). Incomplete → 422 `details` = missing items (Q-33); no ages → 422 `['testAges']`; other states → 409 | 4/6 ✅ |
| GET / POST / PATCH | `/catalogs/suppliers`, `/catalogs/cement-types`, `…/:id` | List / add / rename catalog entries; duplicate name (any case) → 409 (Q-06). No delete: records reference them | 4 ✅ |
| GET / POST / DELETE | `/holidays?year=`, `/holidays`, `/holidays/:id` | The lab's holiday calendar (Q-21, Q-81). Duplicate date → 409 | 4 ✅ |
| POST | `/field-records/:id/cancel` | `DRAFT → CANCELLED`; other states → 409 | 4 ✅ |
| POST | `/specimens/:id/cancel` | Cancel a damaged specimen + its open tests; returns the record. Already tested → 409 | 5 ✅ |

> FPC01-01 is filled in as one sheet (header + delivery table + specimen references), so
> the record is edited as a whole with one nested `PUT` while `DRAFT`. Delivery
> `sequence` and the specimen order inside a sample come from the request order.
> Separate `/deliveries` endpoints are added only if the UI needs row-by-row saving
> (e.g. a technician entering trucks as they arrive, A-42).

## Tests

| Method | Path | Purpose | Phase |
|--------|------|---------|-------|
| GET | `/tests/pending` | `?until=YYYY-MM-DD` (default today + 7) `&projectId=` → open tests with `nominalDate`, `scheduledDate` (Sunday/holiday shift), `dueStatus`, specimen/sample/record/project context; overdue included, sorted by date | 6 ✅ |
| GET | `/tests/worksheet` | `?projectId=&testDate=YYYY-MM-DD` → FPC06-01 sheet: project, groups per record + sample, rows (open tests due on or before the date + tests completed on it, A-84) with readings, derived `result` and `ageTolerance` (ADR-008), shared `pressCode` / `dimensionEquipment`, `loadTimeChecks` (Q-63). Cylinders only (A-87). Other lab's project → 404 | 7 ✅ |
| PATCH | `/tests/:id/schedule` | `{ ageDays?, keepExactDate? }` while SCHEDULED / IN_PROGRESS (Q-21, Q-22); otherwise 409 | 6 ✅ |
| PUT | `/tests/results` | `{ testDate, pressCode?, dimensionEquipment?, rows: [{ testId, testTime?, height1Cm, height2Cm, diameter1Cm, diameter2Cm, maxLoadKgf, loadDurationS?, failureType? (1–6) }] }` → completes (or corrects, A-85) every row in one transaction. Future date or before the pour → 400; cancelled → 409; other lab → 404. No start step (A-90); a damaged specimen is cancelled with `POST /specimens/:id/cancel` | 7 ✅ |

## Bitácora (read-only)

| Method | Path | Purpose | Phase |
|--------|------|---------|-------|
| GET | `/projects/:id/bitacora` | Composed view, one row per specimen, FPC01-02 columns. Scope 🔒 (Q-68) | 8 |

## Reports

| Method | Path | Purpose | Phase |
|--------|------|---------|-------|
| GET | `/projects/:id/reports` | List reports of the project's records (latest version each) | 9 |
| GET | `/field-records/:id/reports` | List versions for one record | 9 |
| POST | `/field-records/:id/reports` | Create a draft (`templateKey`, `isPartial?`), report-time fields prefilled from the project (Q-64). Readiness: all tests done unless partial (Q-35) | 9 |
| PATCH | `/reports/:id` | Edit report-time fields while not `FINAL` | 9 |
| GET | `/reports/:id` | Metadata (+ snapshot for preview) | 9 |
| POST | `/reports/:id/regenerate` | Regenerate while not `FINAL` | 9 |
| POST | `/reports/:id/finalize` | `GENERATED → FINAL`, `QUALITY_MANAGER` only (Q-40). Supersedes the previous FINAL version (Q-36) | 9 |
| POST | `/field-records/:id/reports/correction` | New version with the same number, from a FINAL one (Q-36) | 9 |
| GET | `/reports/:id/download` | Returns a short-lived signed URL | 9 |
| GET | `/field-records/:id/reports/readiness` | Which requirements are missing | 9 |

## Dashboard

| Method | Path | Purpose | Phase |
|--------|------|---------|-------|
| GET | `/dashboard/summary` | Counts: due today, overdue, drafts, reports pending. Derived only. | 8+ |

## Ops

| Method | Path | Purpose | Phase |
|--------|------|---------|-------|
| GET | `/health` | Liveness + DB check | 1 ✅ (skeleton) |
