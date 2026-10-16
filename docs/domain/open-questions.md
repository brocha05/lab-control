# Open Questions

These are **questions, not assumptions**. Each one needs an answer from the laboratory
owner/operator or from the official documents before the related part of the system
can be built.

Format: when a question is answered, fill in **Answer**, **Source** (document name,
page, or "interview YYYY-MM-DD"), and **Impact** (which docs/schema/code change).
Don't delete answered questions.

Priority: **P0** blocks the domain schema · **P1** blocks a workflow · **P2** can wait
until after MVP

---

## 1. Field Records

| ID | Pri | Question | Answer | Source | Impact |
|----|-----|----------|--------|--------|--------|
| Q-01 | P0 | What exact fields exist on a Field Record? (Request the blank official form plus 2–3 filled examples.) | Answered. See the field list in the analysis. | FPC01-01 | FieldRecord + Delivery columns |
| Q-02 | P0 | Which fields are required and which are optional? | Everything filled in on the example record is required; unused spaces are cancelled. | Questionnaire 2026-10-15 | Completeness rule (Phase 4.4) |
| Q-03 | P0 | Does a Field Record have an official folio/number? Who assigns it, and what's the format? | "MCH-NNN": MCH = Muestreo de Concreto Hidráulico. Consecutive per project, starts at 1, unique within the project. Can be auto-assigned. | Questionnaire 2026-10-15 | `registry_sequence` unique per project |
| Q-04 | P1 | Can one Field Record span more than one project, or more than one pour/element? | One obra per record. "Elemento(s) programado(s)/colado(s)": one or more elements. | FPC01-01 | A-03 confirmed |
| Q-05 | P0 | Is the concrete truck ("trompo") / delivery information one-per-record, or can a record cover several trucks? | Several trucks per record (4 in the example), one table row each. | FPC01-01 | New `Delivery` entity (A-60) |
| Q-06 | P1 | Are the concrete supplier, plant, or mix design reusable catalog entities, or free text on each record? | Pick from a list, with the option to add new entries. | Questionnaire 2026-10-15 | Supplier / cement-type catalogs (draft) |
| Q-07 | P1 | Which values are measured in the field, and which are copied from delivery tickets? | Measured on site per truck; the "Remisión" values come from each truck's ticket. Site-mixed vs ready-mix has no box; it can go in observations, and the Bitácora clerk knows it. | Questionnaire 2026-10-15 | Ticket fields move to Delivery |
| Q-08 | P1 | Are photos, scanned delivery tickets, or other attachments captured in the field? | The placement sketch is rarely used; a simple drawing or reference is enough. | Questionnaire 2026-10-15 | Optional attachment later |
| Q-09 | P1 | Does the field technician sign the record? Does the client's representative? | Visto bueno: usually the client; otherwise a lab Technical Signatory. | Questionnaire 2026-10-15 | `approved_by_name` (draft) |

## 2. Samples & Specimens

| ID | Pri | Question | Answer | Source | Impact |
|----|-----|----------|--------|--------|--------|
| Q-10 | P0 | What is the difference between a "sample" and a "specimen/cylinder" in the lab's own vocabulary? Is there an intermediate level (e.g. per truck)? | Muestra (e.g. 102) is taken from one delivery; especímenes (405–408) are molded from it. Intermediate level = delivery (entrega). | FPC01-01, FPC01-02, FPC06-04 | Sample → Delivery (A-61) |
| Q-11 | P0 | What information is captured for each sample? | Sample number, specimen type, molding time. Slump/temperature come from its delivery. | FPC01-01, FPC01-02 | Sample columns |
| Q-12 | P0 | What information is captured for each specimen (identifier, dimensions, type, …)? | Specimen key + mold key. Dimensions are measured at test time. | FPC01-01, FPC06-01 | Specimen + SpecimenTest columns |
| Q-13 | P0 | How are specimens identified/labelled physically? Is there a numbering convention? | Specimen numbers are consecutive per project; mold keys are reusable physical molds. | Questionnaire 2026-10-15 | A-62 confirmed |
| Q-14 | P1 | How many cylinders are normally made per sample? Is the number configurable, and by whom? | Usually 4 per sample: 2 per age; the result of an age is the average of the two "sibling" specimens. Can vary (e.g. 1@7, 1@14, 2@28). Specimens go to ages in ascending order. | Questionnaire 2026-10-15 | Planning rule (Phase 6.3) |
| Q-15 | P1 | Are specimen types other than cylinders used (beams, cubes, cores)? | Also 10×20 cylinders, 15 and 10 cm cubes, 50 and 60 cm beams. Short-term future. | Questionnaire 2026-10-15 | `CUBE_10` added; compression of cylinders first |
| Q-16 | P0 | Is each specimen tested **exactly once** (destructive test)? Or can one specimen have several tests? | Each specimen is tested once. | FPC06-01 + questionnaire | A-05 kept 1:N for replanning |
| Q-17 | P2 | Are specimen curing conditions or transport to the lab tracked? | | | |

