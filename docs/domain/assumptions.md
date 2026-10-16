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
| A-01 | The ownership hierarchy is Client → Project → FieldRecord → Sample → Specimen → Test. | Described by the product owner. | CONFIRMED (FPC01-01 + questionnaire 2026-10-15): Client → Project → FieldRecord → Delivery → Sample → Specimen → Test | Q-01, Q-10 |
| A-02 | A Project belongs to exactly one Client. | Described hierarchy. | CONFIRMED (questionnaire 2026-10-15: one client per project; a client can have several projects) | Q-41 |
| A-03 | A FieldRecord belongs to exactly one Project. | Described hierarchy. | CONFIRMED (FPC01-01: one "Obra y ubicación" per record) | Q-04 |
| A-04 | A Sample belongs to one FieldRecord, a Specimen to one Sample, and a Test to one Specimen. | Described hierarchy. | CONFIRMED (questionnaire 2026-10-15, Q-71): a Sample belongs to a Delivery | Q-10, Q-16 |
| A-05 | Specimen → Test is **1:N** in the schema. It may really be 1:1 (one destructive test per specimen). | Described model says "Tests" (plural). We keep 1:N because going from 1:N to 1:1 is easier than the reverse. | PARTIAL (FPC06-01): each specimen is tested once. 1:N kept for cancel/replan | Q-16 |
| A-06 | The Bitácora is per Project. | Described in the brief ("Project + Field Records + …"). | CONFIRMED (questionnaire 2026-10-15, Q-68): one lab-wide workbook with a tab per project | Q-27 |
| A-07 | Reports are generated per Project. | Described API (`POST /projects/:id/reports`). | REJECTED (FPC06-04: one muestra per report). Impact: `Report.projectId` → `fieldRecordId`, endpoints, data-flow | Q-31 |

## Test scheduling

| ID | Assumption | Why we assume it | Status | Related question |
|----|-----------|------------------|--------|------------------|
| A-10 | Test ages (in days) and specimen counts per age are configured **per Project** (`ProjectTestConfiguration`). | Proposed in the brief as an example. | PARTIAL (questionnaire 2026-10-15, Q-20/Q-22): the project specification gives the default ages, but each specimen's age can be edited until it is tested. Impact: config = project default; `SpecimenTest.ageDays` editable | Q-19, Q-20 |
| A-11 | Scheduled test date = *age reference date* + *age in days*. | Example in the brief (2026-10-02 + 7 → 2026-10-09). | CONFIRMED (FPC06-04, FPC01-02: 02/09 + 3 = 05/09, + 7 = 09/09) | Q-18 |
| A-12 | The *age reference date* is the FieldRecord's date. | It's the only date we know exists. It might really be a casting/sampling date per Sample. | CONFIRMED (FPC06-04): the reference date is the "Fecha del colado". Impact: `recordDate` renamed `pourDate` | Q-18 |
| A-13 | Ages count **calendar days**. Scheduled dates are not shifted for weekends or holidays. | Simplest rule consistent with the example. | REJECTED (questionnaire 2026-10-15, Q-21): a date on a Sunday or holiday moves to the next day unless the client requires the exact age. Impact: `test-schedule.ts`, `keep_exact_date` (draft) | Q-21 |
| A-14 | Each tenant operates in one timezone. Domain dates (pour date, scheduled date) are **date-only** values in that timezone. | Avoids off-by-one errors across UTC boundaries. | CONFIRMED (questionnaire 2026-10-15, Q-46): Colima only | Q-46 |
| A-15 | The age configuration in effect when tests are planned is copied onto each Test (`ageDays`). Later configuration changes don't move existing tests. | Historical consistency: a plan made on day 1 shouldn't silently change. | PARTIAL (questionnaire 2026-10-15, Q-22): config changes don't move existing tests, but a user may change one specimen's age until it is tested | Q-22 |

## Lifecycle / workflow

