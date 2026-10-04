# Project Day 20 Prototype Decisions

## Source

- Branch: `origin/codex/project-day-20-full-site-prototype`
- Commits:
  - `54983df98367330a5fd0e73d53a8f61436f40575` — `feat: add full site decision prototype`
  - `693cc00d96ffb151f08b4541be57531950998481` — `fix: align prototype law bank naming`
  - `c59598b749b2a0ffb6d976e7b7a51118ccd486bf` — `fix: clarify prototype tax disclaimer`

## Purpose

The Day 20 work was a bilingual product and information-architecture decision prototype. It provided one navigable surface for comparing existing sections, candidate sections, possible deep pages, empty/error states, and lightweight interactive tools before deciding which ideas belonged in production.

It was intentionally not a production feature set. Example content, figures, forms, maps, dashboards, and legal or financial tools were presented with explicit prototype boundaries so that layout and product decisions could be evaluated without implying that the underlying services or data existed.

## Bilingual route approach

The prototype used two isolated catch-all route families:

- Turkish: `/site-prototipi/[[...slug]]`
- English: `/en/site-prototype/[[...slug]]`

A shared page registry stored separate Turkish and English path segments, titles, and descriptions. Both route families resolved their locale-specific paths through the same registry and rendered a shared page view. Static parameters were generated for every registered prototype page, language alternates were emitted for the paired routes, and all prototype pages were marked `noindex, nofollow`.

This approach demonstrated a bilingual route map without changing the production routes or CMS content model.

## Prototype tools and interactions

### Search

The prototype included client-side search across the registered prototype pages. Search matched localized titles, descriptions, and group names and returned links to the corresponding Turkish or English prototype routes.

### Rent and ROI examples

The interactive prototype demonstrated simple calculations for:

- Gross rental yield: annual rent divided by property value.
- Illustrative ROI: the difference between two example values divided by the initial amount.

These calculations were product-interface examples, not production financial tools or investment advice.

### Loan calculator example

The prototype included an illustrative monthly-payment calculation using principal, a sample monthly interest rate, and a term in months. It was intended to evaluate input and result presentation only; it did not provide lender data, offers, eligibility decisions, or financial advice.

The tax-calculator page was even more restricted: it deliberately displayed a disabled interface and performed no tax calculation.

## Decision-status model

Every registered page used one of three product-decision statuses:

- `existing`: A section or concept already represented in the site direction.
- `candidate`: A possible section that required a later product decision.
- `prototype`: An illustrative deep page, state, or interaction created only for evaluation.

The model separated present scope from possible future scope and prevented a visually complete prototype from being mistaken for committed production functionality.

## Sections deliberately removed from the prototype

The branch recorded the following `removedPrototypeSections` decisions:

- Uluslararası Rehberler / International Guides
- Kanada / Canada
- ABD / USA
- İngiltere / United Kingdom
- Avustralya / Australia
- Yapay Zekâ Rehberleri modülü / AI Guides module
- Satış ve Müzakere Kütüphanesi / Sales and Negotiation Library
- Eğitim Notları / Education Notes
- Projeler / Çalışmalar modülü / Projects / Work module
- Satış ve Müzakere çalışma alanı / Sales and Negotiation focus area

This list is a historical product-scope decision, not an instruction to remove similarly named features from the current production site.

## Prototype safety boundaries

Several feature groups were deliberately kept behind explicit prototype limits:

- Legal content was labeled as a sample summary and not legal advice. Current law and specific cases require a qualified professional.
- The tax interface performed no calculation and directed users to the relevant tax authority or a qualified adviser.
- Market, district, dashboard, and chart values were clearly labeled as invented samples rather than live data or investment advice.
- Maps used a CSS placeholder and no external map API.
- Contact, feedback, and membership forms did not submit or store data. The membership surface provided no authentication or account creation.
- Current-content examples were marked as prototypes rather than real news.

These boundaries avoided false claims, accidental data collection, and reliance on unimplemented legal, financial, identity, mapping, or live-data services.

## Production disposition

Do not merge the Day 20 branch directly into current production. Its route tree, shared page registry, placeholder content, and interactions were created as a self-contained decision environment and may conflict with the current production information architecture, CMS models, routes, and content policies.

If a concept is revived, reassess it against the current main branch and implement it as a new production-scoped change with current requirements, verified data sources, accessibility review, legal and financial review where relevant, and appropriate tests.

This document preserves the branch's product decisions so the branch can remain unmerged while its useful design context is still available for future product planning.
