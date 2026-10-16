# Analysis: lab questionnaire answers (2026-10-15)

Date analyzed: 2026-10-15   Analyst: Claude Code (for Jorge Davalos)
Source: the questionnaire sent after the first analyses, answered by the lab as a Word
file. The file is kept **outside git** (`docs/*.docx` is ignored: it names staff and the
technical signatory). Questions and answers, one line each, are in
[open-questions.md](../open-questions.md) (source "Questionnaire 2026-10-15").

## Conflicts resolved

| Conflict | Resolution | Effect |
|----------|-----------|--------|
| % de resistencia: rounded (bitácora, worksheet) vs unrounded (report) stress | **Rounded** stress, per NMX-C-083-ONNCCE-2014 (1 kgf/cm², 0.1 MPa). Specimen 406 is 84.8; the issued report was wrong | `compression.ts` uses the rounded stress |
| Tipo de falla of 407: "3" vs "-" | The **worksheet** is official; the report must match it | Failure type lives only on SpecimenTest; the report reads it |
| Report number "CON" vs "CTO" | **CTO** (concrete documents) | Report-number format below |
| Obra name spelled three ways | The **report's** name is official; "PSV" (Paso Superior Vehicular) is an informal reference | `projects.name` = report name |

## Numbering (all per project)

| Number | Rule | Model |
|--------|------|-------|
| Registro `MCH-068` | MCH = Muestreo de Concreto Hidráulico. Consecutive per project from 1, never repeated within the project. May be automatic | `field_records.registry_sequence` int, unique per project (per front? Q-79). Displayed `MCH-` + 3 digits |
| Muestra `102` | Consecutive per project, assigned when the record is captured. The form has no box but it should be recorded | `samples.sample_number` int, unique per project |
| Espécimen `405` | Consecutive per project. Molds are physical and reused; listed in the same order as specimens | `specimens.specimen_number` int, unique per project; `mold_code` text |
| Informe `MAR-PVLT-F1-CTO-REC-068` | client code (3–4 letters) · project code (3–4 letters) · front `F<n>` · `CTO` (concrete) · `REC` (resistencia a compresión) · registro number | `clients.code`, `projects.code`, `field_records.front_number`; `CTO-REC` belongs to the concrete-compression template |
| Correction | New report with the **same** code; the wrong one is recalled. Nothing appended to the code | New `Report` version, same `report_number`; previous version marked superseded |

## Calculations (NMX-C-083-ONNCCE-2014)

Formulas confirmed by the lab. Implemented as pure functions in
`apps/backend/src/specimen-tests/domain/compression.ts`, with the MCH-068 specimens as
test vectors.

| Value | Rule |
|-------|------|
| Mean height, mean diameter | Mean of the two readings, rounded half-up to 0.1 cm |
| Area | π/4 × (rounded mean diameter)², rounded to 0.1 cm² |
| Load in N | kgf × 9.81, rounded to an integer (the press reads kgf) |
| Stress kgf/cm² | load kgf ÷ area, rounded to an integer |
| Stress MPa | stress ÷ 10.2, rounded to 0.1 (input: unrounded stress, A-77 / Q-80) |
| % of design strength | **rounded** stress ÷ f'c × 100, rounded to 0.1 |
| Loading rate | stress ÷ load time (s); spot check on 1 of every 10 specimens tested in a day |
| Per-age averages | Average of the rounded values (A-80 / Q-80) |
| Unit weight | (tare + sample − tare) × mold factor. Rarely measured |

The report makes **no conformity statement** (Q-28): no ranges, no pass/fail.

## Test ages and scheduling

- "Edad definitiva" = the age at which the supplier guarantees design f'c. Test ages follow
  from it, but **the user chooses them** and they change on request, even within one
  project. No closed list (Q-19, Q-20, Q-74).
- Usually 4 specimens per sample, 2 per age: an age's result is the average of the two
  "sibling" specimens. Other splits happen (1@7, 1@14, 2@28). Specimens are assigned in
  **ascending order**: the first numbers go to the first age (Q-14).
