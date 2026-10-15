# ADR-001: Modular monolith instead of microservices

- Status: Accepted
- Date: 2026-10-03

## Context

The system serves one laboratory at first, maybe a handful later (assumption A-50).
The domain is still being discovered: entity boundaries **will** move once the
official documents arrive. The team is small. The workflows (field record → specimens
→ tests → report) are tightly related and often need transactional consistency (e.g.
completing a field record plans its tests).

## Decision

Build a single NestJS application split into domain modules (`clients`, `projects`,
`field-records`, `specimen-tests`, `bitacora`, `reports`, …) with one PostgreSQL
database. Modules own their tables. Other modules interact through exported services,
not through each other's tables.

## Alternatives

| Option | Why not |
|--------|---------|
| Microservices | Network boundaries around a domain we don't understand yet would harden wrong boundaries. Distributed transactions for "complete record + plan tests". Much higher operational cost. Nothing at this scale needs independent scaling. |
| Unstructured monolith | Fast at first, but a future material domain (soil, asphalt) or a report worker would be hard to separate. |
| Serverless functions per endpoint | Fragments the domain logic. Cold starts plus a headless browser for PDF are a poor fit. |

## Consequences

- ✅ One deploy, one database, simple transactions, fast refactoring while the domain changes.
- ✅ Module boundaries keep the option to extract a service later (most likely candidate: PDF rendering worker).
- ⚠️ Boundaries are enforced by convention and review, not by the network. Keep the "no cross-module table writes" rule.
- ⚠️ PDF rendering (headless Chromium) shares the API process's resources. Acceptable at MVP scale (A-52). Extraction path in ADR-006.
