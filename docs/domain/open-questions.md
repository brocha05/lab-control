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
| Q-02 | P0 | Which fields are required and which are optional? | Partial: the form marks nothing as required. | FPC01-01 | Still needed for Q-33 |
| Q-03 | P0 | Does a Field Record have an official folio/number? Who assigns it, and what's the format? | Partial: "Registro" e.g. MCH-068. Format and assigner: Q-55. | FPC01-01 | `FieldRecord.registryNumber` |
| Q-04 | P1 | Can one Field Record span more than one project, or more than one pour/element? | One obra per record. "Elemento(s) programado(s)/colado(s)": one or more elements. | FPC01-01 | A-03 confirmed |
| Q-05 | P0 | Is the concrete truck ("trompo") / delivery information one-per-record, or can a record cover several trucks? | Several trucks per record (4 in the example), one table row each. | FPC01-01 | New `Delivery` entity (A-60) |
| Q-06 | P1 | Are the concrete supplier, plant, or mix design reusable catalog entities, or free text on each record? | Partial: proveedor and cement type are free text on the form. Catalog not decided. | FPC01-01 | Text columns for now |
| Q-07 | P1 | Which values are measured in the field, and which are copied from delivery tickets? | Partial: measured on site: times, temperatures, 2 slump readings, unit weight, air. Copied from the ticket: "Remisión" row, ticket number, volume. | FPC01-01 | Q-65 |
| Q-08 | P1 | Are photos, scanned delivery tickets, or other attachments captured in the field? | Partial: "Croquis de colocación" box. No photos. | FPC01-01 | Q-72 |
| Q-09 | P1 | Does the field technician sign the record? Does the client's representative? | Muestreador signs; a second person signs "Visto bueno". No client signature. | FPC01-01 | `samplerName`; Q-73 |

## 2. Samples & Specimens

| ID | Pri | Question | Answer | Source | Impact |
|----|-----|----------|--------|--------|--------|
| Q-10 | P0 | What is the difference between a "sample" and a "specimen/cylinder" in the lab's own vocabulary? Is there an intermediate level (e.g. per truck)? | Muestra (e.g. 102) is taken from one delivery; especímenes (405–408) are molded from it. Intermediate level = delivery (entrega). | FPC01-01, FPC01-02, FPC06-04 | Sample → Delivery (A-61) |
| Q-11 | P0 | What information is captured for each sample? | Sample number, specimen type, molding time. Slump/temperature come from its delivery. | FPC01-01, FPC01-02 | Sample columns |
| Q-12 | P0 | What information is captured for each specimen (identifier, dimensions, type, …)? | Specimen key + mold key. Dimensions are measured at test time. | FPC01-01, FPC06-01 | Specimen + SpecimenTest columns |
| Q-13 | P0 | How are specimens identified/labelled physically? Is there a numbering convention? | Partial: numeric keys (405, 406…), mold keys (020…). Scope: Q-58. | FPC01-01 | `specimenNumber`, `moldCode` |
| Q-14 | P1 | How many cylinders are normally made per sample? Is the number configurable, and by whom? | Partial: 4 per sample (2 at 3 days, 2 at 7 days). Diagram: "normalmente 2-7 a 2-28". | FPC01-02, general_flow.png | A-10 still open |
| Q-15 | P1 | Are specimen types other than cylinders used (beams, cubes, cores)? | Yes: cylinder 15×30, cylinder 10×20, beam 15×60, beam 15×50, cube 15. | FPC01-01 | `SpecimenType` enum; Q-70 |
| Q-16 | P0 | Is each specimen tested **exactly once** (destructive test)? Or can one specimen have several tests? | Each specimen appears on exactly one test row. | FPC06-01, FPC01-02 | A-05 partial; 1:N kept |
| Q-17 | P2 | Are specimen curing conditions or transport to the lab tracked? | | | |

## 3. Test scheduling

