# Visual design

Source: the Claude Design project "Laboratorio" (`Laboratorio.dc.html`, a clickable
prototype with demo data), adopted on 2026-10-16. The prototype is a reference for look
and flow only; fields and rules still come from the lab's documents (`docs/domain/`).

## System

- Canvas `#F4F4F1`, white panels with `#E3E3DF` borders (8px radius), text `#1B1D1F`,
  secondary text `#5E6266` / `#7A7E83`.
- One action colour: blue `#1D4F91` (hover `#173F74`, focus outline `#B9CDEA`).
- IBM Plex Sans for text, IBM Plex Mono for numbers, codes and dates in tables.
- Status chips with a dot: Pendiente (grey-blue), Hoy (amber), Atrasado (red),
  Completado (green), Borrador (dashed grey), Cancelado (light grey), En proceso (blue).
- Light by default; a soft dark variant (warm greys, lighter blue `#4A7FC9`) behind the
  top-bar toggle, stored per browser. Same tokens redefined under `.dark`; print is
  always light. Use tokens, never hex classes, so both themes follow.

Tokens live in `apps/frontend/src/app/globals.css`; the domain status → chip mapping in
`apps/frontend/src/lib/status.ts`.

## Screens taken from the prototype

| Prototype | App |
|---|---|
| Sidebar "Operación", top bar with breadcrumbs, project picker and "Nuevo registro" | `components/layout/*` (mobile drawer under 768px) |
| Dashboard (attention banner, metrics, upcoming tests, projects) | `/dashboard` |
| Clientes (list, actions Ver / Editar / Proyectos) | `/clients`, `/clients/:id` |
| Proyectos (list with pending-test counts) and project page with tabs | `/projects`, `/projects/:id?tab=resumen\|registros\|ensayos\|config` |
| Configuración de ensayos (ages × specimens, example dates) | project tab "Configuración" |
| Nuevo registro de campo (5-step wizard) | `/field-records/:id` while DRAFT, steps follow the FPC01-01 blocks |
| Registro de campo (read-only cards + cylinders) | `/field-records/:id` once completed or cancelled |
| Ensayos pendientes (tiles, filters, table / mobile cards) | `/tests/pending` and the project tab "Ensayos" |

## Adapted or left out

- **Not added** (not in the analyzed sources): client RFC, email, address and notes;
  client/project "Activo/Inactivo" state; project responsible, start date, usual
  supplier and project-level f'c; "Fecha de registro" separate from the pour date;
  volume requested vs. received; a single "Hora de muestreo" per record.
- **Shaped to the real form**: the wizard steps are the sheet's blocks (general,
  concrete, deliveries with their samples and specimens, conditions and equipment,
  confirmation). Numbers are the lab's (`MCH-068`, sample and specimen numbers per
  project), not `#000126` / `M-006` / `C-045`. Ages are the project's (Q-20), with no
  closed list (Q-19) and no on/off switch.
- **Vocabulary**: "Informes" instead of "Reportes" and "ensayo" as in the lab's forms
  (A-40).
- **Later phases**: test result capture (Phase 7), Bitácora (Phase 8) and reports with
  preview / versions (Phase 9) keep their "disponible próximamente" pages. The
  prototype's "Registrar ensayo" button becomes "Ver registro" until Phase 7.