| ID | Assumption | Why we assume it | Status | Related question |
|----|-----------|------------------|--------|------------------|
| A-20 | FieldRecord states: `DRAFT`, `COMPLETED`, `CANCELLED`. | Suggested in the brief. | PARTIAL (questionnaire 2026-10-15, Q-33/Q-73): "completed" = the paper record is signed and its unused spaces cancelled | Q-33 |
| A-21 | Specimen stores only `CREATED` / `CANCELLED`. "Scheduled" and "tested" are **derived** from its Tests. | Avoids two sources of truth for the same fact. See [lifecycle.md](lifecycle.md). | OPEN | Q-16 |
| A-22 | Test states: `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`. | Suggested in the brief. Whether `IN_PROGRESS` is needed is unknown. | OPEN (no form shows an in-progress state) | Q-24 |
| A-23 | Report states: `DRAFT`, `GENERATED`, `FINAL`. A `FINAL` report is immutable. Corrections create a new version. | Suggested in the brief, plus the historical-artifact requirement. | PARTIAL (questionnaire 2026-10-15, Q-36): a correction is a new issue with the same code; the old one is recalled | Q-36, Q-37 |
| A-24 | Records can be cancelled but not hard-deleted once they leave `DRAFT`. | Auditability for a testing laboratory. | PARTIAL (questionnaire 2026-10-15, Q-34): corrections after issuing are allowed, only for Coordinador del SGC / Jefe de Control de Calidad, and audited (Q-54) | Q-34 |

## Organization / tenancy / users

| ID | Assumption | Why we assume it | Status | Related question |
|----|-----------|------------------|--------|------------------|
| A-30 | Tenant = one laboratory company. There are no branches or sub-labs inside a tenant. | Single customer today. | CONFIRMED (questionnaire 2026-10-15, Q-44) | Q-44 |
| A-31 | A User belongs to exactly one Tenant. | Simplest multi-tenant model. | OPEN | Q-45 |
| A-32 | User email is globally unique (login does not require a tenant selector). | Simplest login UX. | OPEN | Q-45 |
| A-33 | The initial roles are placeholders (`ADMIN`, `MEMBER`) until real lab roles are known. | Roles are unknown. | REJECTED (questionnaire 2026-10-15, Q-39/Q-40). Impact: `UserRole` = QUALITY_MANAGER, QMS_COORDINATOR, LAB_MANAGER, FIELD_CREW_CHIEF | Q-39, Q-40 |
| A-34 | Only laboratory staff use the system. Clients don't log in. | Not mentioned in the brief. | PARTIAL (questionnaire 2026-10-15, Q-43): true for MVP; a client portal is wanted later | Q-43 |

## Presentation / locale

| ID | Assumption | Why we assume it | Status | Related question |
|----|-----------|------------------|--------|------------------|
| A-40 | The UI and reports are in Spanish. | Domain vocabulary (Bitácora, trompo, "Informe de pruebas…"). | CONFIRMED (all forms) | Q-47 |
| A-41 | Metric units. | Regional context. | CONFIRMED (cm, mm, m³, °C, kgf, kgf/cm²; the report adds N and MPa) | Q-48 |
| A-42 | Field staff use phones/tablets and may have poor connectivity. Offline support is **not** in MVP scope. | From the brief. | CONFIRMED (questionnaire 2026-10-15, Q-49): capture on paper, enter later | Q-49 |

## Technical

| ID | Assumption | Why we assume it | Status | Related question |
|----|-----------|------------------|--------|------------------|
| A-50 | Expected scale is small: a handful of tenants, tens of users, thousands (not millions) of specimens per year. | Single-laboratory product. | CONFIRMED (questionnaire 2026-10-15, Q-50): 10–15 projects/year, 20–40 pours/month | Q-50 |
| A-51 | Generated PDFs and attachments go in private S3-compatible storage. Downloads go through the API after the tenant check (ADR-009). | Security requirement in the brief. | OPEN | Q-30 |
| A-52 | Report generation can run synchronously in the API process at MVP scale. | See ADR-006. Revisit if generation exceeds a few seconds. | OPEN | — |

## From the first lab documents (2026-10-14)

Introduced while modelling FPC01-01, FPC01-02, FPC06-01 and FPC06-04
([analysis/](analysis/README.md)). Each one fills a gap the documents leave open.

