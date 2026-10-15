# Domain Entities

> Fields marked **TBD** are intentionally left out until the official documents are
> analyzed. This file defines **identity, ownership, relationships, and lifecycle**.
> It does not define domain content. Physical schema: [../database/schema.md](../database/schema.md).

## Source-of-truth entities

| Entity | Owned by | Purpose | Known attributes | Domain attributes |
|--------|----------|---------|------------------|-------------------|
| Tenant | — | A laboratory company. Isolation boundary. | name, slug, timezone [A-14] | TBD (legal name, logo, license data for reports: Q-37) |
| User | Tenant | A person who logs in. | email, name, role [A-33], active flag | TBD (signature, professional license: Q-37, Q-39) |
| Client | Tenant | Who the lab works for. | name | **TBD** (Q-41) |
| Project | Tenant → Client | A construction project under control. | name | **TBD** (address, element, specified strength, …: unknown; do not add until documents arrive) |
| ProjectTestConfiguration | Tenant → Project | One row per test age configured on a project. | ageDays, specimenCount | Whether this lives at project level at all: Q-20 |
| FieldRecord | Tenant → Project | One sampling event in the field. | status, record date [A-12] | **TBD** (Q-01 … Q-09) |
| Sample | Tenant → FieldRecord | Material sampled during the event. | — | **TBD** (Q-10, Q-11) |
| Specimen | Tenant → Sample | Molded test piece (cylinder). | status [A-21] | **TBD** (identifier, dimensions, type: Q-12, Q-13, Q-15) |
| SpecimenTest | Tenant → Specimen | A test of a specimen at a given age. | ageDays [A-15], status, performedAt, performedBy | **TBD** measurements and calculated values (Q-24 … Q-26) |
| Report | Tenant → Project | Historical issued document. | templateKey, version, status, snapshot, storageKey, checksum, generatedAt/By | Numbering (Q-51), signatures (Q-37) |

### Why `SpecimenTest` and not `Test`

`Test` collides with test-framework vocabulary (`*.spec.ts`, `test/` folders, "unit
test"). In code, the entity is `SpecimenTest`, the NestJS module is `specimen-tests`,
and the URL path is `/tests` (users see "pruebas"/"ensayes"). This is a naming choice
only, not a domain claim.

## Derived concepts (never stored as source data)

| Concept | Derived from | How |
|---------|-------------|-----|
| Scheduled test date | Age reference date [A-12] + `SpecimenTest.ageDays` | `scheduledTestDate()` in `apps/backend/src/specimen-tests/domain/test-schedule.ts` |
| Specimen age at a date | Age reference date, target date | `specimenAgeInDays()` |
| Due status (overdue / due today / upcoming) | Scheduled date, "today" in tenant timezone, test status | `classifyDueStatus()` |
| Specimen "scheduled"/"tested" | Statuses of its SpecimenTests | See [lifecycle.md](lifecycle.md#specimen-a-21) |
| Pending tests list | SpecimenTests with status `SCHEDULED`/`IN_PROGRESS`, plus scheduled date | Query in the `specimen-tests` module |
| Bitácora | Project + FieldRecords + Samples + Specimens + SpecimenTests | Read query in the `bitacora` module |
| Field record completeness | Required-field rules | **BLOCKED** on Q-33 |
| Report readiness | Readiness rules | **BLOCKED** on Q-35 |
| Calculated test values | Measurements + formulas | **BLOCKED** on Q-25, Q-26. `TODO: VALIDATE WITH LAB DOCUMENTATION` |

### A deliberate exception: `SpecimenTest.ageDays` is stored

`ageDays` is copied from `ProjectTestConfiguration` when tests are planned. It is
**not** a duplicate, because it records *what was planned for this specimen* at that
moment. If the configuration changes later, existing plans don't move [A-15, Q-22].
The scheduled **date** is not stored. It's derived from `ageDays` and the reference
date, so correcting a mistyped pour date fixes every scheduled date automatically.

If the pending-tests query ever becomes slow (unlikely at [A-50] scale), a stored
`scheduledDate` can be added and maintained by the domain service. That
denormalization must be recorded as an ADR.

## Entities we have deliberately NOT created

| Candidate | Why not yet |
|-----------|-------------|
| Bitácora table | It's a derived view (ADR-004). |
| Truck / Delivery | It's unknown whether it's 1:1 with FieldRecord or 1:N (Q-05). It may just be fields on FieldRecord. |
| Supplier / Plant / MixDesign catalogs | Unknown whether these are reusable entities or free text (Q-06). |
| Material type discriminator | Only concrete is in scope. See [future.md](../roadmap/future.md#additional-materials). |
| Attachment / Photo | Requirements unknown (Q-08, Q-30). The generic `File` concept from the boilerplate can be adopted when needed. |
| Signature | Requirements unknown (Q-37, Q-38). |
| Equipment / Calibration | Unknown (Q-29). |
| AuditEvent | Planned for Phase 10. Shape depends on Q-54. See [../architecture/overview.md](../architecture/overview.md#security--auditability). |
