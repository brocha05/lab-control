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
| A-01 | The ownership hierarchy is Client → Project → FieldRecord → Sample → Specimen → Test. | Described by the product owner. | PARTIAL (FPC01-01): there is a Delivery level, FieldRecord → Delivery → Sample | Q-01, Q-10 |
| A-02 | A Project belongs to exactly one Client. | Described hierarchy. | PARTIAL (FPC01-01, FPC06-04): one solicitante/contratista per document | Q-41 |
| A-03 | A FieldRecord belongs to exactly one Project. | Described hierarchy. | CONFIRMED (FPC01-01: one "Obra y ubicación" per record) | Q-04 |
| A-04 | A Sample belongs to one FieldRecord, a Specimen to one Sample, and a Test to one Specimen. | Described hierarchy. | PARTIAL (FPC01-01): a Sample belongs to a Delivery (A-61) | Q-10, Q-16 |
| A-05 | Specimen → Test is **1:N** in the schema. It may really be 1:1 (one destructive test per specimen). | Described model says "Tests" (plural). We keep 1:N because going from 1:N to 1:1 is easier than the reverse. | PARTIAL (FPC06-01): each specimen is tested once. 1:N kept for cancel/replan | Q-16 |
| A-06 | The Bitácora is per Project. | Described in the brief ("Project + Field Records + …"). | OPEN (FPC01-02 has no obra column; Q-68) | Q-27 |
| A-07 | Reports are generated per Project. | Described API (`POST /projects/:id/reports`). | REJECTED (FPC06-04: one muestra per report). Impact: `Report.projectId` → `fieldRecordId`, endpoints, data-flow | Q-31 |

## Test scheduling

| ID | Assumption | Why we assume it | Status | Related question |
|----|-----------|------------------|--------|------------------|
| A-10 | Test ages (in days) and specimen counts per age are configured **per Project** (`ProjectTestConfiguration`). | Proposed in the brief as an example. | OPEN (general_flow.png: ages "configurables"; FPC01-01 has "Edad definitiva" per record, Q-74) | Q-19, Q-20 |
| A-11 | Scheduled test date = *age reference date* + *age in days*. | Example in the brief (2026-10-02 + 7 → 2026-10-09). | CONFIRMED (FPC06-04, FPC01-02: 02/09 + 3 = 05/09, + 7 = 09/09) | Q-18 |
| A-12 | The *age reference date* is the FieldRecord's date. | It's the only date we know exists. It might really be a casting/sampling date per Sample. | CONFIRMED (FPC06-04): the reference date is the "Fecha del colado". Impact: `recordDate` renamed `pourDate` | Q-18 |
| A-13 | Ages count **calendar days**. Scheduled dates are not shifted for weekends or holidays. | Simplest rule consistent with the example. | PARTIAL (FPC06-01: test on Saturday 05/09/2026, not shifted). Holidays unknown | Q-21 |
| A-14 | Each tenant operates in one timezone. Domain dates (pour date, scheduled date) are **date-only** values in that timezone. | Avoids off-by-one errors across UTC boundaries. | OPEN | Q-46 |
| A-15 | The age configuration in effect when tests are planned is copied onto each Test (`ageDays`). Later configuration changes don't move existing tests. | Historical consistency: a plan made on day 1 shouldn't silently change. | OPEN | Q-22 |

## Lifecycle / workflow

| ID | Assumption | Why we assume it | Status | Related question |
|----|-----------|------------------|--------|------------------|
| A-20 | FieldRecord states: `DRAFT`, `COMPLETED`, `CANCELLED`. | Suggested in the brief. | OPEN | Q-33 |
| A-21 | Specimen stores only `CREATED` / `CANCELLED`. "Scheduled" and "tested" are **derived** from its Tests. | Avoids two sources of truth for the same fact. See [lifecycle.md](lifecycle.md). | OPEN | Q-16 |
| A-22 | Test states: `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`. | Suggested in the brief. Whether `IN_PROGRESS` is needed is unknown. | OPEN (no form shows an in-progress state) | Q-24 |
| A-23 | Report states: `DRAFT`, `GENERATED`, `FINAL`. A `FINAL` report is immutable. Corrections create a new version. | Suggested in the brief, plus the historical-artifact requirement. | OPEN | Q-36, Q-37 |
| A-24 | Records can be cancelled but not hard-deleted once they leave `DRAFT`. | Auditability for a testing laboratory. | OPEN | Q-34 |

## Organization / tenancy / users

| ID | Assumption | Why we assume it | Status | Related question |
|----|-----------|------------------|--------|------------------|
| A-30 | Tenant = one laboratory company. There are no branches or sub-labs inside a tenant. | Single customer today. | OPEN | Q-44 |
| A-31 | A User belongs to exactly one Tenant. | Simplest multi-tenant model. | OPEN | Q-45 |
| A-32 | User email is globally unique (login does not require a tenant selector). | Simplest login UX. | OPEN | Q-45 |
| A-33 | The initial roles are placeholders (`ADMIN`, `MEMBER`) until real lab roles are known. | Roles are unknown. | OPEN (roles seen on the forms are listed in Q-39) | Q-39, Q-40 |
| A-34 | Only laboratory staff use the system. Clients don't log in. | Not mentioned in the brief. | OPEN | Q-43 |

