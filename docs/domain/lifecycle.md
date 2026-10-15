# Lifecycles

> All states are **preliminary** ([A-20] … [A-24]). Each must be validated against the
> real business process (Q-33 … Q-37).

Principle: when a business fact matters ("this test is done"), store it as an
**explicit state**. Don't infer it from incidental data (`if (test.result != null)`).
Transitions happen only through named domain methods (`complete()`, `cancel()`), never
through generic `update({ status })` calls.

Each module keeps its transition rules in one pure function (e.g.
`assertFieldRecordTransition(from, to)`), unit-tested, and called by the service before
writing.

## FieldRecord [A-20]

```
          complete()             (terminal)
 DRAFT ───────────────▶ COMPLETED
   │
   │ cancel()
   ▼
 CANCELLED (terminal)
```

| Transition | Guard | Status |
|-----------|-------|--------|
| DRAFT → COMPLETED | Record is "complete" | **BLOCKED** on Q-33 |
| DRAFT → CANCELLED | Reason required? | Q-34 |
| COMPLETED → anything | Can a completed record be reopened or corrected? | Q-34 |

Open: whether specimens/tests are created on completion, or as soon as specimens are
registered in DRAFT. Current proposal: tests are **planned on completion**, so drafts
don't pollute the pending-tests list.

FPC01-01 carries two signatures (Muestreador, Visto bueno) but no state. Whether
"Visto bueno" is the completion step is Q-73. Deliveries, samples and specimens are
edited as part of the record while it is `DRAFT`. They have no lifecycle of their own,
except a Specimen's cancellation.

## Specimen [A-21]

Stored: `CREATED`, `CANCELLED`.

Derived (not stored):

| Derived state | Rule |
|---------------|------|
| scheduled | ≥1 test in `SCHEDULED` / `IN_PROGRESS` |
| tested | all non-cancelled tests are `COMPLETED` |

**Why it's derived:** the brief suggested `CREATED → SCHEDULED → TESTED → CANCELLED`.
But "scheduled" and "tested" are facts about the specimen's *tests*. Storing them on
the specimen too would create two sources of truth that can disagree. If Q-16 shows
Specimen ↔ Test is 1:1, revisit this (the states may merge into the test).

Cancelling a specimen (e.g. damaged in transport, an assumed scenario) cancels its open
tests in the same transaction.

## SpecimenTest [A-22]

```
            start()               complete()
 SCHEDULED ─────────▶ IN_PROGRESS ──────────▶ COMPLETED (terminal)
     │                    │
     │ cancel()           │ cancel()
     ▼                    ▼
 CANCELLED (terminal)
```

- `SCHEDULED → COMPLETED` directly is allowed if `IN_PROGRESS` turns out to be
  unnecessary (Q-24). Remove `IN_PROGRESS` entirely if the lab doesn't need it.
- No form shows an "in progress" state. FPC06-01 records results directly, so
  `IN_PROGRESS` is a candidate for removal.
- `complete()` requires the FPC06-01 readings (heights, diameters, load in kgf, age
  tolerance; load time and failure type only when given, Q-60, Q-63). Calculations are
  **BLOCKED** on Q-59 and Q-61.
- `testDate` ("fecha de ensayos", date only) is entered by the user, defaulting to today
  in the tenant timezone. The **actual age at test** is derived from it and `pourDate`.
- Late or missed tests: Q-23. Age tolerance: Q-62.

## Report [A-23]

```
        generate()              finalize()
 DRAFT ───────────▶ GENERATED ────────────▶ FINAL (terminal, immutable)
   ▲                   │
   └── regenerate() ───┘   (new snapshot, same version, while not FINAL)
```

- `DRAFT`: a report request exists. No artifact yet.
- `GENERATED`: snapshot and PDF exist. Can be previewed and regenerated.
- `FINAL`: issued. Snapshot and PDF are frozen. Corrections create a **new Report
  version** (Q-36). The old one stays retrievable.
- Generation failure: the report stays `DRAFT` and the error is logged. If async
  generation is introduced later, add `FAILED`.
- Scope: one FieldRecord [A-68]. general_flow.png says the report is generated
  automatically "once everything is filled". The candidate readiness guard for
  `generate()` is: the record is `COMPLETED` and every non-cancelled test of its
  specimens is `COMPLETED`. Still **BLOCKED** on Q-35.
- Who can finalize: Q-40. Signatures: Q-37 (FPC06-04 has two: Jefe de laboratorio and
  Jefe de control de calidad).

## Tenant / User

- User: `isActive` flag (deactivate, never delete, because users are referenced by
  records they created).
- Tenant: no lifecycle needed for now.
