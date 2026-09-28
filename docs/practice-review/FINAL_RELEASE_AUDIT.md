# CODEX FINAL HARD AUDIT — COMPLETE

Date: 2026-09-28. Verdict: **NOT READY**.

## Git and scope

- Source Gravity HEAD: `1a7ce97d907b8b1c4cf9173208e69573e23a0d4c`, local and freshly fetched origin agree.
- Audit branch: `codex/final-release-audit-v1`, created directly from that SHA.
- Main/origin main: `2f1668eedb37bf5f920c8f77341cdffea07878cb`; unchanged.
- Both main and approved Codex platform checkpoint `727264b` are ancestors of the candidate.
- Main-to-candidate diff: 61 files. A runtime/tooling 3; B header/home/style 3; C theory 12; D practice 6; E Hosting 1; F tests 25; G private review/docs 11.
- No unexpected architecture changes. Gravity did not change auth/admin/database rules relative to the approved Codex platform checkpoint. Four added practice subjects introduce no database write path.
- Audit changes: one WTO question explanation (both published views), private source citations/status, and meaningful test corrections. No route, Hosting, auth, theory-page, or visual redesign.

## HEAD DECISION REQUIRED — release blockers

1. **Hosting Emulator private boundary fails.** Firebase CLI 15.31.0, project `demo-edu-audit`, hosting only: all seven required private paths return HTTP 200 with their actual contents. `hosting.public` is `.`. The emulator's filesystem provider does not apply the deploy ignore list. The actual CLI upload-file enumerator applies it: 38 eligible files, zero private/test artifacts. This is not evidence of an existing production leak. Repeating the existing ignore patterns cannot fix this emulator contract. An owner-approved serving/staging boundary or an explicit revised acceptance criterion is required; no route/Hosting architecture change was made during this audit.
2. **TLUD academic provenance remains incomplete.** The official local syllabus authorizes the books and six modules, but does not substantiate every new textbook topic/page. Schacter page ranges and the Gillibrand Ch.4-8 blanket mapping were unverified/incorrect and downgraded. Motivation, Piaget/Erikson/attachment details, six defense mechanisms, Rogers and Big Five still require topic-level source evidence. No Schacter/Gillibrand textbook file was located in the supplied `TÀI LIỆU UEL` folder. Passing keyword/fixture tests do not prove these claims. The newly located TCCN lecturer PDFs and EFF2044 syllabus resolve their earlier source-location gaps.

## Firebase Hosting / routes

The following each returned **200**, not the required non-public response:

- `/docs/practice-review/ACADEMIC_COMPLETION_PACK_KTQT_TLUD_TCCN_NLTTTC.md`
- `/docs/practice-review/ACADEMIC_COMPLETION_TRACE.json`
- `/docs/practice-review/academic-source-fixtures.json`
- `/docs/practice-review/pass03-questions-review.json`
- `/tests/academic_negative_guards.py`
- `/tests/practice-behavior.cjs`
- `/NIGHTLY_UI_POLISH_REPORT.md`

All 12 required theory short routes, exactly six practice routes, and all 12 original theory HTML paths resolve through the real emulator. Homepage has 12 distinct intended short-route links. Practice CTA exists only on NLKT, TCCN, KTQT, NMLH, NLTTTC and LTMQT; all destinations resolve. No seventh practice page.

## Academic results