## Presentation / locale

| ID | Assumption | Why we assume it | Status | Related question |
|----|-----------|------------------|--------|------------------|
| A-40 | The UI and reports are in Spanish. | Domain vocabulary (Bitácora, trompo, "Informe de pruebas…"). | CONFIRMED (all forms) | Q-47 |
| A-41 | Metric units. | Regional context. | CONFIRMED (cm, mm, m³, °C, kgf, kgf/cm²; the report adds N and MPa) | Q-48 |
| A-42 | Field staff use phones/tablets and may have poor connectivity. Offline support is **not** in MVP scope. | From the brief. | OPEN | Q-49 |

## Technical

| ID | Assumption | Why we assume it | Status | Related question |
|----|-----------|------------------|--------|------------------|
| A-50 | Expected scale is small: a handful of tenants, tens of users, thousands (not millions) of specimens per year. | Single-laboratory product. | OPEN | Q-50 |
| A-51 | Generated PDFs and attachments go in private S3-compatible storage and are served through short-lived signed URLs. | Security requirement in the brief. | OPEN | Q-30 |
| A-52 | Report generation can run synchronously in the API process at MVP scale. | See ADR-006. Revisit if generation exceeds a few seconds. | OPEN | — |

## From the first lab documents (2026-10-14)

Introduced while modelling FPC01-01, FPC01-02, FPC06-01 and FPC06-04
([analysis/](analysis/README.md)). Each one fills a gap the documents leave open.

| ID | Assumption | Why we assume it | Status | Related question |
|----|-----------|------------------|--------|------------------|
| A-60 | A FieldRecord has 1:N **Deliveries** (one per table row: truck or batch). Cumulative volume is derived, not stored. | FPC01-01 table "Número de la entrega" 1–4. "Acumulado" = running sum. | OPEN | Q-05, Q-77 |
| A-61 | A Sample belongs to exactly one Delivery: the row where its specimen reference is written. Deliveries without specimens have no Sample. One delivery may have more than one sample. | FPC01-01: reference only on row 1, "—" on rows 2–4. Revenimiento/temperatura in FPC01-02 match row 1. | OPEN | Q-10, Q-66 |
| A-62 | Mold keys and specimen keys in "Referencia de los especímenes" pair up by position (020↔405, 092↔406, …). | Both lists have 4 items in the same cell. | OPEN | Q-58 |
| A-63 | The specimen type (1–5) is per Sample: all specimens of a sample share it. | One "tipo" per reference cell. | OPEN | Q-15 |
| A-64 | The ambient conditions are three single-choice groups (sky, wind, lighting). | The `//` separators on FPC01-01. One mark per group in the example. | OPEN | — |
| A-65 | Equipment is recorded as free-text codes on the record/test until an equipment catalog is decided. | FPC01-01 "Trazabilidad", FPC06-01 "Prensa"/"Dimensiones". No calibration data on the forms. | OPEN | Q-29, Q-75 |
| A-66 | The first time pair of a delivery holds salida planta / llegada obra (ready-mix) or hechura / disponible (site-mixed). Times are on the pour date. | Column header "(Elaboración) Traslado (hechura/disponible) salida planta/llegada obra". | OPEN | Q-77 |
| A-67 | Dimensions, load, load time, failure type and age tolerance are recorded per SpecimenTest (at test time). | FPC06-01 columns. | OPEN | Q-24 |
| A-68 | A Report covers one FieldRecord (and its sample). | FPC06-04: one "número de muestra". Report number suffix = registro suffix (068). | OPEN | Q-31, Q-71 |
| A-69 | Report fields with no box on FPC01-01 (mix design number/date, admixture, mixing equipment, compaction method) are captured on the FieldRecord. | They describe the pour. Nowhere else to put them. | OPEN | Q-64 |
| A-70 | The report "Contacto" (name + phone) belongs to the Client. | Printed next to "Contratista". | OPEN | Q-41 |
| A-71 | "Tolerancia edad" is entered by hand (Sí/No) until the tolerance rule is known. | FPC06-01 shows a handwritten "Sí". The rule needs molding/test times we don't have. | OPEN | Q-62 |
| A-72 | The FPC06-01 worksheet is a derived, printable view of SpecimenTests per project and test date, not a stored entity. | Its rows are SpecimenTests. Its header is shared values. | OPEN | Q-69 |
| A-73 | Calculated test values are not stored in the draft schema. | No formula is printed; the documents disagree on rounding. | OPEN | Q-59, Q-61, development-plan 7.5 |
| A-74 | "Hecho en obra / Premezclado" is per FieldRecord. | FPC01-02 column, merged across the sample's rows. | OPEN | Q-64 |
| A-75 | The specified ("Datos de proyecto") and ticket ("Remisión") parameters are per FieldRecord, not per Project. | They are on FPC01-01. Different elements of one obra can have different f'c. | OPEN | Q-65, Q-74 |
