# Domain Discovery Checklist

Use this **every time** the laboratory provides a document (PDF, Excel, Word, photo of
a paper form, an issued report, …).

**Rule: do not modify the architecture, schema, API, or UI while analyzing.** First
analyze and document. Then propose changes. Only then implement.

---

## 0. Register the document

Add a row to the [Source Document Register](#source-document-register) below. Store
the original file in `docs/domain/sources/` **only if it contains no personal or client
data**. Otherwise store it outside the repository and record its location.

## 1. Analyze (write to `docs/domain/analysis/<doc-id>.md`)

Copy this template:

```markdown
# Analysis: <DOC-ID> — <document name>

Date analyzed: YYYY-MM-DD   Analyst: <name>

## Purpose of the document
What is it, who fills it in, when, and who receives it?

## Entities identified
| Entity (lab's term) | Maps to (our model) | New? | Notes |

## Fields
| Field (as printed) | Entity | Type | Unit | Required? | Manual / calculated / copied | Example | Notes |

## Relationships & cardinalities
(e.g. "one record lists up to N trucks"; "each sample yields K cylinders")

## Calculated values
| Value | Formula (verbatim from document) | Inputs | Rounding | Standard cited |
(Never "fix" or simplify a formula. Copy it exactly as written.)

## Workflow states / signatures / approvals observed

## Business rules

## Validation rules (ranges, mandatory combinations)

## Numbering / identifiers

## Report requirements (layout, header/footer, logos, signatures, legends)

## Comparison with current assumptions
| Assumption | Confirmed / Rejected / Partial | Evidence |

## Questions answered
| Question ID | Answer | Evidence |

## New questions raised

## Conflicts with current model
(Describe each conflict explicitly. Don't resolve it here.)
```

## 2. Checklist per document

- [ ] 1. Purpose and actors identified
- [ ] 2. Entities identified and mapped to the current model
- [ ] 3. Every field listed (including blank/unused boxes on the form)
- [ ] 4. Relationships and cardinalities identified
- [ ] 5. Calculated fields identified, with formulas copied **verbatim**
- [ ] 6. Workflow states, approvals, and signatures identified
- [ ] 7. Business rules identified
- [ ] 8. Validation rules identified
- [ ] 9. Report requirements identified
- [ ] 10. Compared against [assumptions.md](assumptions.md). Each affected assumption updated
- [ ] 11. [open-questions.md](open-questions.md) updated (answers + new questions)
- [ ] 12. Conflicts documented explicitly
- [ ] 13. Proposed changes written up (schema / API / UI) **for review**. No code yet
- [ ] 14. After approval: [entities.md](entities.md), [lifecycle.md](lifecycle.md), [../database/schema.md](../database/schema.md), and `PROJECT_STATUS.md` updated
- [ ] 15. After approval: migration + code + tests

## 3. Documents to request from the laboratory

| # | Document | Unblocks |
|---|----------|----------|
| 1 | Blank Field Record form + 3 filled examples (different projects) | Q-01 … Q-09, Phase 4 |
| 2 | Lab test worksheet / test log (blank + filled) | Q-24 … Q-30, Phase 7 |
| 3 | The current Bitácora (Excel or paper), real example | Q-27, Phase 8 |
| 4 | 2–3 issued "Informe de pruebas de control de concreto hidráulico" (incl. one corrected/re-issued, if any) | Q-31 … Q-38, Q-51, Phase 9 |
| 5 | Specimen labels / identification scheme | Q-13 |
| 6 | Internal procedure documents and applicable standards list | Q-18 … Q-23, Q-26, Q-52 |
| 7 | Org chart / list of roles and who signs what | Q-39, Q-40 |
| 8 | Any existing spreadsheet of projects/clients (for migration) | Q-53 |
| 9 | Accreditation requirements (if any) | Q-52, Q-54 |

## 4. Interview topics (30–60 min walkthrough)

Walk through **one real project end-to-end** with the lab operator, from quote to
issued report, using real (anonymized) paperwork. Ask "what happens if…" for:
a broken cylinder, a missed test date, a typo found after the report was issued, a
client asking for a partial report, a pour cancelled mid-way.

---

## Source Document Register

| Doc ID | Name | Type | Received | Location | Analyzed | Analysis file |
|--------|------|------|----------|----------|----------|---------------|
| FPC01-01 | Registro de campo para la recepción de concreto hidráulico (filled, MCH-068) | Scanned PDF | 2026-10-14 | `docs/lab-pdfs/001 REGISTRO DE COLADO (DE CAMPO).pdf` | 2026-10-14 | [analysis/FPC01-01.md](analysis/FPC01-01.md) |
| FPC01-02 | Bitácora electrónica de ensayos de concreto hidráulico (one sample) | PDF export | 2026-10-14 | `docs/lab-pdfs/002 BITÁCORA DE ENSAYOS.pdf` | 2026-10-14 | [analysis/FPC01-02.md](analysis/FPC01-02.md) |
| FPC06-01 | Registro de resultados de resistencia a la compresión (cilindros), 3 days and 7 days | Scanned PDF ×2 | 2026-10-14 | `docs/lab-pdfs/003 …A 3 DÍAS.pdf`, `004 …A 7 DÍAS.pdf` | 2026-10-14 | [analysis/FPC06-01.md](analysis/FPC06-01.md) |
| FPC06-04 | Informe de pruebas de control de concreto hidráulico (MAR-PVLT-F1-CTO-REC-068) | PDF | 2026-10-14 | `docs/lab-pdfs/005 INFORME DE ENSAYOS (MAR-PVLT-F1-CON-REC-068).pdf` | 2026-10-14 | [analysis/FPC06-04.md](analysis/FPC06-04.md) |
| — | Process diagram | PNG | 2026-10-14 | `docs/general_flow.png` | 2026-10-14 | [analysis/README.md](analysis/README.md#process-general_flowpng--documents) |
| — | Questionnaire answered by the lab (Q-02 … Q-78) | Word | 2026-10-15 | Outside git (`docs/*.docx` is ignored) | 2026-10-15 | [analysis/questionnaire-2026-10-15.md](analysis/questionnaire-2026-10-15.md) |

> The PDFs contain client data (client and contact names, a mobile phone number) and
> staff names/signatures, so they are **not in git** (§0). `docs/lab-pdfs/` is
> gitignored: it exists only on the analyst's machine. Get the files from the product
> owner if you need them.