- A specimen's age can be changed until it is tested (Q-22).
- A date that falls on a **Sunday or holiday moves to the next day** (3 days on a Sunday →
  4 days on Monday), unless the client requires the exact age (Q-21). Saturdays are
  working days. Which holidays: Q-81.
- **Age tolerance** (NMX-C-083): 24 h ±0.5 h, 3 d ±2 h, 7 d ±6 h, 14 d ±12 h, 28 d ±20 h,
  90 d ±48 h, measured from the molding time (else the site arrival time). A late test
  is noted on the report (Q-23, Q-62). This needs the **test time of day**.

## Field record (FPC01-01)

- Captured on paper on site and entered later (no reliable internet, Q-49): desktop
  entry, no offline mode.
- Required: everything filled in on the example; unused spaces cancelled (Q-33).
  "Visto bueno" is usually the **client** (or a lab Technical Signatory). The record is
  finished when signed (Q-73).
- The "Remisión" row is **per truck** (each delivery ticket differs) (Q-65).
- Reports use the **sampled truck**. The second slump reading exists for a repeated test:
  no average, both readings are reported (Q-66).
- One record can span several sheets (7 trucks per sheet). Samples from trucks 1 and 5
  fit one sheet; trucks 2 and 9 need two sheets of the same record (Q-71, Q-77).
- Supplier and cement type: pick from a list that users can extend (Q-06).
- Site-mixed vs ready-mix: no box on the form; the Bitácora clerk enters it (Q-07).
- Cribado: whether the concrete was screened through a mesh before placing (Q-76).
- Sketch: rarely used; a simple drawing is enough (Q-72).

## Bitácora, worksheet, report

- Bitácora: one lab-wide workbook, one tab per project; yearly files but numbering
  continues per project (Q-68). → Bitácora view per project.
- Worksheet FPC06-01: printable on demand and kept **signed on paper** as audit evidence
  (Q-69). One press, no load correction (Q-75). No equipment catalog to start (Q-29).
- Report: one per field record, **one page per sample**, a second page above 6
  specimens (Q-71). Normally issued when all specimens are tested; partial reports on
  client request (Q-35).
- Report-only fields (mixing equipment, compaction method, mix design number/date,
  admixture, observations) are entered **by the report author when writing the
  report**, and are usually the same for the whole project (Q-64).
- Signatures: always **Jefe de Laboratorio** and **Jefe de Control de Calidad**; scanned
  images are fine (reports are digital only); no license number; a **Technical
  Signatory** accredited by the ema must sign (Q-37). A verification QR is welcome if
  simple (Q-38).

## Roles and permissions (Q-39, Q-40, Q-34)

| Role (lab) | Code | Uses the system | Can |
|-----------|------|-----------------|-----|
| Jefe de Control de Calidad | `QUALITY_MANAGER` | Yes | Everything; **only role that authorizes and issues reports**; corrects issued data |
| Coordinador del SGC | `QMS_COORDINATOR` | Yes | Captures field records and tests; corrects issued data |
| Jefe de Laboratorio | `LAB_MANAGER` | Yes (mostly paper) | Signs worksheets and reports |
| Jefe de Brigada de Campo (muestreador) | `FIELD_CREW_CHIEF` | Yes (mostly paper) | Fills field records on paper |
| Auxiliar | — | No | — |

Who manages user accounts: Q-83 (assumed `QUALITY_MANAGER`, A-81).

## Regulatory and operations

- Accredited under **NMX-EC-17025-ONNCCE-2018** (ema). Records retained **4 years** (Q-52).
- An **audit trail** of who changed what is **required** (Q-54) → `audit_events` moves up.
- One lab, Colima only (Q-44, Q-46). 10–15 projects/year, 20–40 pours/month (Q-50).
- Historical Excel (July 2025 → 2026) to import (Q-53, file requested: Q-85).
- Out of scope now, wanted later: beams/cubes/10×20 cylinders (Q-70), client portal
  (Q-43), quotes and billing (Q-42), equipment calibration (Q-29).

## New questions

Q-79 … Q-85 in [open-questions.md](../open-questions.md#9-raised-by-the-questionnaire-answers-2026-10-15).
