# Domain Overview

> Status: **discovery phase**. This describes the domain as we currently understand it
> from a verbal description. No official laboratory documents have been analyzed yet.
> See [assumptions.md](assumptions.md) and [open-questions.md](open-questions.md).

## What the business does

A construction-materials testing laboratory performs quality-control testing for
construction projects. The first (and for now only) material in scope is **hydraulic
concrete** (*concreto hidráulico*).

Roughly:

1. A client hires the lab to control the concrete on a **project**.
2. On each pour, a field technician fills in a **Field Record** (sampling event): date,
   concrete and truck/delivery information, samples taken, specimens (cylinders)
   molded, and observations.
3. The specimens are taken to the lab and tested at configured **ages** (for example
   7 and 28 days after the reference date).
4. Test results are recorded.
5. All of this together makes up the project's **Bitácora** (log).
6. Once enough information exists, the lab issues a formal **report**
   (*Informe de pruebas de control de concreto hidráulico*) as a PDF.

## Core principle

```
SOURCE OF TRUTH (normalized domain entities)
        │
        ▼
Derived views (Bitácora, pending tests, schedules, metrics)
        │
        ▼
Report snapshot (frozen copy of the data used)
        │
        ▼
PDF (stored artifact)
```

- Data is entered **once**, into the source-of-truth entities.
- Everything that can be calculated reliably is **derived**, never typed in by users.
- What has been issued to a client is **frozen** (snapshot), so later edits can't
  silently change history.

## Conceptual model

```
Tenant (laboratory company)
 ├── User
 └── Client
      └── Project
           ├── ProjectTestConfiguration   (which ages / how many specimens)  [A-10]
           ├── FieldRecord                (sampling event in the field)
           │    └── Sample
           │         └── Specimen         (cylinder)
           │              └── Test        (lab test at a given age)
           └── Report                     (historical, snapshotted artifact)

Derived (not stored as source data):
  Bitácora · Pending tests · Test schedule · Specimen age · Dashboard metrics
```

## Bounded areas inside the monolith

| Area | Responsibility | Write model? |
|------|----------------|--------------|
| Identity & tenancy | Tenants, users, authentication, roles | Yes |
| Clients & projects | Who the work is for, and project-level configuration | Yes |
| Field capture | Field records, samples, specimens | Yes |
| Lab testing | Test planning, scheduling, results | Yes |
| Bitácora | Consolidated read view per project | **No** (read-only) |
| Reporting | Report data assembly, snapshot, PDF rendering, storage | Yes (Report artifacts only) |

## Glossary

| Term | Meaning (current understanding) | Validated? |
|------|---------------------------------|-----------|
| **Tenant** | A laboratory company using the system. All its data is isolated from other tenants. | n/a (technical) |
| **Client** (*cliente*) | The party the lab works for on a project. | No (Q-41) |
| **Project** (*obra / proyecto*) | A construction project under quality control. | No |
| **Field Record** (*registro de campo*) | The record of a sampling event in the field (one pour / delivery). | No (Q-01) |
| **Trompo** | Concrete mixer truck. Delivery information may relate to it. | No (Q-05) |
| **Sample** (*muestra*) | Material taken during a field event. | No (Q-10) |
| **Specimen / Cylinder** (*espécimen / cilindro*) | A molded test piece made from a sample. | No (Q-10, Q-12) |
| **Test age** (*edad de prueba*) | The number of days after the reference date when a specimen is tested. | No (Q-18, Q-19) |
| **Test** (*ensaye / prueba*) | A laboratory test performed on a specimen at an age. Named `SpecimenTest` in code (see [entities.md](entities.md)). | No (Q-24) |
| **Bitácora** | Consolidated log of a project's field records, samples, specimens, and tests. A **derived** view. | No (Q-27) |
| **Report** (*informe*) | Formal PDF document issued to the client. A historical artifact. | No (Q-31, Q-32) |

## Future materials (out of scope now)

Soil, asphalt, and other materials may come later. We are **not** modelling them now.
We only avoid design choices that would block them. See
[../roadmap/future.md](../roadmap/future.md#additional-materials).
