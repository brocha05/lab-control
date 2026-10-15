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
| Q-01 | P0 | What exact fields exist on a Field Record? (Request the blank official form plus 2–3 filled examples.) | | | |
| Q-02 | P0 | Which fields are required and which are optional? | | | |
| Q-03 | P0 | Does a Field Record have an official folio/number? Who assigns it, and what's the format? | | | |
| Q-04 | P1 | Can one Field Record span more than one project, or more than one pour/element? | | | |
| Q-05 | P0 | Is the concrete truck ("trompo") / delivery information one-per-record, or can a record cover several trucks? | | | |
| Q-06 | P1 | Are the concrete supplier, plant, or mix design reusable catalog entities, or free text on each record? | | | |
| Q-07 | P1 | Which values are measured in the field, and which are copied from delivery tickets? | | | |
| Q-08 | P1 | Are photos, scanned delivery tickets, or other attachments captured in the field? | | | |
| Q-09 | P1 | Does the field technician sign the record? Does the client's representative? | | | |

## 2. Samples & Specimens

| ID | Pri | Question | Answer | Source | Impact |
|----|-----|----------|--------|--------|--------|
| Q-10 | P0 | What is the difference between a "sample" and a "specimen/cylinder" in the lab's own vocabulary? Is there an intermediate level (e.g. per truck)? | | | |
| Q-11 | P0 | What information is captured for each sample? | | | |
| Q-12 | P0 | What information is captured for each specimen (identifier, dimensions, type, …)? | | | |
| Q-13 | P0 | How are specimens identified/labelled physically? Is there a numbering convention? | | | |
| Q-14 | P1 | How many cylinders are normally made per sample? Is the number configurable, and by whom? | | | |
| Q-15 | P1 | Are specimen types other than cylinders used (beams, cubes, cores)? | | | |
| Q-16 | P0 | Is each specimen tested **exactly once** (destructive test)? Or can one specimen have several tests? | | | |
| Q-17 | P2 | Are specimen curing conditions or transport to the lab tracked? | | | |

## 3. Test scheduling

| ID | Pri | Question | Answer | Source | Impact |
|----|-----|----------|--------|--------|--------|
| Q-18 | P0 | Which date is the age counted from: the pour/casting date, the sampling date, or the Field Record date? Can it differ between samples on the same record? | | | |
| Q-19 | P0 | Which test ages are valid (e.g. 3, 7, 14, 28, 56 days)? Is there a closed list? | | | |
| Q-20 | P0 | Are test ages and specimen counts set per project, per client, per material/mix, per lab default, or per field record? | | | |
| Q-21 | P1 | If a scheduled date falls on a weekend or holiday, is the test moved earlier, moved later, or kept? Is there an allowed tolerance window? | | | |
| Q-22 | P1 | If the age configuration changes after specimens exist, should already-planned tests change? | | | |
| Q-23 | P1 | What happens when a test is missed or performed late? Is that flagged on the report? | | | |

## 4. Tests & calculations

| ID | Pri | Question | Answer | Source | Impact |
|----|-----|----------|--------|--------|--------|
| Q-24 | P0 | What exact measurements are recorded during a test? | | | |
| Q-25 | P0 | Which values are entered manually, and which are calculated? | | | |
| Q-26 | P0 | What formulas are used (including units, rounding, and significant figures)? Which standard defines them? | | | |
| Q-27 | P0 | What fields exist in the official Bitácora? Is it per project, per period, or lab-wide? | | | |
| Q-28 | P1 | What validation rules exist (ranges, mandatory combinations, acceptance criteria)? | | | |
| Q-29 | P1 | Is equipment (e.g. testing press) and its calibration recorded per test? | | | |
| Q-30 | P1 | Are photos or attachments of tests or failure modes required? | | | |

## 5. Reports

| ID | Pri | Question | Answer | Source | Impact |
|----|-----|----------|--------|--------|--------|
| Q-31 | P0 | What is the scope of one report: a project, a field record, a date range, or a set of selected specimens? | | | |
| Q-32 | P0 | What exact layout and content does the "Informe de pruebas de control de concreto hidráulico" have? (Request a blank template plus 2–3 real issued reports.) | | | |
| Q-33 | P0 | What makes a Field Record "complete"? | | | |
| Q-34 | P1 | Can records be edited after testing? After a report is issued? | | | |
| Q-35 | P0 | What conditions must hold before a report can be generated (e.g. all tests at all ages complete, or partial reports allowed)? | | | |
| Q-36 | P1 | Are reports versioned or re-issued? How is a correction communicated (new folio, "revision 1", …)? | | | |
| Q-37 | P1 | Are signatures required (handwritten image, responsible engineer's license number, digital signature)? | | | |
| Q-38 | P1 | Does the PDF need a cryptographic digital signature or a verification QR/code? | | | |
| Q-51 | P1 | Do reports have an official numbering convention (per year, per tenant, per client)? | | | |

## 6. Roles & organization

| ID | Pri | Question | Answer | Source | Impact |
|----|-----|----------|--------|--------|--------|
| Q-39 | P1 | What roles exist in the laboratory (field technician, lab technician, supervisor, signing engineer, admin, …)? | | | |
| Q-40 | P1 | Who can create, edit, complete, and finalize Field Records, Tests, and Reports? | | | |
| Q-41 | P1 | Is the "client" the party that pays, the contractor, or the project owner? Do several parties need to appear on a report? | | | |
| Q-42 | P2 | Is billing/quoting in scope for this system? | | | |
| Q-43 | P2 | Should clients have portal access to view or download their reports? | | | |
| Q-44 | P2 | Does the laboratory have several branches/labs that must be separated? | | | |
| Q-45 | P2 | Can one person work for more than one laboratory (tenant)? | | | |

## 7. Regulatory, locale, operations

| ID | Pri | Question | Answer | Source | Impact |
|----|-----|----------|--------|--------|--------|
| Q-46 | P1 | Which timezone(s) does the lab operate in? | | | |
| Q-47 | P1 | Which language(s) must the UI and reports support? | | | |
| Q-48 | P1 | Which units are used, and are any conversions required on reports? | | | |
| Q-49 | P2 | How bad is field connectivity in practice? Is paper capture plus later data entry acceptable for MVP? | | | |
| Q-50 | P2 | Rough volumes: projects per year, field records per month, specimens per record? | | | |
| Q-52 | P0 | What legal/regulatory requirements apply (standards such as NMX-C or ASTM, accreditation such as ISO/IEC 17025, record retention periods)? | | | |
| Q-53 | P1 | Is there existing historical data (Excel, Access, paper) that must be migrated? | | | |
| Q-54 | P1 | Is an audit trail of who changed what required by an accreditation body? | | | |
