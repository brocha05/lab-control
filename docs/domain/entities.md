# Domain Entities

> Derived from the lab documents (FPC01-01, FPC01-02, FPC06-01, FPC06-04, analyzed
> 2026-10-14) and the lab's questionnaire answers (2026-10-15), in
> [analysis/](analysis/README.md). Fields not backed by either cite an assumption.
> Physical schema: [../database/schema.md](../database/schema.md).

## Source-of-truth entities

| Entity | Lab term (form) | Owned by | Purpose | Attributes |
|--------|-----------------|----------|---------|------------|
| Tenant | Laboratory (report header/footer) | — | A laboratory company. Isolation boundary. One lab, Colima (Q-44, Q-46). | name, slug, timezone, legalName, address, phone |
| User | Jefe de Control de Calidad, Coordinador del SGC, … | Tenant | A person who logs in. | email, name, role ([Roles](#roles)), active flag; draft: title, signature image, isTechnicalSignatory (Q-37) |
| Client | Solicitante (FPC01-01) / Contratista (FPC06-04) | Tenant | Who the lab works for. | name, code (3–4 letters, Q-56), contactName, contactPhone [A-70] |
| Project | Obra | Tenant → Client | A construction project under control. | name (official, Q-78), code (3–4 letters, Q-56), location; draft: report defaults (Q-64) |
| ProjectTestConfiguration | Edades de ensayo | Tenant → Project | The project's **default** test ages (Q-20). | ageDays, specimenCount (usually 2, Q-14) |
| Holiday (draft) | Día festivo | Tenant | Moves test dates (Q-21). | date, name (Q-81) |
| ConcreteSupplier, CementType (draft) | Proveedor, Tipo cemento | Tenant | Catalogs users can extend (Q-06). | name |
| FieldRecord | Registro de campo (FPC01-01) | Tenant → Project | One pour (*colado*), transcribed from paper (Q-49). | registrySequence (`MCH-NNN`, per project, Q-55), frontNumber (Q-56), pourDate, supplier, production (Q-07); specified parameters; ambient conditions [A-64]; equipment codes; unit-weight inputs, air content; elements, observations, samplerName, approvedByName (Q-73) |
| Delivery | Entrega (row of FPC01-01) | Tenant → FieldRecord | One truck or batch. 7 per sheet, several sheets per record (Q-71, Q-77). | sequence, ticketNumber, volumeM3, times [A-66], temperatures, slump 1 and 2 (Q-66), ticket ("remisión") parameters (Q-65) |
| Sample | Muestra | Tenant → Delivery | Concrete from one delivery, molded into specimens. | sampleNumber (per project, Q-57), specimenType [A-63], moldedAt |
| Specimen | Espécimen (cilindro, viga, cubo) | Tenant → Sample | Molded test piece. | status [A-21], specimenNumber (per project, Q-58), moldCode (reusable mold, A-62) |
| SpecimenTest | One row of FPC06-01 | Tenant → Specimen | Compression test at an age. | ageDays (editable until tested, Q-22), keepExactDate (Q-21), status, testDate, testTime (Q-62), height ×2, diameter ×2, maxLoadKgf, loadDurationS (Q-63), failureType (Q-60), pressCode, dimensionEquipment, performedBy |
| Report | Informe (FPC06-04) | Tenant → FieldRecord | Issued document: one per record, one page per sample (Q-71). | reportNumber (Q-56), version (Q-36), isPartial (Q-35), report-time fields (Q-64), status, snapshot, PDF, checksum, supersededAt |

### Why `SpecimenTest` and not `Test`

`Test` collides with test-framework vocabulary (`*.spec.ts`, `test/` folders, "unit
test"). In code, the entity is `SpecimenTest`, the NestJS module is `specimen-tests`,
and the URL path is `/tests` (users see "ensayes"). This is a naming choice only, not a
domain claim.

### Why `Delivery` sits between FieldRecord and Sample

On FPC01-01 every truck is a row with its own ticket, times, temperatures and slump.
The specimen reference is written on the row of the truck that was sampled, and the
report always uses that truck's slump and temperature (Q-66). Trucks that weren't sampled
stay on the record for control.

## Numbering

| Number | Printed as | Rule |
|--------|-----------|------|
| Registro | `MCH-068` | Consecutive per project from 1 (Q-55). Per front? Q-79 |
| Muestra | `102` | Consecutive per project (Q-57) |
| Espécimen | `405` | Consecutive per project (Q-58) |
| Informe | `MAR-PVLT-F1-CTO-REC-068` | client code · project code · `F` + front · `CTO` · `REC` · registro (Q-56). Same code for a corrected report (Q-36) |

## Roles

From the lab's hierarchy (Q-39) and permissions (Q-40, Q-34). Enforced in Phase 10.1.

| Role | Lab position | Captures records/tests | Issues reports | Corrects issued data |
|------|-------------|------------------------|----------------|----------------------|
| `QUALITY_MANAGER` | Jefe de Control de Calidad (Technical Signatory) | yes | **only this role** | yes |
| `QMS_COORDINATOR` | Coordinador del SGC | **yes (main role)** | no | yes |
| `LAB_MANAGER` | Jefe de Laboratorio | mostly on paper | signs | no |
| `FIELD_CREW_CHIEF` | Jefe de Brigada de Campo (muestreador) | mostly on paper | no | no |

User administration: `QUALITY_MANAGER` (A-81, Q-83). The Auxiliar doesn't use the system.

## Derived concepts (never stored as source data)

| Concept | Derived from | How |
|---------|-------------|-----|
| Scheduled test date | `pourDate + ageDays`, moved past Sundays/holidays unless `keepExactDate` (Q-21) | `scheduledTestDate()` in `apps/backend/src/specimen-tests/domain/test-schedule.ts` |
| Age tolerance | Age, molding time (else site arrival), test date and time (Q-62) | `ageToleranceHours()`, `isWithinAgeTolerance()` |
| Specimen age at a date | pourDate, target date | `specimenAgeInDays()` |
| Due status (overdue / due today / upcoming) | Scheduled date, "today" in tenant timezone, test status | `classifyDueStatus()` |
| Specimen "scheduled"/"tested" | Statuses of its SpecimenTests | See [lifecycle.md](lifecycle.md#specimen-a-21) |
| Cumulative volume (*acumulado*), sheet number | Delivery volumes and sequence (7 per sheet) | Q-71, Q-77 |
| Bitácora (FPC01-02) | Record + delivery + sample + specimen + test, one tab per project | `bitacora` module (Q-68) |
| Compression worksheet (FPC06-01) | SpecimenTests of one project on one test date | Printable view; the signed paper is the evidence (Q-69) |
| Mean dimensions, area, N, stress (kgf/cm², MPa), % of f'c, loading rate, per-age averages | SpecimenTest readings + `specifiedStrengthKgCm2` | `compression.ts`, NMX-C-083 rules confirmed (Q-26, Q-59, Q-61) |
| Unit weight | (tare + sample − tare) × mold factor | Q-67 |
| Field record completeness | Everything filled in on the lab's example (Q-33) | Phase 4.4 |
| Report readiness | All non-cancelled tests completed, unless a partial report is requested (Q-35) | Phase 9.4 |
| Report number | Client code, project code, front, registro | Q-56 |

### A deliberate exception: `SpecimenTest.ageDays` is stored

`ageDays` is copied from the project's default ages when tests are planned, and the
user may change it until the specimen is tested (Q-22). Changing the project defaults
later doesn't move existing tests (A-15). The scheduled **date** is not stored: it is
derived from `ageDays` and `pourDate`, so correcting a mistyped pour date fixes every
scheduled date automatically.

## Entities we have deliberately NOT created

| Candidate | Why not yet |
|-----------|-------------|
| Bitácora table | A derived view (ADR-004): every FPC01-02 column maps to a source field or a calculation. |
| Test session / worksheet | A printable view; the signed paper is the audit evidence (Q-69). |
| Mix design catalog | "Número y fecha del proporcionamiento" is free text entered at report time (Q-64). |
| Equipment / calibration catalog | Not needed to start (Q-29). One press, direct readings (Q-75). |
| Front (*frente*) entity | A number on the record is enough until Q-79 says otherwise. |
| Material type discriminator | Only concrete is in scope. See [future.md](../roadmap/future.md#additional-materials). |
| AuditEvent | **Required** by the accreditation (Q-54); Phase 10.2, needs an ADR for its shape. |
