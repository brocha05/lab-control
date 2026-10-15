# Document analyses and model changes

First batch of lab documents, received and analyzed 2026-10-14. Laboratory: Control de
Calidad y Proyectos, S.A. de C.V. (QCP-CCP). One real case is followed end to end:
registro MCH-068, muestra 102, specimens 405–408, report MAR-PVLT-F1-CTO-REC-068.

| Doc ID | Form | Analysis |
|--------|------|----------|
| FPC01-01 | Registro de campo para la recepción de concreto hidráulico | [FPC01-01.md](FPC01-01.md) |
| FPC01-02 | Bitácora electrónica de ensayos de concreto hidráulico | [FPC01-02.md](FPC01-02.md) |
| FPC06-01 | Registro de resultados de resistencia a la compresión (cilindros), 3 and 7 days | [FPC06-01.md](FPC06-01.md) |
| FPC06-04 | Informe de pruebas de control de concreto hidráulico | [FPC06-04.md](FPC06-04.md) |
| — | `docs/general_flow.png` (process diagram from the product owner) | below |

## Process (general_flow.png + documents)

```
Alta de clientes/administración
  └─▶ Proyecto (obra)
        └─▶ Registro de campo FPC01-01 (one per pour, N deliveries, specimens molded)
              └─▶ Bitácora FPC01-02 (one row per specimen; derived)
                    └─▶ Registro de ensayo de cilindros FPC06-01
                        (per test date; ages configurable, "normalmente 2-7 a 2-28 días")
                        └─ results complete the Bitácora
              └─▶ when everything is filled: Informe FPC06-04 → PDF (auto-generated)
```

## Model changes (applied to the draft schema)

At the owner's request (2026-10-14), these were applied to
`apps/backend/prisma/schema.prisma` in the same pass as the analysis, instead of waiting
for a separate review (checklist step 13). They're **not migrated**. Review them before
development-plan 2.1 / 4.1.

| # | Change | Evidence | Assumption / question |
|---|--------|----------|----------------------|
| 1 | New entity **Delivery** (*entrega*): FieldRecord 1:N Delivery. Sample now belongs to a Delivery | FPC01-01 table rows | A-60, A-61 |
| 2 | `FieldRecord.recordDate` → `pourDate` ("fecha del colado"), the test-age reference date | FPC06-04 dates | A-12 confirmed |
| 3 | FieldRecord gets the header, specified/ticket parameters, conditions, equipment codes, unit weight and air content inputs, elements, observations, sampler, and the report-only pour fields | FPC01-01, FPC06-04 | A-64, A-65, A-69, A-74, A-75 |
| 4 | Sample: `sampleNumber`, `specimenType`, `moldedAt` | FPC01-01, FPC01-02 | A-63, Q-57 |
| 5 | Specimen: `specimenNumber`, `moldCode` | FPC01-01 | A-62, Q-58 |
| 6 | SpecimenTest: `testDate` replaces `performedAt`; heights, diameters, load (kgf), duration, failure type, age-tolerance flag, press and instrument codes | FPC06-01 | A-67, A-71 |
| 7 | Report scope: `projectId` → `fieldRecordId`. Adds `reportNumber` | FPC06-04 | A-07 rejected, A-68 |
| 8 | Client: `contactName`, `contactPhone`. Project: `location`. Tenant: `legalName`, `address`, `phone` | FPC06-04, FPC01-01 | A-70 |
| 9 | Enums for values printed on forms: `StrengthCriterion`, `ConcreteProduction`, `SkyCondition`, `WindCondition`, `LightingCondition`, `SpecimenType` | FPC01-01, FPC01-02 | A-64 |

Deliberately **not** done:

- No calculated columns (area, stress, MPa, %, averages, N, loading rate, unit weight,
  cumulative volume). No formula is printed on any form. The numbers fit the candidate
  formulas in the analyses, but they disagree on rounding (Q-59) and the MPa factor
  (Q-61). Store vs. derive is decided in development-plan 7.5.
- No equipment catalog (Q-29, Q-75). No test-session/worksheet entity (A-72, Q-69).
  No signatures (Q-37, Q-73). No numbering rules or unique constraints on registro,
  sample, specimen or report numbers (Q-55…Q-58).
- `ProjectTestConfiguration` is unchanged (A-10 still open; see Q-20, Q-74).

## Conflicts that need an answer from the lab

1. **% de resistencia rounding** (Q-59): Bitácora and worksheet compute it from the
   rounded stress; the report computes it from the unrounded stress.
2. **Tipo de falla** for 407 (Q-60): "3" on the worksheet, "-" on the report.
3. **Report number** (Q-56): the file name says "CON-REC-068", the PDF says "CTO-REC-068".
4. **Obra name** (Q-78): three spellings across three forms.