| ID | Pri | Question | Answer | Source | Impact |
|----|-----|----------|--------|--------|--------|
| Q-18 | P0 | Which date is the age counted from: the pour/casting date, the sampling date, or the Field Record date? Can it differ between samples on the same record? | The "Fecha del colado" of the record. | FPC06-04 (02/09 + 3 = 05/09) | `pourDate`; A-12 confirmed |
| Q-19 | P0 | Which test ages are valid (e.g. 3, 7, 14, 28, 56 days)? Is there a closed list? | Partial: 3 and 7 seen; diagram mentions 7 and 28. Closed list unknown. | FPC06-01, general_flow.png |  |
| Q-20 | P0 | Are test ages and specimen counts set per project, per client, per material/mix, per lab default, or per field record? | Partial: ages are "configurables"; "Edad definitiva" is per record. | general_flow.png, FPC01-01 | Q-74 |
| Q-21 | P1 | If a scheduled date falls on a weekend or holiday, is the test moved earlier, moved later, or kept? Is there an allowed tolerance window? | Partial: a 3-day test fell on a Saturday and was not moved. | FPC06-01 (05/09/2026) | A-13 partial |
| Q-22 | P1 | If the age configuration changes after specimens exist, should already-planned tests change? | | | |
| Q-23 | P1 | What happens when a test is missed or performed late? Is that flagged on the report? | | | |

## 4. Tests & calculations

| ID | Pri | Question | Answer | Source | Impact |
|----|-----|----------|--------|--------|--------|
| Q-24 | P0 | What exact measurements are recorded during a test? | Height ×2, diameter ×2, max load (kgf; N shown too), load time, failure type, age tolerance; press and instrument codes. | FPC06-01 | SpecimenTest columns |
| Q-25 | P0 | Which values are entered manually, and which are calculated? | Partial: manual: readings, kgf, time, failure type. Calculated: means, area, N, stress, MPa, %, rate, averages. | FPC06-01, FPC06-04 | A-73 |
| Q-26 | P0 | What formulas are used (including units, rounding, and significant figures)? Which standard defines them? | Partial: NMX-C-083-ONNCCE-2014. No formula printed. Candidate formulas in the analyses. | FPC06-04 notes | Q-59, Q-61 |
| Q-27 | P0 | What fields exist in the official Bitácora? Is it per project, per period, or lab-wide? | Columns answered. Scope (per project vs lab-wide): Q-68. | FPC01-02 | Bitácora view columns |
| Q-28 | P1 | What validation rules exist (ranges, mandatory combinations, acceptance criteria)? | | | |
| Q-29 | P1 | Is equipment (e.g. testing press) and its calibration recorded per test? | Partial: equipment codes per record ("*calibrada, #verificada") and per worksheet (prensa, dimensiones). No calibration data. | FPC01-01, FPC06-01 | Text codes (A-65) |
| Q-30 | P1 | Are photos or attachments of tests or failure modes required? | Partial: no photos on any form. | all | — |

## 5. Reports

