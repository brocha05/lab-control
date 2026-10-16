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

Confirmed (Q-49): internet is hard to get on site, and the lab prefers to capture on
paper and transcribe later. Offline capture is therefore not needed for the MVP.
Options if that changes, from simplest:

1. **Draft-first UX** (cheap, could even be MVP): autosave the form to local storage
   and submit when online. No sync conflicts, because a draft belongs to one device.
2. **PWA with a background sync queue** of create-only operations (field records are
   mostly append-only).
3. Full offline-first sync (e.g. local DB + replication). Only if 1–2 are insufficient.

Design choices already made that help: UUIDs (can be generated on the client),
explicit state transitions (replayable commands), no server-generated sequential IDs
on records. Note: official folios (Q-03) may need server assignment, which affects
option 2.

## Requested by the lab (questionnaire 2026-10-15)

| Feature | Lab's words | Question |
|---------|-------------|----------|
| Other specimens and tests: beams (MR, 50 and 60 cm), 10×20 cylinders, 15 and 10 cm cubes | "mejora a futuro, en el corto plazo" | Q-70 |
| Client portal to download reports | "sería muy útil" | Q-43 |
| Verification QR on the PDF | "si no es muy complicado" | Q-38 |
| Equipment control with calibration/verification dates | "mejora a futuro" | Q-29 |
| Quotes and billing | "como mejora" | Q-42 |

## Other candidates

- PostgreSQL Row Level Security (Phase 10)
- Async report worker (ADR-006 trigger)
- Notifications (tests due tomorrow)
- Dashboard metrics. The report is informative only, with no conformity statement
  (Q-28), so no pass/fail metrics unless the lab asks for them.
