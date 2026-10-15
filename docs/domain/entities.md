# Domain Entities

> Derived from the first lab documents (FPC01-01, FPC01-02, FPC06-01, FPC06-04),
> analyzed 2026-10-14 in [analysis/](analysis/README.md). Fields not printed on a form
> cite an assumption. Physical schema: [../database/schema.md](../database/schema.md).

## Source-of-truth entities

| Entity | Lab term (form) | Owned by | Purpose | Attributes |
|--------|-----------------|----------|---------|------------|
| Tenant | Laboratory (report header/footer) | — | A laboratory company. Isolation boundary. | name, slug, timezone [A-14], legalName, address, phone. TBD: logos, accreditation (Q-52) |
| User | Muestreador, jefe de laboratorio, … | Tenant | A person who logs in. | email, name, role [A-33], active flag. TBD: signature, title (Q-37, Q-39) |
| Client | Solicitante (FPC01-01) / Contratista (FPC06-04) | Tenant | Who the lab works for. | name, contactName, contactPhone [A-70]. TBD: report code (Q-56) |
| Project | Obra | Tenant → Client | A construction project under control. | name (official, Q-78), location. TBD: report code (Q-56) |
| ProjectTestConfiguration | "Edades configurables" (general_flow.png) | Tenant → Project | One row per test age configured on a project. | ageDays, specimenCount. Level still Q-20 / Q-74 |
| FieldRecord | Registro de campo (FPC01-01) | Tenant → Project | One pour (*colado*). | registryNumber (Q-55), pourDate, supplier, production [A-74]; specified and ticket parameters [A-75]; ambient conditions [A-64]; equipment codes [A-65]; unit-weight inputs, air content; programmed/cast element, observations, samplerName; mix design, admixture, mixing equipment, compaction method [A-69] |
| Delivery | Entrega (row of FPC01-01) | Tenant → FieldRecord | One truck or batch received. [A-60] | sequence, ticketNumber, volumeM3, plant departure / site arrival / pour start / pour end times [A-66], ambient and concrete temperature, slump readings 1 and 2 |
| Sample | Muestra | Tenant → Delivery | Concrete taken from one delivery to mold specimens. [A-61] | sampleNumber (Q-57), specimenType [A-63], moldedAt |
| Specimen | Espécimen (cilindro, viga, cubo) | Tenant → Sample | Molded test piece. | status [A-21], specimenNumber (Q-58), moldCode [A-62] |
| SpecimenTest | One row of FPC06-01 | Tenant → Specimen | Test of a specimen at a planned age. | ageDays [A-15], status, testDate, height ×2, diameter ×2, maxLoadKgf, loadDurationS, failureType, withinAgeTolerance [A-71], pressCode, dimensionEquipment, performedBy [A-67] |
| Report | Informe (FPC06-04) | Tenant → FieldRecord | Historical issued document. [A-68] | reportNumber (Q-56), templateKey, version, status, snapshot, storageKey, checksum, generatedAt/By, finalizedAt/By |

### Why `SpecimenTest` and not `Test`

`Test` collides with test-framework vocabulary (`*.spec.ts`, `test/` folders, "unit
test"). In code, the entity is `SpecimenTest`, the NestJS module is `specimen-tests`,
and the URL path is `/tests` (users see "ensayes"). This is a naming choice only, not a
domain claim.

### Why `Delivery` sits between FieldRecord and Sample

On FPC01-01 every truck is a row with its own times, temperatures and slump. The
specimen reference is written on the row of the truck that was sampled, and the
Bitácora/report take that truck's slump and temperature (Q-66). Without the Delivery
level, those values would have to be copied onto the Sample.

## Derived concepts (never stored as source data)

| Concept | Derived from | How |
|---------|-------------|-----|
| Scheduled test date | `FieldRecord.pourDate` + `SpecimenTest.ageDays` [A-11, A-12 confirmed] | `scheduledTestDate()` in `apps/backend/src/specimen-tests/domain/test-schedule.ts` |
| Specimen age at a date | pourDate, target date | `specimenAgeInDays()` |
| Due status (overdue / due today / upcoming) | Scheduled date, "today" in tenant timezone, test status | `classifyDueStatus()` |
| Specimen "scheduled"/"tested" | Statuses of its SpecimenTests | See [lifecycle.md](lifecycle.md#specimen-a-21) |
| Pending tests list | SpecimenTests with status `SCHEDULED`/`IN_PROGRESS`, plus scheduled date | Query in the `specimen-tests` module |
| Cumulative volume (*acumulado*) | Running sum of `Delivery.volumeM3` by sequence | [A-60] |
| Bitácora (FPC01-02) | Record + delivery + sample + specimen + test | Read query in the `bitacora` module. Columns: [analysis/FPC01-02.md](analysis/FPC01-02.md) |
| Compression worksheet (FPC06-01) | SpecimenTests of one project on one test date | Printable view [A-72, Q-69] |
| Means, area, load in N, stress (kgf/cm², MPa), % of f'c, loading rate, per-age averages | SpecimenTest readings + `specifiedStrengthKgCm2` | **BLOCKED** on Q-59, Q-61. Candidate formulas in [analysis/FPC06-01.md](analysis/FPC06-01.md). `TODO: VALIDATE WITH LAB DOCUMENTATION` |
| Unit weight (*masa unitaria*) | Tare, tare + sample, mold factor | **BLOCKED** on Q-67 |
| Field record completeness | Required-field rules | **BLOCKED** on Q-33 |
| Report readiness | All tests of the record's specimens completed (candidate, Q-35) | **BLOCKED** on Q-35 |

### A deliberate exception: `SpecimenTest.ageDays` is stored

`ageDays` is copied from `ProjectTestConfiguration` when tests are planned. It is
**not** a duplicate, because it records *what was planned for this specimen* at that
moment. If the configuration changes later, existing plans don't move [A-15, Q-22].
The scheduled **date** is not stored. It's derived from `ageDays` and `pourDate`, so
correcting a mistyped pour date fixes every scheduled date automatically.

If the pending-tests query ever becomes slow (unlikely at [A-50] scale), a stored
`scheduledDate` can be added and maintained by the domain service. That
denormalization must be recorded as an ADR.

## Entities we have deliberately NOT created

| Candidate | Why not yet |
|-----------|-------------|
| Bitácora table | It's a derived view (ADR-004), confirmed by FPC01-02: every column maps to a source field or a calculation. |
| Test session / worksheet (FPC06-01 sheet) | Treated as a printable view [A-72]. Becomes an entity if the signed sheet must be kept (Q-69). |
| Supplier / cement type / mix design catalogs | Free text on the forms (Q-06). |
| Equipment / calibration catalog | Forms only carry codes (A-65, Q-29, Q-75). |
| Material type discriminator | Only concrete is in scope. See [future.md](../roadmap/future.md#additional-materials). |
| Attachment / photo / sketch | Only the "Croquis de colocación" box suggests one (Q-72). |
| Signature | Forms are signed by hand. Requirements: Q-37, Q-38, Q-73. |
| AuditEvent | Planned for Phase 10. The lab has a quality system (SGC), so Q-54 matters. See [../architecture/overview.md](../architecture/overview.md#security--auditability). |