- **KTQT — PASS for requested additions.** Independently read lecturer `Chapter 6_ST.pdf` pp.11-17,19-25 and `Chapter 5_ST.pdf` pp.4-9,13-26. Recomputed initial capital 70/60, equilibrium 65/65 at 3%, flow 5 billion, gains 25/25/50 million. Labor equilibrium 12 USD/hour, migration 2,000 and gains 2,000 USD/hour per country. Confirmed FDI/FPI, 5 purposes/4 forms/6 pros/6 cons, VMPK/VMPL, integration stages, welfare b+d and (b+d)-e, and 16/12/10 three-country example.
- **TLUD — curriculum PASS; provenance NOT VERIFIED.** Local BDG1006 syllabus confirms six core modules and authorized reading list. No optional/outside-exam claim or reintroduced Yerkes-Dodson/Deci-Ryan found. Local `Psychoanalysis.docx` only supports the brief Id/Ego/Superego outline; it is not evidence for every added personality claim.
- **TCCN — requested checks PASS.** In `TÀI LIỆU UEL/UEL TCCN`, `Chapter 6 Eng.pdf` page 21 visually confirms weights 35/30/15/10/10; no public FICO/CIC conflation. `Chapter 4_Personal Financial Statement & Budgeting.pdf` pages 18-19 contain image formulas confirming current/liquidity, Debt and Solvency ratios, with months-of-expenses coverage separate. The student workbook corroborates Debt/Solvency. Legal loan bands are explicitly legal attribution, <=1, >1 to 5, >5 years; Article 10 confirmed in the [official 2026 consolidated regulation](https://datafiles.chinhphu.vn/cpp/files/vbpq/2026/01/06-vbhn-nhnn.pdf). No unsupported Debt Ratio <50%.
- **NLTTTC — requested formulas/quiz and syllabus PASS.** FV exponent n*t, EAR exponent n, annuity-due multiplier (1+r), direct-quotation key/explanation, risk/term structure and FX policy agree with the requested concepts. Original EFF2044 DOCX in `TÀI LIỆU UEL/UEL NGUYÊN LÍ THỊ TRƯỜNG TÀI CHÍNH` independently confirms the reading list and retained scope, including Sustainable Finance and DeFi. Lecturer `Chapter 5 - Interest rate.pptx` slides 13-15 confirm simple/compound interest notation. Exact textbook formula-page evidence remains distinct from verified syllabus/TOC evidence.
- **Private provenance corrected:** Mishkin bank management Ch.9; Madura derivatives Ch.13-16 and banking/risk management Ch.17-19. Mishkin Ch.4/6/12/17/18 mappings confirmed. No invented Mishkin companion chapter. Sources: [Pearson 13e TOC](https://www.pearson.com/en-au/media/fwvdzehg/9781292409481-toc.pdf), [Cengage Madura 13e TOC](https://www.cengage.uk/c/new-edition/9780357130797/?filterBy=Higher-Education), [Pearson Gillibrand 2016 catalogue](https://za.pearson.com/content/dam/region-growth/south-africa/pearson-south-africa/TVET/localTitles/documents/Pearson_HE_Catalogue_Education_Psych_2021_Electronic.pdf).
- **Fixtures:** Added explicit independent source locations and verification status. KTQT and requested TCCN values independently corroborated; NLTTTC syllabus/lecturer material and publisher mappings verified; TLUD supplemented-topic traces remain unverified. No expected academic values were copied from HTML to manufacture a PASS. Source PDFs/books remain outside the Git payload.

## Practice / test integrity

- Six routes; 104 distinct traced questions (24+40+40), all published answer rotations match their traces. Independently sampled first/last traced item in each subject (12 items): keys/options supported; corrected one explanation.
- `ltmqt_20` wrongly described consultations as always lasting at least 60 days. Corrected the explanation in both views and its private trace using [WTO DSU Article 4.7](https://www.wto.org/english/res_e/publications_e/ai17_e/dsu_art4_jur.pdf). Question, options and answer unchanged.
- Practice behavior: 23 scenarios PASS; full/zero/blank scores, answer changes, duplicate submission, post-grade lock, displayed explanations, retry/reset, TCCN elapsed-time expiry and storage corruption/failure. Five other practice routes have no active countdown or persistent local attempt bank (duration is a suggestion); blocked storage does not break their local grading. Accounting's existing attempt-write path is fixture-isolated in tests.
- Four held TCCN IDs remain absent. ABC remains the approved opening-position exercise; no invented transactions.
- Fixed whole-page academic bypass by protecting frozen chapters and inline runtime against the approved checkpoint with three exact reviewed formula/copy exceptions. Added exact numerical/exponent/FDI-count guards and real mutation checks. Completion chapters still require independent academic review; tests do not prove all their prose.
- Required both 40-question trace files instead of silently skipping missing files. Made component-overflow failures return a failing exit code. Added missing blank/zero/duplicate-submit/locking/storage checks to all five accounting-style practice routes. Corrected overbroad PASS descriptions.

## Publication / UI / runtime / security

- Dynamic theory suite: 82 chapter/review states, 302 repeated actions, no runtime errors or forbidden patterns under its existing scan.
- Supplemental rendered scan found residual copy: NLTTTC Ch.5 `principal not exposed` and TCCN Ch.1 a table-data-unavailable note. The lecturer's bond exercise (slide 15) indeed omits numeric principal. These remain openly reported, not silently erased to conceal incomplete inputs. TLUD's `p.15 states ...` is source attribution with awkward bilingual copy; not classified as private-data leakage. No new under-construction banner or private trace metadata found in learner DOM.
- UI smoke at 1440x900,1366x768,390x844,375x812 PASS: near-black brand, clear active horizontal chapter strip, sticky navigation and uncovered headings in existing journey tests, compact heroes, no whole-page overflow. Twelve homepage cards, desktop heights approximately 167-189px. Representative desktop/mobile screenshots visually inspected.
- Final full real-CDN audit: 22 pages; console errors 0, page errors 0, failed requests 0, broken internal links 0, duplicate IDs 0, whole-page overflow 0. Initial full run failed on one Firestore Listen stream request at NLKT practice; one complete rerun passed without changing tests or suppressing the failure. Initial JSON retained.
- Lightweight credential scan: zero private-key/service-account/token matches; Firebase client config is public client config. No new production-write or broadened auth/rule change found in Gravity's diff. No penetration-test claim.

## Complete validation

All requested commands exist. Python was invoked through the bundled runtime because `python` is not on PATH. Browser suites used installed Edge and bundled Playwright; CDN access was enabled, authenticated behavior used the existing Firebase fixture.

| Command | Final result |
|---|---|
| `python tests/html_check.py` | PASS, 0 errors |
| `python tests/content_check.py --self-test` | PASS |
| `python tests/academic_content_check.py --self-test` | PASS |
| `python tests/preservation_check.py main` | PASS |
| `python tests/practice_trace_check.py` | PASS, 104 traces |
| `python tests/academic_negative_guards.py` | PASS, including exact-value mutations |
| `node tests/audit.cjs` | PASS on full rerun, 22 pages; initial transient recorded |
| `node tests/regression.cjs` | PASS, 22 scenarios |
| `node tests/theory-interactions.cjs` | PASS, 82 states/302 actions |
| `node tests/practice-behavior.cjs` | PASS, 23 scenarios |
| `node tests/student-acceptance.cjs` | PASS, 4 viewport journeys |
| `node tests/component-overflow.cjs` | PASS, 0 findings |

Local detailed evidence remains in ignored `tests/*-results.json`, `tests/*-final.log`, `tests/final-smoke.log`, and `tests/screenshots/source-audit/`. Hosting/privacy is a separate failed release gate, not hidden by the passing suite.

## Production

Main modified: **NO**. Firebase deployed: **NO**. Production data changed: **NO**.

**FINAL VERDICT: NOT READY — unresolved Hosting Emulator private-file boundary and academic source provenance.**
