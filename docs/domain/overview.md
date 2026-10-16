# Domain Overview

> Status: the lab documents (FPC01-01, FPC01-02, FPC06-01, FPC06-04) and the process
> diagram were analyzed on 2026-10-14, and the lab answered the follow-up questionnaire
> on 2026-10-15: [analysis/](analysis/README.md). Remaining unknowns:
> [assumptions.md](assumptions.md) and [open-questions.md](open-questions.md).

## What the business does

A construction-materials testing laboratory performs quality-control testing for
construction projects. The first (and for now only) material in scope is **hydraulic
concrete** (*concreto hidráulico*).

Roughly:

1. A client (*solicitante / contratista*) hires the lab to control the concrete on a
   **project** (*obra*).
2. On each pour (*colado*), the field technician (*muestreador*) fills in the **field
   record** FPC01-01: specified concrete, ambient conditions, equipment used, one row
   per **delivery** (truck) with times, temperatures and slump, and the **specimens**
   molded from the sampled delivery.
3. The specimens are tested in the lab at configured **ages** counted from the pour
   date (3 and 7 days in the example; "normalmente 2-7 a 2-28 días"). Each test day
   produces the compression worksheet FPC06-01.
4. Field and test data together form the **Bitácora** FPC01-02, one row per specimen.
5. Once every test of the sample is done, the lab issues the **report** FPC06-04
   (*Informe de pruebas de control de concreto hidráulico*) as a PDF, one per sample.

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
           └── FieldRecord                (registro de campo FPC01-01: one pour)
                ├── Delivery              (entrega: one truck / batch)        [A-60]
                │    └── Sample           (muestra, from one delivery)        [A-61]
                │         └── Specimen    (espécimen: cylinder, beam, cube)
                │              └── SpecimenTest (ensaye at a given age, FPC06-01)
                └── Report                (informe FPC06-04, snapshotted)     [A-68]

Derived (not stored as source data):
  Bitácora (FPC01-02) · Compression worksheet (FPC06-01) · Pending tests ·
  Test schedule · Specimen age · Calculated results · Dashboard metrics
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
| **Client** (*solicitante* on FPC01-01, *contratista* on FPC06-04) | The party the lab works for on a project. | Yes (FPC01-01, FPC06-04) |
| **Project** (*obra*) | A construction project under quality control, with a location. | Yes (FPC01-01) |
| **Field Record** (*registro de campo*, FPC01-01) | The record of one pour (*colado*): specified concrete, conditions, equipment, deliveries, specimens. Numbered "MCH-068". | Yes (FPC01-01) |
| **Colado** | A pour. Its date (*fecha del colado*) is the test-age reference date. | Yes (FPC06-04) |
| **Delivery** (*entrega*) | One truck (*trompo*, ready-mix) or batch (site-mixed) received during the pour. A row of FPC01-01. | Yes (FPC01-01) |
| **Remisión** | Delivery ticket of one truck, with its own f'c, slump, aggregate, cement and age (Q-65). | Yes (FPC01-01, Q-65) |
| **MCH** | *Muestreo de Concreto Hidráulico*: prefix of the registro number, consecutive per project (Q-55). | Yes (Q-55) |
| **Frente** | A front of a project ("F1" in the report number); a project can have several (Q-56). | Yes (Q-56) |
| **CTO-REC** | Report number segments: *concreto* · *resistencia a compresión* (Q-56). | Yes (Q-56) |
| **PSV** | *Paso Superior Vehicular*: informal project reference with no traceability (Q-78). | Yes (Q-78) |
| **Hoja** | A paper sheet of the field record, 7 trucks each; one record can have several (Q-71, Q-77). | Yes |
| **Visto bueno** | Signature that closes the field record, usually the client's (Q-73). | Yes (Q-73) |
| **Tolerancia de edad** | Allowed window around a test age, from the molding time (NMX-C-083, Q-62). | Yes (Q-62) |
| **Especímenes hermanos** | The two specimens tested at the same age; the age's result is their average (Q-14). | Yes (Q-14) |
| **Signatario Técnico** | Person accredited by the ema to endorse reports; at least one signs each report (Q-37). | Yes (Q-37) |
| **ema** | *Entidad Mexicana de Acreditación*. The lab is accredited under NMX-EC-17025-ONNCCE-2018 (Q-52). | Yes (Q-52) |
| **Revenimiento** | Slump (cm). Specified as "14.0 ± 3.5"; measured twice per delivery. | Yes (FPC01-01) |
| **f'c / MR** | Specified compressive strength / modulus of rupture (kgf/cm²). | Yes (FPC01-01) |
| **Edad definitiva** | Age at which the supplier guarantees design f'c. Test ages follow from it but are chosen by the user (Q-74). | Yes (Q-74) |
| **Sample** (*muestra*) | Concrete taken from one delivery to mold specimens. Numbered "102". | Yes (FPC01-02, FPC06-04) |
| **Specimen** (*espécimen*: cilindro, viga, cubo) | A molded test piece. Numbered "405"; made in a mold with its own key ("020"). | Yes (FPC01-01) |
| **Test age** (*edad de ensayo*) | Days after the pour date when a specimen is tested. | Yes (FPC06-04) |
| **Test** (*ensaye*) | Compression test of a specimen at an age (FPC06-01). Named `SpecimenTest` in code (see [entities.md](entities.md)). | Yes (FPC06-01) |
| **Tipo de falla** | Failure pattern number observed after the break (NMX-C-083). | Partly (Q-60) |
| **Bitácora** (FPC01-02) | Electronic log, one row per specimen, field data + result. A **derived** view. | Yes (FPC01-02); scope Q-68 |
| **Report** (*informe*, FPC06-04) | Formal PDF issued to the client for one field record, one page per sample. Informative only, no conformity statement (Q-28). A historical artifact. | Yes (FPC06-04, Q-71) |
| **SGC** | *Sistema de gestión de calidad*: the lab's quality system. Its coordinator signs FPC06-01. | Yes (FPC06-01) |

## Future materials (out of scope now)

Soil, asphalt, and other materials may come later. We are **not** modelling them now.
We only avoid design choices that would block them. See
[../roadmap/future.md](../roadmap/future.md#additional-materials).