| ID | Pri | Question | Answer | Source | Impact |
|----|-----|----------|--------|--------|--------|
| Q-31 | P0 | What is the scope of one report: a project, a field record, a date range, or a set of selected specimens? | One report per sample (muestra 102 = registro MCH-068). | FPC06-04 | Report → FieldRecord (A-68); Q-71 |
| Q-32 | P0 | What exact layout and content does the "Informe de pruebas de control de concreto hidráulico" have? (Request a blank template plus 2–3 real issued reports.) | Answered: see the analysis (sections, fields, notes, signatures). | FPC06-04 | Template `concrete-control` |
| Q-33 | P0 | What makes a Field Record "complete"? | | | |
| Q-34 | P1 | Can records be edited after testing? After a report is issued? | | | |
| Q-35 | P0 | What conditions must hold before a report can be generated (e.g. all tests at all ages complete, or partial reports allowed)? | Partial: generated once everything is filled (all tests of the sample done). | general_flow.png, FPC06-04 dates |  |
| Q-36 | P1 | Are reports versioned or re-issued? How is a correction communicated (new folio, "revision 1", …)? | | | |
| Q-37 | P1 | Are signatures required (handwritten image, responsible engineer's license number, digital signature)? | Partial: two handwritten signatures with name and title: Jefe de laboratorio, Jefe de control de calidad. Worksheet: Jefe de laboratorio, Coordinador del SGC. | FPC06-04, FPC06-01 |  |
| Q-38 | P1 | Does the PDF need a cryptographic digital signature or a verification QR/code? | | | |
| Q-51 | P1 | Do reports have an official numbering convention (per year, per tenant, per client)? | Partial: "MAR-PVLT-F1-CTO-REC-068". Rule: Q-56. | FPC06-04 | `Report.reportNumber` |

## 6. Roles & organization

| ID | Pri | Question | Answer | Source | Impact |
|----|-----|----------|--------|--------|--------|
| Q-39 | P1 | What roles exist in the laboratory (field technician, lab technician, supervisor, signing engineer, admin, …)? | Partial: Muestreador (field technician), Visto bueno, Jefe de laboratorio, Coordinador del SGC, Jefe de control de calidad. | FPC01-01, FPC06-01, FPC06-04 | A-33 still placeholder |
| Q-40 | P1 | Who can create, edit, complete, and finalize Field Records, Tests, and Reports? | | | |
| Q-41 | P1 | Is the "client" the party that pays, the contractor, or the project owner? Do several parties need to appear on a report? | Client = "Solicitante" (FPC01-01) = "Contratista" (FPC06-04), with a contact. Only one party is printed. | FPC01-01, FPC06-04 | A-70 |
| Q-42 | P2 | Is billing/quoting in scope for this system? | | | |
| Q-43 | P2 | Should clients have portal access to view or download their reports? | | | |
| Q-44 | P2 | Does the laboratory have several branches/labs that must be separated? | | | |
| Q-45 | P2 | Can one person work for more than one laboratory (tenant)? | | | |

## 7. Regulatory, locale, operations

| ID | Pri | Question | Answer | Source | Impact |
|----|-----|----------|--------|--------|--------|
| Q-46 | P1 | Which timezone(s) does the lab operate in? | Partial: the lab is in Colima, Col. (likely America/Mexico_City; to confirm). | FPC06-04 footer |  |
| Q-47 | P1 | Which language(s) must the UI and reports support? | Spanish. | all | A-40 confirmed |
| Q-48 | P1 | Which units are used, and are any conversions required on reports? | cm, mm, m³, °C, %, kgf, kgf/cm²; the report adds N and MPa. | all | A-41 confirmed |
| Q-49 | P2 | How bad is field connectivity in practice? Is paper capture plus later data entry acceptable for MVP? | | | |
| Q-50 | P2 | Rough volumes: projects per year, field records per month, specimens per record? | | | |
| Q-52 | P0 | What legal/regulatory requirements apply (standards such as NMX-C or ASTM, accreditation such as ISO/IEC 17025, record retention periods)? | Partial: NMX-C ONNCCE standards (161, 435, 156, 159, 162, 157, 472, 109, 083). The lab has a quality system (SGC). Accreditation unknown. | all |  |
| Q-53 | P1 | Is there existing historical data (Excel, Access, paper) that must be migrated? | | | |
| Q-54 | P1 | Is an audit trail of who changed what required by an accreditation body? | | | |

## 8. Raised by the first lab documents (2026-10-14)

Sources and context: [analysis/](analysis/README.md).

| ID | Pri | Question | Answer | Source | Impact |
|----|-----|----------|--------|--------|--------|
| Q-55 | P0 | Registro "MCH-068": what does "MCH" mean, who assigns the number, and what is the sequence scope (per project, per client, lab-wide, per year)? Must it be unique? | | | Unique constraint on `field_records.registry_number` |
| Q-56 | P0 | Report number "MAR-PVLT-F1-CTO-REC-068": what is each segment (client code, obra code, F1, CTO, REC, consecutive)? Is it generated or typed? The file name says "CON-REC-068" but the PDF says "CTO-REC-068": which is right? | | | Report numbering; client/project codes |
| Q-57 | P0 | Sample number (102) isn't on the field form. Who assigns it, when, and what's its sequence scope? | | | `samples.sample_number` |
| Q-58 | P0 | Specimen numbers (389…408): lab-wide consecutive, per project, per year? Are mold keys (020, 092…) physical molds that get reused? | | | Uniqueness of `specimen_number`; mold catalog |
| Q-59 | P0 | % de resistencia: the Bitácora and the worksheet compute it from the **rounded** stress (406: 212 → 84.8) but the report from the **unrounded** stress (211.6 → 84.6). Which one is official, and what are the rounding rules for every calculated value? | | | Calculation functions (Phase 7) |
| Q-60 | P1 | Tipo de falla for 407 is "3" on the worksheet but "-" on the report. Which is correct? Is it recorded for every specimen or only one per group? Which numbering (NMX-C-083 patterns 1–6)? | | | `failure_type` validation; report |
| Q-61 | P0 | Does the press read kgf, kN or N? The printed N values equal kgf × 9.81. The MPa values fit kg/cm² ÷ 10.2 (with × 0.0980665, 406 would be 20.8, not 20.7). Which factors are official? | | | Calculation functions |
| Q-62 | P1 | "Tolerancia edad": what is the allowed window per age, and does it need molding and test **times** (not just dates)? | | | Make `within_age_tolerance` derived (A-71) |
| Q-63 | P1 | "Tiempo (s)" and "Velocidad" are filled for only one specimen per group. Is that the rule (spot check), or are they optional? | | | Required fields for `complete()` |
| Q-64 | P1 | Where are the report-only fields captured: mixing equipment, compaction method, mix design number/date, admixture, observaciones? Per record, per project, or typed when the report is issued? | | | A-69 |
| Q-65 | P1 | When is the "Remisión" row of "Datos de" filled? Is it per record or per truck (each ticket could differ)? | | | Ticket columns on FieldRecord vs Delivery |
| Q-66 | P1 | The Bitácora/report "Revenimiento" (15.0) and "Temperatura" (34.0): are these always from the sampled delivery? With two different slump readings, which value is reported (average, first, last)? | | | Bitácora and report assemblers |
| Q-67 | P1 | Unit weight (NMX-C-162): what formula uses tara, tara + muestra and factor molde? How often is it measured? | | | Derived unit weight |
| Q-68 | P1 | Is the Bitácora one file per project or one lab-wide log (it has no obra/client column)? | | | A-06; Bitácora endpoint scope |
| Q-69 | P1 | Must the FPC06-01 worksheet be kept as a signed record per test date (signatures, sheet-level observaciones), or can it be a printable view? | | | A-72; possible TestSession entity |
| Q-70 | P2 | Flexural tests (MR, beams): in scope? No worksheet or report for them was received. | | | SpecimenType BEAM_*, StrengthCriterion MR |
| Q-71 | P1 | If one record has several samples (e.g. two deliveries sampled), is it one report per sample or per record? What happens with more than 6 specimens (6 columns on the page)? | | | A-68; template pagination |
| Q-72 | P2 | "Croquis de colocación": draw in the app, upload a photo, or drop it? | | | Attachments |
| Q-73 | P1 | Who signs "Visto bueno" on the field record (role)? Is it needed in the system? | | | Signatures / approvals |
| Q-74 | P0 | "Edad definitiva" (7 in the example) vs the configured test ages (3 and 7): is edad definitiva the age at which f'c must be reached? Does it determine the planned ages or acceptance? | | | A-10; planning rule |
| Q-75 | P2 | "Ecuación de corrección de carga" ("se utilizan lecturas directas"): does it depend on the press calibration? Must it be stored per press or per test? | | | Equipment catalog |
| Q-76 | P2 | "Cribado Sí/No" and "Malla": what do they record? | | | `screened`, `screen_mesh` |
| Q-77 | P2 | Can one registro span several sheets ("Hoja _ de _") when there are many deliveries? Does that change numbering? | | | Delivery count, rendering |
| Q-78 | P1 | The obra is written three ways ("Puente vehicular Las Tunas (PSV)", "Construcción de puente vehicular Las Tunas", `CONSTRUCCIÓN DE PUENTE VEHICULAR "LAS TUNAS"`). Is the report's version the official project name? | | | `projects.name` |
