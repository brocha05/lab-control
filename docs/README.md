# Documentation

| Folder | Contents |
|--------|----------|
| [architecture/](architecture/) | [overview](architecture/overview.md) · [decisions index](architecture/decisions.md) · [multi-tenancy](architecture/multi-tenancy.md) · [data flow](architecture/data-flow.md) · [repository structure](architecture/repository-structure.md) |
| [domain/](domain/) | [overview & glossary](domain/overview.md) · [entities](domain/entities.md) · [lifecycle](domain/lifecycle.md) · [assumptions](domain/assumptions.md) · [open questions](domain/open-questions.md) · [**discovery checklist**](domain/discovery-checklist.md) · [**document analyses**](domain/analysis/README.md) |
| [database/](database/) | [schema](database/schema.md) · [relationships & ERD](database/relationships.md) |
| [api/](api/) | [conventions](api/conventions.md) · [endpoints](api/endpoints.md) |
| [reports/](reports/) | [architecture](reports/architecture.md) · [generation flow](reports/report-generation.md) |
| [roadmap/](roadmap/) | [MVP & phases](roadmap/MVP.md) · [development plan (tasks)](roadmap/development-plan.md) · [future](roadmap/future.md) |
| [decisions/](decisions/) | ADR-001 … ADR-007 |

## Documentation rules

- **Assumptions** have IDs `A-xx`, **questions** have IDs `Q-xx`. Reference them from
  code comments and docs. Never silently turn an assumption into a fact.
- Anything domain-specific that is not backed by an official lab document is marked
  `TBD`, `ASSUMPTION A-xx`, or `TODO: VALIDATE WITH LAB DOCUMENTATION`.
- Official laboratory documents are the **source of truth** for domain behaviour. When
  one arrives, follow [domain/discovery-checklist.md](domain/discovery-checklist.md)
  **before** changing schema, API, or UI.
- Architectural changes = new ADR (supersede, don't rewrite).