## 3. Test scheduling

| ID | Pri | Question | Answer | Source | Impact |
|----|-----|----------|--------|--------|--------|
| Q-18 | P0 | Which date is the age counted from: the pour/casting date, the sampling date, or the Field Record date? Can it differ between samples on the same record? | The "Fecha del colado" of the record. | FPC06-04 (02/09 + 3 = 05/09) | `pourDate`; A-12 confirmed |
| Q-19 | P0 | Which test ages are valid (e.g. 3, 7, 14, 28, 56 days)? Is there a closed list? | No closed list; ages are entered by whoever runs the system. | Questionnaire 2026-10-15 | Free positive integers |
| Q-20 | P0 | Are test ages and specimen counts set per project, per client, per material/mix, per lab default, or per field record? | Usually set by the project specification, but they change on the fly, even within one project. | Questionnaire 2026-10-15 | Project default + per-test edit (A-10 partial) |
| Q-21 | P1 | If a scheduled date falls on a weekend or holiday, is the test moved earlier, moved later, or kept? Is there an allowed tolerance window? | Only a Sunday or holiday moves the test to the next day (3 days on Sunday → 4 days on Monday), unless the client requires the exact age. | Questionnaire 2026-10-15 | A-13 rejected; `test-schedule.ts` |
| Q-22 | P1 | If the age configuration changes after specimens exist, should already-planned tests change? | A specimen's age can be changed (client request) until it is tested. | Questionnaire 2026-10-15 | A-15 partial |
| Q-23 | P1 | What happens when a test is missed or performed late? Is that flagged on the report? | The lab tries to test within tolerance; a late test is noted on the report. | Questionnaire 2026-10-15 | Report note (Phase 9) |

## 4. Tests & calculations

| ID | Pri | Question | Answer | Source | Impact |
|----|-----|----------|--------|--------|--------|
| Q-24 | P0 | What exact measurements are recorded during a test? | Confirmed by FPC06-01; the test time of day is needed for the age tolerance. | Questionnaire 2026-10-15 | `test_time` (draft) |
| Q-25 | P0 | Which values are entered manually, and which are calculated? | Confirmed: press reading in kgf, dimensions and load time are manual; the rest is calculated. | Questionnaire 2026-10-15 | Phase 7.2 unblocked |
| Q-26 | P0 | What formulas are used (including units, rounding, and significant figures)? Which standard defines them? | Mean diameter rounded to 0.1 cm; area from it to 0.1 cm²; stress to 1 kgf/cm² (0.1 MPa); % to 0.1; averages from rounded values. Standard NMX-C-083-ONNCCE-2014. | Questionnaire 2026-10-15 | `compression.ts` |
| Q-27 | P0 | What fields exist in the official Bitácora? Is it per project, per period, or lab-wide? | Columns answered. Scope (per project vs lab-wide): Q-68. | FPC01-02 | Bitácora view columns |
| Q-28 | P1 | What validation rules exist (ranges, mandatory combinations, acceptance criteria)? | No conformity statement: the report is informative only. | Questionnaire 2026-10-15 | No range validation |
| Q-29 | P1 | Is equipment (e.g. testing press) and its calibration recorded per test? | Not needed to start; future improvement. | Questionnaire 2026-10-15 | Equipment codes stay text |
| Q-30 | P1 | Are photos or attachments of tests or failure modes required? | No photos required. | Questionnaire 2026-10-15 | — |

## 5. Reports

