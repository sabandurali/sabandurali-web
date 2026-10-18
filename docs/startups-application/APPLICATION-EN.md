# Istanbul Research Assistant — application narrative

18 October 2026 · Prepared, not submitted. These are editorial headings, not verified application questions. New applications are currently closed; see [eligibility](ELIGIBILITY-AND-REQUIREMENTS.md).

## Founder and personal brand

I am Şaban Durali, the individual founder developing Istanbul Research Assistant under my personal brand, which spans real estate, consulting, research and technology. This is an early-stage prototype. I have not incorporated a company for this product. The brand is not a registered company name supplied for this application. I make no claims about a company formation date, investment, revenue, active customers, employees or co-founders. Content volume is not evidence of user traction.

Website: https://www.sabandurali.com · Contact: saban@sabandurali.com · Repository: https://github.com/sabandurali/sabandurali-web

## Product and problem

**Istanbul Research Assistant helps people explore Istanbul's 39 districts through Turkish-language questions and two-district comparisons, with original guide excerpts, source links and editorial dates.**

Local research requires readers to piece together material from different institutions and publications while tracking its origin, date and scope. The product aims to make that work easier to inspect in one place. The prevalence of this need and any time savings have not yet been measured with users.

Intended users include people getting to know Istanbul or researching an area before moving, local researchers, and real estate or consulting professionals conducting initial desk research. These are target groups, not existing customers. The assistant does not provide investment recommendations, price forecasts or building safety assessments.

## What works today

- A fixed public corpus covering 39 published district guides and 391 source records. The previously verified Production total is 402; the existing publication filter excludes 11 records, as documented in [readiness](PRODUCT-READINESS.md). Records are not unique web pages.
- Turkish questions about transport, history, everyday life, geography, housing texture, places to visit and research topics, across one or two districts.
- Free keyword-based selection of original excerpts. Comparisons place material on the same topics alongside each other without scoring districts or generating comparative conclusions.
- Guide links, source publishers, source dates and editorial review dates, with an explicit response when a question falls outside the corpus.
- A Turkish research interface, an English product introduction and a protected Preview demo.

The value of the 39-guide collection is consistent coverage across the city rather than a handful of prominent districts. Our intended distinction is a focused local research workflow with visible evidence and scope limits. We have not established superiority over search engines or general assistants through benchmarking, and we do not claim exclusive ownership of public source material.

## Claude's role

A server-side integration is prepared to ask Claude to select relevant evidence IDs from at most six candidate public excerpts. The existing topic matcher first determines the candidate pool; Claude does not browse the web or expand that pool. The application validates the returned IDs, requires representation of both districts in a comparison, and displays only the corresponding original excerpts. It does not display free-form model claims.

Live Claude evaluation has not been completed. The hosted demo does not call Claude. The founder's supplied project status reports USD 0 in actual Claude usage costs; no API request was made during this preparation. Turkish semantic selection quality, latency and actual model costs remain unmeasured.

## Reliability, privacy and cost controls

Sources are linked at section level, not independently verified for every sentence. Dates are editorial metadata, not a promise of real-time freshness or a new verification in this session. Live prices, population figures, investment returns and building safety questions are outside scope. Keyword matching can also miss valid questions.

The demo reads a fixed public snapshot without CMS or database access. The application does not save queries and asks users not to enter personal information. An approved local Claude pilot would send the question and bounded public excerpts to Anthropic under its applicable data-processing terms. We do not claim zero retention across all infrastructure or providers.

Claude is off by default and disabled on Vercel. A local pilot requires explicit, expiring approval and enforces request, concurrency, token and context limits without automatic paid retries. Process-local spending estimates are safeguards, not an account-wide billing cap. No key was created and no purchase was made.

## Development and initial validation plan

First, subject to approval, run a small supervised local pilot using the existing evaluation questions. Review topic relevance, coverage of both districts, valid evidence IDs, abstention, latency and usage. The existing proposal is at most 20 attempts with a USD 0.03 process-local reserve; this is not approved spending. Account model access and current pricing must be checked first.

If the technical pilot is satisfactory, invite 3–5 volunteers from the target groups for controlled research sessions. No participants have been recruited. Each would try a district question, a comparison and an unsupported question. Observe whether they can locate the supporting source, interpret its dates and understand the assistant's limits. Retain only consented, de-identified feedback summaries and avoid collecting private information.

Stop the pilot on invalid evidence IDs or unsupported claims. Limit initial improvements to observed selection and comprehension problems. Further scope will depend on findings rather than a promised launch date or commercial outcome.

We want to join Claude Startups to evaluate this constrained Turkish evidence-selection workflow with real model and user observations, receive technical feedback, and, if eligible, use program support to cover evaluation costs. We do not claim acceptance, credits or an Anthropic partnership. Eligibility without incorporation and the next cohort's requirements must be confirmed before any submission.