| ID | Assumption | Why we assume it | Status | Related question |
|----|-----------|------------------|--------|------------------|
| A-60 | A FieldRecord has 1:N **Deliveries** (one per table row: truck or batch). Cumulative volume is derived, not stored. | FPC01-01 table "Número de la entrega" 1–4. "Acumulado" = running sum. | CONFIRMED (questionnaire 2026-10-15, Q-71/Q-77): up to 7 deliveries per sheet, several sheets per record | Q-05, Q-77 |
| A-61 | A Sample belongs to exactly one Delivery: the row where its specimen reference is written. Deliveries without specimens have no Sample. One delivery may have more than one sample. | FPC01-01: reference only on row 1, "—" on rows 2–4. Revenimiento/temperatura in FPC01-02 match row 1. | CONFIRMED (questionnaire 2026-10-15, Q-66/Q-71) | Q-10, Q-66 |
| A-62 | Mold keys and specimen keys in "Referencia de los especímenes" pair up by position (020↔405, 092↔406, …). | Both lists have 4 items in the same cell. | CONFIRMED (questionnaire 2026-10-15, Q-58) | Q-58 |
| A-63 | The specimen type (1–5) is per Sample: all specimens of a sample share it. | One "tipo" per reference cell. | OPEN | Q-15 |
| A-64 | The ambient conditions are three single-choice groups (sky, wind, lighting). | The `//` separators on FPC01-01. One mark per group in the example. | OPEN | — |
| A-65 | Equipment is recorded as free-text codes on the record/test until an equipment catalog is decided. | FPC01-01 "Trazabilidad", FPC06-01 "Prensa"/"Dimensiones". No calibration data on the forms. | CONFIRMED (questionnaire 2026-10-15, Q-29): no equipment catalog to start | Q-29, Q-75 |
| A-66 | The first time pair of a delivery holds salida planta / llegada obra (ready-mix) or hechura / disponible (site-mixed). Times are on the pour date. | Column header "(Elaboración) Traslado (hechura/disponible) salida planta/llegada obra". | OPEN | Q-77 |
| A-67 | Dimensions, load, load time, failure type and age tolerance are recorded per SpecimenTest (at test time). | FPC06-01 columns. | CONFIRMED (questionnaire 2026-10-15, Q-24/Q-62): plus the test time of day | Q-24 |
| A-68 | A Report covers one FieldRecord (and its sample). | FPC06-04: one "número de muestra". Report number suffix = registro suffix (068). | CONFIRMED (questionnaire 2026-10-15, Q-71): one page (or more) per sample | Q-31, Q-71 |
| A-69 | Report fields with no box on FPC01-01 (mix design number/date, admixture, mixing equipment, compaction method) are captured on the FieldRecord. | They describe the pour. Nowhere else to put them. | REJECTED (questionnaire 2026-10-15, Q-64): entered by the report author at report time, usually the same for the project. Impact: project defaults + report fields (draft) | Q-64 |
| A-70 | The report "Contacto" (name + phone) belongs to the Client. | Printed next to "Contratista". | OPEN | Q-41 |
| A-71 | "Tolerancia edad" is entered by hand (Sí/No) until the tolerance rule is known. | FPC06-01 shows a handwritten "Sí". The rule needs molding/test times we don't have. | REJECTED (questionnaire 2026-10-15, Q-62): tolerance is derived from molding time and test time. Impact: `ageTolerance()`, `test_time` (draft) | Q-62 |
| A-72 | The FPC06-01 worksheet is a derived, printable view of SpecimenTests per project and test date, not a stored entity. | Its rows are SpecimenTests. Its header is shared values. | CONFIRMED (questionnaire 2026-10-15, Q-69): printable view; the signed paper is the evidence | Q-69 |
| A-73 | Calculated test values are not stored in the draft schema. | No formula is printed; the documents disagree on rounding. | PARTIAL (questionnaire 2026-10-15, Q-26/Q-59/Q-61): formulas confirmed and implemented as pure functions; storing results is still development-plan 7.5 | Q-59, Q-61, development-plan 7.5 |
| A-74 | "Hecho en obra / Premezclado" is per FieldRecord. | FPC01-02 column, merged across the sample's rows. | PARTIAL (questionnaire 2026-10-15, Q-07): not on the form; entered by the Bitácora clerk | Q-64 |
| A-75 | The specified ("Datos de proyecto") and ticket ("Remisión") parameters are per FieldRecord, not per Project. | They are on FPC01-01. Different elements of one obra can have different f'c. | PARTIAL (questionnaire 2026-10-15, Q-65): specified values per record; ticket values per delivery. Impact: ticket fields moved to Delivery (draft) | Q-65, Q-74 |

## From the questionnaire answers (2026-10-15)

