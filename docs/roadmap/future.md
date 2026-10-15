# Future (post-MVP) — Not in scope, documented to avoid blocking it

## Additional materials

Soil, asphalt, aggregates, etc. **Do not model them now.** Expected direction, to be
decided in an ADR when the first new material is real:

- The **shared spine** stays: Tenant → Client → Project → *sampling event* → *specimen*
  → *test* → Bitácora → Report.
- Material-specific content goes into **material-specific modules and tables**
  (e.g. `concrete_field_details` 1:1 with `field_records`), not into a generic
  key/value or giant JSON column.
- Test types become a discriminator on `specimen_tests` (or separate tables per test
  type) once a second test type actually exists.
- Reports: new template folders + assemblers (already supported by the TemplateRegistry
  design).

What we're doing now to keep that open:

- Concrete-specific fields will be added as clearly concrete-named columns/modules after
  document analysis. Don't spread "concrete" assumptions into the generic names
  (`FieldRecord`, `Sample`, `Specimen`, `SpecimenTest` stay generic).
- Test ages are configuration, not constants.

## Offline / PWA field capture (Phase 12)

Field connectivity may be poor (A-42, Q-49). Options, from simplest:

1. **Draft-first UX** (cheap, could even be MVP): autosave the form to local storage
   and submit when online. No sync conflicts, because a draft belongs to one device.
2. **PWA with a background sync queue** of create-only operations (field records are
   mostly append-only).
3. Full offline-first sync (e.g. local DB + replication). Only if 1–2 are insufficient.

Design choices already made that help: UUIDs (can be generated on the client),
explicit state transitions (replayable commands), no server-generated sequential IDs
on records. Note: official folios (Q-03) may need server assignment, which affects
option 2.

## Other candidates

- Client portal (read-only reports): Q-43
- PostgreSQL Row Level Security (Phase 10)
- Full audit trail / entity history (Q-54)
- Digital signatures / QR verification on PDFs (Q-38)
- Async report worker (ADR-006 trigger)
- Notifications (tests due tomorrow)
- Data import from historical spreadsheets (Q-53)
- Dashboard metrics (pass/fail trends: **only** once acceptance criteria are known)
- Billing / quoting (Q-42)