| ID | Pri | Question | Answer | Source | Impact |
|----|-----|----------|--------|--------|--------|
| Q-31 | P0 | What is the scope of one report: a project, a field record, a date range, or a set of selected specimens? | One report per field record, one page (or more) per sample. | Questionnaire 2026-10-15 | A-68 confirmed |
| Q-32 | P0 | What exact layout and content does the "Informe de pruebas de control de concreto hidráulico" have? (Request a blank template plus 2–3 real issued reports.) | Answered: see the analysis (sections, fields, notes, signatures). | FPC06-04 | Template `concrete-control` |
| Q-33 | P0 | What makes a Field Record "complete"? | All fields filled in on the example; unused spaces cancelled; the record is finished once signed (visto bueno). | Questionnaire 2026-10-15 | Completeness rule (Phase 4.4) |
| Q-34 | P1 | Can records be edited after testing? After a report is issued? | Yes (e.g. typos), only by the Coordinador del SGC or the Jefe de Control de Calidad. | Questionnaire 2026-10-15 | Permissions + audit trail |
| Q-35 | P0 | What conditions must hold before a report can be generated (e.g. all tests at all ages complete, or partial reports allowed)? | Normally after all specimens are tested; partial reports on client request. | Questionnaire 2026-10-15 | Readiness rule + override |
| Q-36 | P1 | Are reports versioned or re-issued? How is a correction communicated (new folio, "revision 1", …)? | The client is notified; a corrected report is issued with the same code and the wrong one is recalled. | Questionnaire 2026-10-15 | New version, same `report_number` |
| Q-37 | P1 | Are signatures required (handwritten image, responsible engineer's license number, digital signature)? | Always Jefe de Laboratorio + Jefe de Control de Calidad; scanned signature images are fine (digital reports); no license number; a Technical Signatory (ema) must sign. | Questionnaire 2026-10-15 | User signature/title (draft) |
| Q-38 | P1 | Does the PDF need a cryptographic digital signature or a verification QR/code? | Not yet; a verification QR would be welcome if simple. | Questionnaire 2026-10-15 | Future |
| Q-51 | P1 | Do reports have an official numbering convention (per year, per tenant, per client)? | Same code for a corrected report; nothing appended. | Questionnaire 2026-10-15 |  |

## 6. Roles & organization

| ID | Pri | Question | Answer | Source | Impact |
|----|-----|----------|--------|--------|--------|
| Q-39 | P1 | What roles exist in the laboratory (field technician, lab technician, supervisor, signing engineer, admin, …)? | Jefe de Control de Calidad > Coordinador del SGC > Jefe de Laboratorio > Jefe de Brigada de Campo (muestreador) > Auxiliar. Roles 1–4 use the system. | Questionnaire 2026-10-15 | `UserRole` enum |
| Q-40 | P1 | Who can create, edit, complete, and finalize Field Records, Tests, and Reports? | Capture of records and tests: Coordinador del SGC. Authorizing and issuing reports: only the Jefe de Control de Calidad. | Questionnaire 2026-10-15 | Permissions (Phase 10.1) |
| Q-41 | P1 | Is the "client" the party that pays, the contractor, or the project owner? Do several parties need to appear on a report? | Client = solicitante = contratista. | FPC01-01, FPC06-04 |  |
| Q-42 | P2 | Is billing/quoting in scope for this system? | Technical scope only; quotes and billing as a future improvement. | Questionnaire 2026-10-15 | future.md |
| Q-43 | P2 | Should clients have portal access to view or download their reports? | Yes, very useful. | Questionnaire 2026-10-15 | future.md |
| Q-44 | P2 | Does the laboratory have several branches/labs that must be separated? | No, a single lab. | Questionnaire 2026-10-15 | A-30 confirmed |
| Q-45 | P2 | Can one person work for more than one laboratory (tenant)? | | | |

## 7. Regulatory, locale, operations

| ID | Pri | Question | Answer | Source | Impact |
|----|-----|----------|--------|--------|--------|
| Q-46 | P1 | Which timezone(s) does the lab operate in? | Colima only. | Questionnaire 2026-10-15 | America/Mexico_City (A-14) |
| Q-47 | P1 | Which language(s) must the UI and reports support? | Spanish. | all | A-40 confirmed |
| Q-48 | P1 | Which units are used, and are any conversions required on reports? | cm, mm, m³, °C, %, kgf, kgf/cm²; the report adds N and MPa. | all | A-41 confirmed |
| Q-49 | P2 | How bad is field connectivity in practice? Is paper capture plus later data entry acceptable for MVP? | Internet is hard to get on site; capture on paper and enter later. | Questionnaire 2026-10-15 | A-42 confirmed; desktop-first entry |
| Q-50 | P2 | Rough volumes: projects per year, field records per month, specimens per record? | 10–15 projects per year, 20–40 pours per month. | Questionnaire 2026-10-15 | A-50 confirmed |
| Q-52 | P0 | What legal/regulatory requirements apply (standards such as NMX-C or ASTM, accreditation such as ISO/IEC 17025, record retention periods)? | Accredited under NMX-EC-17025-ONNCCE-2018 (ema). Records kept 4 years. | Questionnaire 2026-10-15 | Retention ≥ 4 years |
| Q-53 | P1 | Is there existing historical data (Excel, Access, paper) that must be migrated? | Yes: an Excel workbook with July–December 2025 and all of 2026. | Questionnaire 2026-10-15 | Import task (new) |
| Q-54 | P1 | Is an audit trail of who changed what required by an accreditation body? | Yes, required. | Questionnaire 2026-10-15 | audit_events becomes a requirement |

## 8. Raised by the first lab documents (2026-10-14)

Sources and context: [analysis/](analysis/README.md).

| ID | Pri | Question | Answer | Source | Impact |
|----|-----|----------|--------|--------|--------|
| Q-55 | P0 | Registro "MCH-068": what does "MCH" mean, who assigns the number, and what is the sequence scope (per project, per client, lab-wide, per year)? Must it be unique? | MCH = Muestreo de Concreto Hidráulico; consecutive per project from 1, unique per project, can be automatic. | Questionnaire 2026-10-15 | `registry_sequence` |
| Q-56 | P0 | Report number "MAR-PVLT-F1-CTO-REC-068": what is each segment (client code, obra code, F1, CTO, REC, consecutive)? Is it generated or typed? The file name says "CON-REC-068" but the PDF says "CTO-REC-068": which is right? | MAR = client code, PVLT = project code (3–4 letters each), F1 = front no. 1 of the project, CTO = concrete, REC = compressive strength; the number is always the registro number. CTO is correct. | Questionnaire 2026-10-15 | Client/project codes; front on record |
| Q-57 | P0 | Sample number (102) isn't on the field form. Who assigns it, when, and what's its sequence scope? | Assigned by the Bitácora clerk when capturing; consecutive per project. Should be written down although the form has no box. | Questionnaire 2026-10-15 | `sample_number` per project |
| Q-58 | P0 | Specimen numbers (389…408): lab-wide consecutive, per project, per year? Are mold keys (020, 092…) physical molds that get reused? | Specimens consecutive per project; molds reused; pairing by position confirmed. | Questionnaire 2026-10-15 | A-62 confirmed |
| Q-59 | P0 | % de resistencia: the Bitácora and the worksheet compute it from the **rounded** stress (406: 212 → 84.8) but the report from the **unrounded** stress (211.6 → 84.6). Which one is official, and what are the rounding rules for every calculated value? | Rounded stress (NMX-C-083: 1 kgf/cm², 0.1 MPa). 406 is officially 84.8; the report was wrong. | Questionnaire 2026-10-15 | `compression.ts` |
| Q-60 | P1 | Tipo de falla for 407 is "3" on the worksheet but "-" on the report. Which is correct? Is it recorded for every specimen or only one per group? Which numbering (NMX-C-083 patterns 1–6)? | The worksheet is official (type 3); the report must match it. | Questionnaire 2026-10-15 | Failure type only on the test |
| Q-61 | P0 | Does the press read kgf, kN or N? The printed N values equal kgf × 9.81. The MPa values fit kg/cm² ÷ 10.2 (with × 0.0980665, 406 would be 20.8, not 20.7). Which factors are official? | The press reads kgf. N = kgf × 9.81 rounded to integer. 1 MPa = 10.2 kgf/cm². | Questionnaire 2026-10-15 | `compression.ts` |
| Q-62 | P1 | "Tolerancia edad": what is the allowed window per age, and does it need molding and test **times** (not just dates)? | NMX-C-083: 24 h ±0.5 h, 3 d ±2 h, 7 d ±6 h, 14 d ±12 h, 28 d ±20 h, 90 d ±48 h, from the molding time (else the site arrival time). | Questionnaire 2026-10-15 | `ageTolerance()`; `test_time` (draft) |
| Q-63 | P1 | "Tiempo (s)" and "Velocidad" are filled for only one specimen per group. Is that the rule (spot check), or are they optional? | Spot check: 1 of every 10 specimens tested in a day. | Questionnaire 2026-10-15 | Optional fields, UI hint |
| Q-64 | P1 | Where are the report-only fields captured: mixing equipment, compaction method, mix design number/date, admixture, observaciones? Per record, per project, or typed when the report is issued? | Entered by the report author when writing the report; usually the same for the whole project. | Questionnaire 2026-10-15 | Project defaults + report fields (A-69 rejected) |
| Q-65 | P1 | When is the "Remisión" row of "Datos de" filled? Is it per record or per truck (each ticket could differ)? | Each truck has its own ticket; values come from it. | Questionnaire 2026-10-15 | Ticket fields on Delivery |
| Q-66 | P1 | The Bitácora/report "Revenimiento" (15.0) and "Temperatura" (34.0): are these always from the sampled delivery? With two different slump readings, which value is reported (average, first, last)? | Always the sampled truck. The second slump box is for a repeated test: no average, both readings are reported. | Questionnaire 2026-10-15 | Bitácora/report show both readings |
| Q-67 | P1 | Unit weight (NMX-C-162): what formula uses tara, tara + muestra and factor molde? How often is it measured? | Material = (tare + sample) − tare; unit weight = material × mold factor. Rarely measured. | Questionnaire 2026-10-15 |  |
| Q-68 | P1 | Is the Bitácora one file per project or one lab-wide log (it has no obra/client column)? | One lab-wide workbook with a tab per project; yearly file but numbering continues per project. | Questionnaire 2026-10-15 | Bitácora per project (A-06 confirmed) |
| Q-69 | P1 | Must the FPC06-01 worksheet be kept as a signed record per test date (signatures, sheet-level observaciones), or can it be a printable view? | Must be printable any time and kept signed on paper as audit evidence. | Questionnaire 2026-10-15 | A-72 confirmed (printable view) |
| Q-70 | P2 | Flexural tests (MR, beams): in scope? No worksheet or report for them was received. | Yes (beams, cubes, 10×20); short-term future. | Questionnaire 2026-10-15 | future.md |
| Q-71 | P1 | If one record has several samples (e.g. two deliveries sampled), is it one report per sample or per record? What happens with more than 6 specimens (6 columns on the page)? | One record; several sheets if trucks don't fit (7 per sheet). One report page per sample; more than 6 specimens → second page. | Questionnaire 2026-10-15 | Sheet = derived; report pagination |
| Q-72 | P2 | "Croquis de colocación": draw in the app, upload a photo, or drop it? | Rarely used; a simple drawing is enough. | Questionnaire 2026-10-15 |  |
| Q-73 | P1 | Who signs "Visto bueno" on the field record (role)? Is it needed in the system? | Usually the client; else a lab Technical Signatory. The record is finished once signed. | Questionnaire 2026-10-15 | `approved_by_name` |
| Q-74 | P0 | "Edad definitiva" (7 in the example) vs the configured test ages (3 and 7): is edad definitiva the age at which f'c must be reached? Does it determine the planned ages or acceptance? | The age at which the supplier guarantees design f'c. Test ages follow from it but are chosen by the user and change on request. | Questionnaire 2026-10-15 | Informative field; ages user-defined |
| Q-75 | P2 | "Ecuación de corrección de carga" ("se utilizan lecturas directas"): does it depend on the press calibration? Must it be stored per press or per test? | Depends on press calibration; only one press, no correction needed. | Questionnaire 2026-10-15 | Constant text for now |
| Q-76 | P2 | "Cribado Sí/No" and "Malla": what do they record? | Whether the concrete was screened through a mesh before placing. | Questionnaire 2026-10-15 |  |
| Q-77 | P2 | Can one registro span several sheets ("Hoja _ de _") when there are many deliveries? Does that change numbering? | Yes, one registro can have several sheets, each with its own trucks. | Questionnaire 2026-10-15 | Sheet = ceil(sequence / 7) |
| Q-78 | P1 | The obra is written three ways ("Puente vehicular Las Tunas (PSV)", "Construcción de puente vehicular Las Tunas", `CONSTRUCCIÓN DE PUENTE VEHICULAR "LAS TUNAS"`). Is the report's version the official project name? | The report's name is official. PSV = "Paso Superior Vehicular", an informal reference. | Questionnaire 2026-10-15 |  |

## 9. Raised by the questionnaire answers (2026-10-15)

| ID | Pri | Question | Answer | Source | Impact |
|----|-----|----------|--------|--------|--------|
| Q-79 | P0 | Is the registro (MCH) consecutive per project or per front (F1, F2…)? Does each front start again at 1? | | | Uniqueness of `registry_sequence` |
| Q-80 | P1 | MPa: from the unrounded or the rounded kgf/cm² stress? (Unrounded ÷ 10.2 matches the issued report: 406 → 20.7; rounded gives 20.8.) How many decimals do the per-age averages have? | | | `compression.ts` (A-77) |
| Q-81 | P1 | Which holidays move a test date: the official LFT days, or the lab's own calendar? | | | Holiday calendar (A-78) |
| Q-82 | P1 | When a partial report is issued first, does the final report keep the same code (a new version) or get another one? | | | Report versioning |
| Q-83 | P1 | Who manages users in the system (creates accounts, assigns roles)? | | | Admin permission (Phase 10.1) |
| Q-84 | P2 | What is the age tolerance for ages not listed in NMX-C-083 (e.g. 56 days)? | | | `ageTolerance()` returns null |
| Q-85 | P1 | Please send the historical Excel (Jul 2025 – 2026) for the import. | | | Import task |
| Q-86 | P1 | When a test moves from a Sunday to Monday (3 → 4 days), does the worksheet/report print age 3 or 4? Is the age tolerance then checked against 4 days (no tolerance listed) or flagged as outside 3 days ± 2 h? | | | `checkAgeTolerance()` currently says OUTSIDE |
| Q-87 | P2 | When a sample has a different number of specimens than the project's ages (e.g. 5 for 2 + 2), which age do the extra ones get? | | | `assignSpecimensToAges` (A-82: the last age) |
| Q-88 | P1 | Thermometer and hygrometer codes and the specimen type were blank on MCH-068. Are they required to finish a record? | | | `missingForCompletion` (optional today) |
| Q-89 | P0 | The age tolerance needs the time of each break, but FPC06-01 has no time column. Do they write it down? Can the system ask for it when results are entered? | | | `specimen_tests.test_time`, Phase 7 |
| Q-90 | P2 | If a field record is cancelled, is its MCH number lost or reused? | | | Numbering (lost today) |
| Q-91 | P1 | Should the Bitácora export match their current Excel (FPC01-02 columns, one tab per project)? | | | Phase 8.3 |
| Q-92 | P2 | How many days ahead do they plan breaks? Is a printed list of the day's tests useful? | | | Pending tests (7 days by default) |
| Q-93 | P1 | Who may change a test's age or cancel a damaged specimen: only the Coordinador del SGC, or the Jefe de Laboratorio too? | | | Permissions (Phase 10.1) |

## 10. Raised by test results (Phase 7, 2026-10-16)

| ID | Pri | Question | Answer | Source | Impact |
|----|-----|----------|--------|--------|--------|
| Q-94 | P1 | When a specimen is broken after its date (overdue), does it go on the sheet of the day it is actually broken? | | | Worksheet rows (A-84) |
| Q-95 | P1 | Can a recorded result be corrected? Who may do it, and must the change be justified (audit trail)? | | | Corrections (A-85), Phase 10 |
| Q-96 | P1 | May a specimen be broken before its scheduled date (e.g. the client asks for an early result)? What happens when it falls outside the age tolerance? | | | Validation (A-86) |
| Q-97 | P2 | 10×20 cylinders: same worksheet and formulas as 15×30? Cubes: which area? | | | A-87 |
| Q-98 | P2 | Is the failure type required for every specimen, or only when observed? | | | A-89 |
| Q-99 | P2 | Should the system keep the sheet's observaciones and the names of who signed it, or is paper enough? | | | Printable worksheet (A-91) |
| Q-100 | P2 | Do cancelled specimens and cancelled or draft records appear in the Bitácora (e.g. marked as cancelled)? | | | Bitácora rows (A-92, A-93) |
| Q-101 | P1 | Please send the scanned signatures of the Jefe de laboratorio and the Jefe de control de calidad, and tell us which staff are Technical Signatories (ema). | | | Report signatures (A-97) |
| Q-102 | P2 | Is "Fecha de informe" the day the report is generated or the day it is issued (finalized)? | | | Snapshot issue date (A-99) |