| ID | Assumption | Why we assume it | Status | Related question |
|----|-----------|------------------|--------|------------------|
| A-76 | Client and project codes (3–4 uppercase letters, used in the report number) are stored on Client and Project. A client code is unique in the tenant; a project code is unique within its client. | Q-56 asks for "3 o 4 letras" per client and per project. Uniqueness keeps report numbers unambiguous. | OPEN | Q-56 |
| A-77 | MPa = unrounded kgf/cm² stress ÷ 10.2, rounded to 0.1. | Matches every value on the issued report (406 → 20.7). The lab gave the factor but not the input. | OPEN | Q-80 |
| A-78 | Holidays come from a calendar the lab maintains. Until it exists, only Sundays move a test date. | The lab didn't say which holidays apply. | OPEN | Q-81 |
| A-79 | The front number ("F1") is stored per field record, default 1. | Q-56: a project can have several fronts. Where the front is chosen isn't on the form. | OPEN | Q-79 |
| A-80 | Per-age averages are computed from the rounded values and printed with one decimal. | Q-26 ("con valores redondeados") + the report layout (one decimal). | OPEN | Q-80 |
| A-82 | When a sample's specimens don't match the project's default ages (e.g. 5 specimens for 2 + 2), extra specimens go to the last age and missing ones shorten the last ages. The user then edits single tests. | Q-14 says splits vary; planning shouldn't block completion. | OPEN | Q-14, Q-22, Q-87 |
| A-81 | The Jefe de Control de Calidad (`QUALITY_MANAGER`) administers users. | Top of the hierarchy and sole report authorizer (Q-39/Q-40). | OPEN | Q-83 |
| A-83 | The time of each break is optional. Without it the age tolerance shows "sin hora" instead of Sí/No. | FPC06-01 has no time column (Q-89). | OPEN | Q-89 |
| A-84 | The worksheet of a date lists the open tests due on or before it (overdue ones included) and the tests completed on it. | An overdue specimen is broken on the day it is actually tested. | OPEN | Q-94 |
| A-85 | Saved results can be corrected by saving the sheet again, by any role, until an issued report includes them. | The lab corrects the paper sheet; permissions come in Phase 10.1. | OPEN | Q-95 |
| A-86 | A test date can't be in the future or before the pour date; a test outside its age tolerance is still recorded. | Q-23 (recorded and noted on the report). | OPEN | Q-96 |
| A-87 | The compression worksheet covers cylinders (15×30, 10×20, or no type given). Beams and cubes wait for their own forms. | Q-70: flexural tests are a short-term future; the area formula is for cylinders. | OPEN | Q-70, Q-97 |
| A-88 | Press and dimension instruments are typed once per sheet and stored on each test. No equipment catalog yet. | One press, direct readings (Q-75); equipment list is Q-29. | OPEN | Q-29, Q-75 |
| A-89 | The failure type (1–6, NMX-C-083 patterns) is optional per specimen. | Q-60: the worksheet is authoritative but often leaves it blank. | OPEN | Q-60, Q-98 |
| A-90 | There is no "start" (IN_PROGRESS) step: entering the readings completes the test. | No form shows an in-progress state (A-22). | OPEN | Q-24 |
| A-91 | The sheet's signatures and observaciones stay on paper; the system prints blank signature lines for the Jefe de laboratorio and the Coordinador del SGC. | Q-69: printable any time, kept signed on paper. | OPEN | Q-99 |
| A-92 | Cancelled specimens don't appear in the Bitácora. | A damaged specimen has no result to log. | OPEN | Q-100 |
| A-93 | Only completed field records appear in the Bitácora; drafts and cancelled ones don't. | A draft is still being transcribed. | OPEN | Q-100 |
| A-94 | Unit weight in the Bitácora is rounded to 1 kg/m³. | Q-67 gave the formula, not the rounding. | OPEN | Q-67 |
| A-95 | The Excel export follows FPC01-02: a tab per project, record/sample data in merged cells, untested specimens show their scheduled date in grey. | Q-68 (workbook with a tab per project). | OPEN | Q-91 |
| A-96 | A new report copies the author's fields (mixing equipment, compaction, mix design, admixture) from the project's latest report; observaciones start empty. | Q-64: usually the same for the whole project. | OPEN | Q-64 |
| A-97 | Until scanned signatures are uploaded, the PDF prints blank signature lines for the Jefe de laboratorio and the Jefe de control de calidad. | Q-37 accepts scanned signatures, but none were provided yet. | OPEN | Q-101 |
| A-98 | Only full reports (every specimen tested) are generated; partial reports wait for the numbering answer. | Q-82 is open. | OPEN | Q-82 |
| A-99 | "Fecha de informe" is the day the PDF is generated, in the lab's timezone. | FPC06-04 shows the issue date. | OPEN | Q-102 |
