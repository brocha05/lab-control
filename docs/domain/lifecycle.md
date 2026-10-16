# Lifecycles

> States from [A-20] … [A-24], checked against the lab's answers of 2026-10-15
> (Q-22, Q-33, Q-34, Q-35, Q-36, Q-73). Roles are in
> [entities.md](entities.md#roles).

Principle: when a business fact matters ("this test is done"), store it as an
**explicit state**. Don't infer it from incidental data (`if (test.result != null)`).
Transitions happen only through named domain methods (`complete()`, `cancel()`), never
through generic `update({ status })` calls.

Each module keeps its transition rules in one pure function (e.g.
`assertFieldRecordTransition(from, to)`), unit-tested, and called by the service before
writing. Every state change and every correction is written to the audit trail, which
the accreditation requires (Q-54).

## FieldRecord

```
          complete()             (terminal)
 DRAFT ───────────────▶ COMPLETED
   │
   │ cancel()
   ▼
 CANCELLED (terminal)
```

The record is filled on paper on site and transcribed later (Q-49). On paper it is
finished when it is signed ("visto bueno", usually by the client) and its unused spaces
are cancelled (Q-33, Q-73). In the system, `complete()` means "the signed paper is fully
transcribed".

| Transition | Guard |
|-----------|-------|
| DRAFT → COMPLETED | Every field filled in on the lab's example is present (Q-33): header, specified values, conditions, the six equipment codes used on the example, each delivery's row, at least one sample with molding time and numbered, molded specimens, elements, sampler, visto bueno. Thermometer/hygrometer codes, humidity, unit weight, air content, ticket values, second slump, observations, specimen type and the sketch stay optional. Rule: `missingForCompletion()` in `field-records/domain/completeness.ts` |
| DRAFT → CANCELLED | Allowed |
| COMPLETED → (edit) | Corrections allowed (e.g. typos), only for `QMS_COORDINATOR` and `QUALITY_MANAGER`, always audited (Q-34). No state change |

Tests are **planned on completion** with the project's default ages (Q-20), so drafts
don't fill the pending-tests list. Deliveries, samples and specimens are edited as part
of the record. They have no lifecycle of their own, except a Specimen's cancellation.

## Specimen [A-21]

Stored: `CREATED`, `CANCELLED`.

Derived (not stored):

| Derived state | Rule |
|---------------|------|
| scheduled | ≥1 test in `SCHEDULED` / `IN_PROGRESS` |
| tested | all non-cancelled tests are `COMPLETED` |

Each specimen is tested once (Q-16), but the 1:N shape lets a cancelled test be
replanned. Cancelling a specimen cancels its open tests in the same transaction.

## SpecimenTest [A-22]

```
            start()               complete()
 SCHEDULED ─────────▶ IN_PROGRESS ──────────▶ COMPLETED (terminal)
     │                    │
     │ cancel()           │ cancel()
     ▼                    ▼
 CANCELLED (terminal)
```

- No form shows an "in progress" state; FPC06-01 records results directly, so
  `SCHEDULED → COMPLETED` is the normal path and `IN_PROGRESS` may be removed.
- While not `COMPLETED`, the test's `ageDays` (and `keepExactDate`) can be changed at the
  client's request (Q-22). After completion it can't.
- `complete()` requires the FPC06-01 readings: test date and time, two heights, two
  diameters, load in kgf, failure type. Load time is a spot check on 1 of every 10
  specimens tested in a day (Q-63). Results are calculated by `compression.ts`.
- The scheduled date moves past Sundays and holidays unless `keepExactDate` (Q-21).
  Testing outside the age tolerance (Q-62) is allowed but noted on the report (Q-23).

## Report [A-23]

```
        generate()              finalize()
 DRAFT ───────────▶ GENERATED ────────────▶ FINAL (immutable)
   ▲                   │                      │
   └── regenerate() ───┘                      │ correction: new version, same number;
                                              ▼ when it is finalized → supersededAt set
```

- `DRAFT`: a report request exists, with the report-time fields (mixing equipment,
  compaction method, mix design, admixture, observations) prefilled from the project
  defaults (Q-64). No artifact yet.
- `GENERATED`: snapshot and PDF exist. Can be previewed and regenerated.
- `FINAL`: issued by the Jefe de Control de Calidad only (Q-40). Snapshot and PDF are
  frozen.
- Correction (Q-36): a new version with the **same report number**. Finalizing it sets
  `supersededAt` on the previous FINAL version; the lab recalls the old PDF from the
  client and notifies them.
- Readiness for `generate()`: the record is `COMPLETED` and every non-cancelled test is
  `COMPLETED`, unless a **partial** report is requested (`isPartial`, Q-35). Whether
  the final report after a partial one keeps the number: Q-82.
- Signatures: Jefe de Laboratorio and Jefe de Control de Calidad, scanned images; at
  least one Technical Signatory (Q-37).
- Generation failure: the report stays `DRAFT` and the error is logged. If async
  generation is introduced later, add `FAILED`.

## Tenant / User

- User: `isActive` flag (deactivate, never delete, because users are referenced by
  records they created).
- Tenant: no lifecycle needed.
