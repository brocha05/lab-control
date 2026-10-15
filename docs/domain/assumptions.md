# Assumptions Register

Every item here is an **unvalidated assumption** used so the architecture can move
forward. Each one must be confirmed or rejected against the official laboratory
documents (see [discovery-checklist.md](discovery-checklist.md)).

Rules:

- Code or schema that depends on an assumption must reference its ID in a comment
  (e.g. `// ASSUMPTION A-06`).
- When an assumption is validated, set its status to `CONFIRMED` and cite the source
  document. When it's rejected, set `REJECTED`, cite the source, and list the affected
  docs/code in the **Impact** column.
- Do not delete rows. The history is useful.

Status values: `OPEN` · `CONFIRMED` · `REJECTED` · `PARTIAL`

## Domain structure

| ID | Assumption | Why we assume it | Status | Related question |
|----|-----------|------------------|--------|------------------|
| A-01 | The ownership hierarchy is Client → Project → FieldRecord → Sample → Specimen → Test. | Described by the product owner. | OPEN | Q-01, Q-10 |
| A-02 | A Project belongs to exactly one Client. | Described hierarchy. | OPEN | Q-41 |
| A-03 | A FieldRecord belongs to exactly one Project. | Described hierarchy. | OPEN | Q-04 |
| A-04 | A Sample belongs to one FieldRecord, a Specimen to one Sample, and a Test to one Specimen. | Described hierarchy. | OPEN | Q-10, Q-16 |
| A-05 | Specimen → Test is **1:N** in the schema. It may really be 1:1 (one destructive test per specimen). | Described model says "Tests" (plural). We keep 1:N because going from 1:N to 1:1 is easier than the reverse. | OPEN | Q-16 |
| A-06 | The Bitácora is per Project. | Described in the brief ("Project + Field Records + …"). | OPEN | Q-27 |
| A-07 | Reports are generated per Project. | Described API (`POST /projects/:id/reports`). | OPEN | Q-31 |

## Test scheduling

| ID | Assumption | Why we assume it | Status | Related question |
|----|-----------|------------------|--------|------------------|
| A-10 | Test ages (in days) and specimen counts per age are configured **per Project** (`ProjectTestConfiguration`). | Proposed in the brief as an example. | OPEN | Q-19, Q-20 |
| A-11 | Scheduled test date = *age reference date* + *age in days*. | Example in the brief (2026-10-02 + 7 → 2026-10-09). | OPEN | Q-18 |
| A-12 | The *age reference date* is the FieldRecord's date. | It's the only date we know exists. It might really be a casting/sampling date per Sample. | OPEN | Q-18 |
| A-13 | Ages count **calendar days**. Scheduled dates are not shifted for weekends or holidays. | Simplest rule consistent with the example. | OPEN | Q-21 |
| A-14 | Each tenant operates in one timezone. Domain dates (pour date, scheduled date) are **date-only** values in that timezone. | Avoids off-by-one errors across UTC boundaries. | OPEN | Q-46 |
| A-15 | The age configuration in effect when tests are planned is copied onto each Test (`ageDays`). Later configuration changes don't move existing tests. | Historical consistency: a plan made on day 1 shouldn't silently change. | OPEN | Q-22 |

## Lifecycle / workflow

| ID | Assumption | Why we assume it | Status | Related question |
|----|-----------|------------------|--------|------------------|
| A-20 | FieldRecord states: `DRAFT`, `COMPLETED`, `CANCELLED`. | Suggested in the brief. | OPEN | Q-33 |
| A-21 | Specimen stores only `CREATED` / `CANCELLED`. "Scheduled" and "tested" are **derived** from its Tests. | Avoids two sources of truth for the same fact. See [lifecycle.md](lifecycle.md). | OPEN | Q-16 |
| A-22 | Test states: `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`. | Suggested in the brief. Whether `IN_PROGRESS` is needed is unknown. | OPEN | Q-24 |
| A-23 | Report states: `DRAFT`, `GENERATED`, `FINAL`. A `FINAL` report is immutable. Corrections create a new version. | Suggested in the brief, plus the historical-artifact requirement. | OPEN | Q-36, Q-37 |
| A-24 | Records can be cancelled but not hard-deleted once they leave `DRAFT`. | Auditability for a testing laboratory. | OPEN | Q-34 |

## Organization / tenancy / users

| ID | Assumption | Why we assume it | Status | Related question |
|----|-----------|------------------|--------|------------------|
| A-30 | Tenant = one laboratory company. There are no branches or sub-labs inside a tenant. | Single customer today. | OPEN | Q-44 |
| A-31 | A User belongs to exactly one Tenant. | Simplest multi-tenant model. | OPEN | Q-45 |
| A-32 | User email is globally unique (login does not require a tenant selector). | Simplest login UX. | OPEN | Q-45 |
| A-33 | The initial roles are placeholders (`ADMIN`, `MEMBER`) until real lab roles are known. | Roles are unknown. | OPEN | Q-39, Q-40 |
| A-34 | Only laboratory staff use the system. Clients don't log in. | Not mentioned in the brief. | OPEN | Q-43 |

## Presentation / locale

| ID | Assumption | Why we assume it | Status | Related question |
|----|-----------|------------------|--------|------------------|
| A-40 | The UI and reports are in Spanish. | Domain vocabulary (Bitácora, trompo, "Informe de pruebas…"). | OPEN | Q-47 |
| A-41 | Metric units. | Regional context. | OPEN | Q-48 |
| A-42 | Field staff use phones/tablets and may have poor connectivity. Offline support is **not** in MVP scope. | From the brief. | OPEN | Q-49 |

## Technical

| ID | Assumption | Why we assume it | Status | Related question |
|----|-----------|------------------|--------|------------------|
| A-50 | Expected scale is small: a handful of tenants, tens of users, thousands (not millions) of specimens per year. | Single-laboratory product. | OPEN | Q-50 |
| A-51 | Generated PDFs and attachments go in private S3-compatible storage and are served through short-lived signed URLs. | Security requirement in the brief. | OPEN | Q-30 |
| A-52 | Report generation can run synchronously in the API process at MVP scale. | See ADR-006. Revisit if generation exceeds a few seconds. | OPEN | — |
