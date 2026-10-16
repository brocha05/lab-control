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
                                                     GET /reports/:id/pdf → streamed (ADR-009)
```

## 2. How test planning works (domain logic, no domain content)

Given:

- the **age reference date** of the specimens: the record's "fecha del colado"
  (`pourDate`, A-12 confirmed by FPC06-04)
- the project's test configuration rows: `{ ageDays, specimenCount }` [A-10]

Then:

1. `planTests(referenceDate, rules)` returns, per age, the scheduled date and how many
   specimens are needed.
2. The service assigns the record's specimens to ages in **ascending order**: the
   lowest specimen numbers go to the first age (Q-14). Usually 2 per age.
3. Each scheduled date moves to the next day while it falls on a Sunday or a holiday,
   unless the test keeps its exact date (Q-21). The user can still change one test's
   age until it is tested (Q-22).
4. One `SpecimenTest` row per specimen per assigned age, storing `ageDays` only.

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
| Calculated test values | `specimen-tests/domain/compression.ts` (rules confirmed, Q-26/Q-59/Q-61) | Not yet. Store vs. derive: ADR in development-plan 7.5. |
| Age tolerance | `ageToleranceHours()` / `isWithinAgeTolerance()` (Q-62) | No |
| Report data | `reports` assembler | **Yes, as snapshot**, by design (ADR-005) |

## 4. Edits after the fact

- Editing source data changes every **derived** view immediately (correct by design).
- It never changes a **FINAL** report (snapshot + stored PDF).
- Whether edits are *allowed* after testing or reporting is Q-34. Until then, the API
  allows edits only in `DRAFT` (records) or non-terminal states (tests).
