# ADR-008: Test results are derived on read, frozen only in reports

- Status: Accepted
- Date: 2026-10-16
- Answers development-plan 7.5

## Context

A compression test stores what the lab reads at the press (FPC06-01): two heights, two
diameters, the maximum load in kgf, the load time on spot checks and the failure type.
Everything else on the sheet (means, area, Newton, kgf/cm², MPa, % of design, loading
rate, age tolerance) is a formula of those readings, confirmed by the lab (Q-26, Q-59,
Q-61, Q-62) and implemented once in `compression.ts` and `age-tolerance.ts`.

The lab is accredited (NMX-EC-17025) and must be able to show what was reported.

## Decision

- `specimen_tests` stores **only the readings** plus test date/time, press and
  dimension instruments, and who recorded them. No calculated column.
- The worksheet, the record page and (later) the Bitácora compute results on read with
  the same domain functions, as ADR-004 does for the Bitácora.
- What was **reported** is frozen by the report snapshot (ADR-005): the snapshot holds
  the calculated values as issued, so a later change to a rounding rule (e.g. Q-80)
  never alters an issued report.

## Alternatives

| Option | Why not |
|--------|---------|
| Store calculated values next to the readings | Two sources of truth; a formula fix (Q-80 is still open) would need a data migration and could silently disagree with reports. |
| Store them only for audit | The audit need is "what was reported", which ADR-005 already covers with the snapshot + SHA-256. |

## Consequences

- Correcting a reading corrects every derived value at once (A-85).
- Formula changes apply to everything not yet reported; issued reports don't move.
- Reading a worksheet costs a few arithmetic operations per row: negligible at the
  lab's volume (A-50).
