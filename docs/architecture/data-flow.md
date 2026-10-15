# Data Flow

## 1. Capture → schedule → test → Bitácora → report

```
[Field technician]                     [Lab technician]                [Supervisor / engineer]
       │                                      │                                │
       ▼                                      │                                │
 POST /projects/:id/field-records (DRAFT)     │                                │
 PUT … deliveries / samples / specimens       │                                │
 POST /field-records/:id/complete ───┐        │                                │
                                     ▼        │                                │
         specimen-tests.planForFieldRecord()  │                                │
         reads ProjectTestConfiguration       │                                │
         creates SpecimenTest(ageDays,        │                                │
           status=SCHEDULED) per specimen     │                                │
                                              ▼                                │
                               GET /tests/pending (derived dates)              │
                               POST /tests/:id/complete (FPC06-01 readings)    │
                                              │                                │
                                              ▼                                ▼
                                  GET /projects/:id/bitacora  (composed read, nothing stored)
                                                                               │
                                                                               ▼
                                                     POST /field-records/:id/reports
                                                     → assemble DTO from source data
                                                     → store snapshot (JSON) in reports row
                                                     → render HTML template → PDF
                                                     → upload to private storage
                                                     → status GENERATED
                                                     POST /reports/:id/finalize → FINAL
                                                     GET /reports/:id/download → signed URL
```

## 2. How test planning works (domain logic, no domain content)

Given:

- the **age reference date** of the specimens: the record's "fecha del colado"
  (`pourDate`, A-12 confirmed by FPC06-04)
- the project's test configuration rows: `{ ageDays, specimenCount }` [A-10]

Then:

1. `planTests(referenceDate, rules)` returns, per age, the scheduled date and how many
   specimens are needed.
2. The service assigns the record's specimens to ages. In the example (FPC01-02),
   specimens 405–406 went to 3 days and 407–408 to 7 days, i.e. by ascending specimen
   number and ascending age. **Whether that's the rule is still unconfirmed (Q-14,
   Q-74).** Until then, Phase 6 can't be finished.
3. One `SpecimenTest` row per specimen per assigned age, storing `ageDays` only.

Example (mirrors the brief; ages are **not** constants):

| Reference date | Config | Derived scheduled dates |
|----------------|--------|------------------------|
| 2026-10-02 | 7 days ×2, 28 days ×3 | 2026-10-09 (2 specimens), 2026-10-30 (3 specimens) |
| 2026-09-02 (MCH-068) | 3 days ×2, 7 days ×2 | 2026-09-05 (405, 406), 2026-09-09 (407, 408). Matches FPC06-01 |

## 3. Where derived data is computed

| Derived value | Where | Stored? |
|---------------|-------|---------|
| Scheduled date | `test-schedule.ts` (pure) and in SQL for list filters (`reference_date + age_days`) | No |
| Actual age at test | `specimenAgeInDays(pourDate, testDate)` | No |
| Due status | `classifyDueStatus(scheduledDate, today)` | No |
| Bitácora rows | `bitacora` query service | No |
| Calculated test values | `specimen-tests` domain functions | **TBD.** Candidate formulas in the FPC06-01/FPC06-04 analyses; rounding conflict Q-59, factors Q-61. Store vs. derive: ADR in development-plan 7.5. |
| Report data | `reports` assembler | **Yes, as snapshot**, by design (ADR-005) |

## 4. Edits after the fact

- Editing source data changes every **derived** view immediately (correct by design).
- It never changes a **FINAL** report (snapshot + stored PDF).
- Whether edits are *allowed* after testing or reporting is Q-34. Until then, the API
  allows edits only in `DRAFT` (records) or non-terminal states (tests).
