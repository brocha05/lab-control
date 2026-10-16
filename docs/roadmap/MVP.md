# MVP Roadmap

## MVP definition

> A lab user can register a project, capture its field records with samples and
> specimens, see which tests are due, record test results, view the project Bitácora,
> and issue a historical PDF report that matches the official format, all isolated
> per tenant.

Out of MVP: offline/PWA, client portal, billing, other materials, RLS, async workers
(unless needed), digital signatures (unless legally required, Q-38).

## Phases

| Phase | Goal | Blocked on documents? | Exit criteria |
|-------|------|-----------------------|---------------|
| **0** Domain discovery | Get and analyze the official documents | — (this *is* the unblocker) | Every P0 question in open-questions.md answered. Discovery analyses written. |
| **1** Architecture + skeleton | Repo, docs, backend skeleton, frontend bootstrap, local infra | No | ✅ docs, ✅ backend skeleton builds, tests pass, ✅ frontend bootstrap, ✅ CI. |
| **2** Core entities + DB | First migration (tenancy, users, clients, projects), seed, minimal auth | No (structure only) | Migration applied. Login works. Cross-tenant test passes. |
| **3** Clients / Projects | CRUD + UI | Partially (extra fields Q-41) | Lab can create clients/projects in the UI. |
| **4** Field Records | Capture form, DRAFT/COMPLETE/CANCEL | **No** (questionnaire answered); front numbering Q-79 | Form matches the official field record. |
| **5** Samples / Specimens | Registration within a record | **No** | Specimen identification matches lab practice. |
| **6** Test scheduling | Configuration per project, planning, pending list | **No** (rules implemented); holidays Q-81 | Pending list matches the lab's real schedule for a sample week. |
| **7** Test results | Record measurements, calculations, complete | **No** (formulas implemented); Q-80 | Calculated values match the lab's existing spreadsheets for N real cases. |
| **8** Bitácora | Composed read view + export? | **No** | Lab confirms it replaces their current Bitácora. |
| **9** PDF reports | Snapshot, template, storage, finalize | **No**; partial-report numbering Q-82 | PDF accepted by the lab as equivalent to the official report. |
| **10** Auth / multi-tenant hardening | Real roles, audit events, exhaustive isolation tests, RLS decision | Q-39, Q-40, Q-54 | Security review passed. |
| **11** Production deployment | Hosting, backups, monitoring, secrets | No | Restore drill done. Alerts configured. |
| **12** Offline/PWA & advanced | Field offline capture, etc. | Q-49 | — |

### Reordering recommendation

The brief puts authentication in Phase 10. **Minimal authentication moves to Phase 2**,
because tenant scoping needs an authenticated tenant from the very first endpoint, and
the boilerplate already provides it. Phase 10 keeps role design, audit, and hardening.

The documents arrived on 2026-10-14 and the lab answered the questionnaire on
2026-10-15 ([analysis](../domain/analysis/README.md)). No phase is blocked on documents
any more; the few 🔒 items left in the [development plan](development-plan.md) wait for
Q-79 … Q-86.

## Milestones

| Milestone | Contents | Demo |
|-----------|----------|------|
| M1 "Foundation" | Phases 1–3 | Log in, create a client + project, configure test ages. |
| M2 "Field to lab" | Phases 4–7 | Capture a real field record from paper. Pending tests appear. Record results. |
| M3 "Bitácora & report" | Phases 8–9 | View the Bitácora and issue a PDF for a real past project. Compare with the original. |
| M4 "Production" | Phases 10–11 | Pilot with the lab, in parallel with their current process. |

**Pilot strategy:** run the system in parallel with the lab's current process for at
least one full 28-day cycle (or the longest configured age) before switching.
