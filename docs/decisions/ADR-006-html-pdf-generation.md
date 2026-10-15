# ADR-006: Generate PDFs from HTML/CSS templates

- Status: Accepted
- Date: 2026-10-03

## Context

Reports are formal documents with tables, headers, logos, and signatures. The exact
layout is unknown (Q-32). More report types will follow (other tests, other materials).

## Decision

Pipeline: **snapshot → template (HTML + CSS) → Playwright (headless Chromium)
`page.pdf()` → object storage**.

- Templates live in `apps/backend/src/reports/templates/<template-key>/` (`template.html`,
  `styles.css`, optional partials) and are versioned with the code. `template_version`
  is recorded on each report.
- Templating engine: a logic-less engine (Handlebars or similar), chosen in Phase 9.
  Templates contain **no** calculations; the snapshot already holds every value to print.
- Print CSS (`@page`, page breaks, running headers/footers through Playwright's
  header/footer templates).
- Rendering runs **synchronously in the API** at MVP scale (A-52), with a timeout. If p95
  exceeds a few seconds or concurrent load appears, move it to a queue + worker (SQS or
  similar). The `ReportRenderer` interface makes that a deployment change.

## Alternatives

| Option | Why not |
|--------|---------|
| Low-level PDF drawing (pdfkit, jsPDF) | Coordinate-based layout is slow to build and painful to change for table-heavy formal documents. |
| Puppeteer | Equivalent. Playwright chosen for its maintained browser management. Either is acceptable. |
| Hosted PDF API / Gotenberg | Gotenberg (a container) is a good option if Chromium in the API image becomes a burden. Keep as fallback. |
| React-PDF | Its own layout model. HTML/CSS skills transfer better and templates can be previewed in a browser. |

## Consequences

- ✅ Designers and devs can iterate on templates in a browser.
- ✅ New report types = new template folder + new assembler.
- ⚠️ Chromium increases the backend image size and memory. Monitor.
- ⚠️ Pixel-exact replication of an existing official form may need CSS tuning (mm units, fixed table layouts).
