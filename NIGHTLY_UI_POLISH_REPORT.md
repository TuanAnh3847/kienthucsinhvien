# OVERNIGHT ROUND 2 — STUDENT EXPERIENCE QA

Date: 2026-09-22 (Asia/Saigon). Repository: `D:\kienthucsinhvien-main`.

- Review branch: `codex/nightly-ui-polish-v1`.
- Approved starting commit: `2f03f26ef2d52861f08b1a97535ff375879fb7ae`.
- Implementation checkpoint: `3034c3d2479c5475e8ad0932297df0f66b07cd3f`.
- Push destination: `origin/codex/nightly-ui-polish-v1`.
- Final report commit: the documentation commit after that checkpoint; identify with `git rev-parse HEAD`.
- Main baseline remains `2f1668eedb37bf5f920c8f77341cdffea07878cb`.
- No merge, deployment, force push, production data changes or machine shutdown.

## 1. Executive summary

Repaired practice submission, scoring state, retry, timer, storage and navigation after using the rendered student journey. Both practice engines prevent duplicate submissions and answer changes after grading. Finance practice survives malformed/unavailable browser storage and avoids repeated questions within an attempt.

Added one source-backed 12-question set to each existing practice subject. Four ambiguous/unsupported finance items were removed from the public bank and archived intact. The incomplete ABC accounting exercise now asks only the opening-balance work supported by its data. No replacement academic facts were invented.

Owner visual approval is still required. The previous round's report remains available in Git at the approved starting commit.

## 2. Student simulation

Started with the rendered website before source investigation. Tested **1440×900, 1366×768, 390×844 and 375×812**. Covered homepage discovery, subject entry, introductions, chapter switching after deep scrolling, sticky navigation, tables/cards/tools and return navigation across all 12 theory routes and 82 chapter/review states.

Theory route inventory: `/KTTC`, `/KTQT`, `/KTCTMLN`, `/LTMQT`, `/NLKT`, `/NLTTTC`, `/NMLH`, `/PTBV`, `/STKN`, `/TCCN`, `/TLUD`, `/VHDDTKD`. Practice routes: `/NguyenLyKeToan-LuyenDe` and `/TCCN-LuyenDe`.

For NLKT and TCCN, final acceptance starts at home, opens theory, switches chapters, uses an activity, follows the practice link, selects a wrong answer, changes it before submission, completes the attempt, reads results/explanations, retries and returns to theory/home. Four viewport scenarios cover eight complete subject journeys. Separate tests click every accounting MCQ set and every finance chapter bank through to full score.

Browser: Microsoft Edge/Playwright. Phone contexts emulate touch and viewport dimensions; these are not physical iOS/Android tests. Authenticated journeys use isolated Firebase fixtures. Signed-out audits load real CDN libraries/SDK. No live account sign-in or authenticated production write was performed.

## 3. Problems discovered

| Problem | Student impact | Fix/evidence |
| --- | --- | --- |
| Repeat submit saved duplicate attempts in both engines | One attempt counted twice | Submission locks; exactly one saved attempt asserted |
| Answers could change after grading | Selection and score could diverge | Frozen graded state; disabled buttons and direct-handler repeat tests |
| Unanswered finance questions appeared simply wrong | Omission was indistinguishable from a wrong choice | Explicit “Chưa trả lời” feedback |
| Timer relied on callback ticks | Background throttling could extend an exam | Wall-clock deadline, visibility reconciliation, one auto-submit |
| Malformed/blocked storage threw exceptions | Practice could stop working | Validated lists, in-memory fallback, persistence status |
| Repeated finance stems appeared in one attempt | Less useful practice and misleading counts | Deduplicate before selection; derive displayed counts |
| Accounting Back returned to overview | Lost category context | Restore the entry category |
| Generated NLKT handlers had broken quote boundaries | Visible buttons did nothing | Escaped handler data; actual click/keyboard regression |
| Class/source/build narration remained visible | Public pages felt like internal handouts | Contextual copy cleanup with exact recorded substitutions |
| Excess homepage/practice hero spacing | Choices/questions started unnecessarily low | Smaller gaps, compact titles/cards, separate centered CTA |
| Four finance items and part of ABC lacked adequate context | Learner could be graded on an unsupported answer | Archive/hold finance items; narrow ABC to supported requirements |

## 4. Content/public wording cleanup

Removed remaining TCCN prose about what a source “keeps/preserves/contains,” class-specific homepage/practice wording, public CLO/source-exam labels, developer/cloud narration and stale bank counts. Removed a redundant NLKT source line and one source-framed LTMQT sentence. Feedback addresses the learner directly.

Retained useful English academic terms, case names and honest limitations where supplied material is incomplete. Internal provenance remains in data/private review files. Exact theory substitutions are recorded in `docs/practice-review/theory-editorial-edits.json`.

An encoding check initially flagged valid uppercase Vietnamese “ĐÃ.” The detector now checks broken UTF-8 sequences rather than treating every “Ã” as corruption. The one remaining broad-scan candidate warns that the FV calculator expects a rate per compounding period and does not convert annual to monthly/quarterly rates. This is necessary learner guidance, not publication leakage, and was retained.

## 5. Header/navigation

Retained the shared near-black brand row and single horizontally scrollable chapter strip. The brand row scrolls away, chapter navigation stays sticky, the active chapter stays visible, and the brand row restores near the top. Acceptance verifies a chapter title is not hidden behind the sticky strip after switching from a deeply scrolled position.

Added practice entry from NLKT/TCCN theory and persistent return-to-theory links on both practice pages. The theory CTA has its own centered row. Accounting returns to the selected category. All 12 Firebase short-route mappings remain unchanged.

## 6. Typography/layout

Preserved subject identities, academic headings and responsive grids. Practice titles use a compact 30–42 px range; question cards have tighter spacing, visible keyboard focus and usable tap targets. Mobile action areas wrap within the viewport. Wide academic tables/diagrams retain intentional horizontal scrolling.

Reduced homepage top/intro/announcement gaps and the decorative announcement icon on phones; removed its bounce. Desktop homepage cards remain 230 px high. Card descriptions are preserved except the documented class-neutral TCCN phrase. No new redesign cycle followed final acceptance.

## 7. Bugs found and fixed

- NLKT principle and physical-classification buttons: escape JSON in generated HTML handlers. Enter/Space now places the selected document card.
- Both practice engines: repeated-submit guards, stable graded answers, unanswered status, clean retry state and retained selection focus.
- Accounting: retry scrolls back to the beginning of the practice panel; correct return category; reject incoming sets with duplicate question IDs/empty options; stale asynchronous save feedback only updates a connected result element.
- Finance: elapsed-time clock, study timer cleanup, robust storage, unique session questions, accurate counts, canonical mistake IDs and numbered chapter order.
- Shared auth helper: storage failure no longer throws before practice can initialize. Firebase auth stays authoritative; idle/logout/listener regressions pass.

## 8. Practice system audit

**NLKT:** nine sets, with 65 MCQs plus written/self-assessment exercises. Every MCQ set was clicked to full score with one saved attempt. Wrong/change/submit, unanswered, post-submit locks including zero score, retry, category return, failed cloud writes and explanations are covered. Written work remains self-assessment, not automatic free-text grading.

ABC formerly asked for ending statements without January transaction amounts. The full original is in `abc-incomplete-original.json`; the public exercise retains four supported opening-position requirements and existing results. Mekong/Lotus rollforwards were checked against their supplied datasets. No transactions were invented.

**TCCN:** 158 published records, **94 unique stems**. The three original exam cards now contain 44, 45 and 45 eligible unique questions; the added card has 12; the mixed exam draws 50 and quick practice draws 20. Seven chapter/mixed groups remain. Equivalent stems can exist across source exams but never twice in one generated attempt.

Study mode locks the first response and shows immediate explanation. Exam mode permits changes until submit. Both finalize consistently. Progress, all-correct/one-answer scoring, unanswered states, saved mistakes, clock expiry, retry and malformed/blocked storage were checked. Twenty random/weak-bank draws checked uniqueness. Every finance answer-text/key mapping is checked; this is not external academic certification.

Held original items and reasons:

- `e1_q20`: unqualified disposable-income definition despite competing definitions in the lesson.
- `e1_q31`: early mortgage repayment without fee/penalty assumptions.
- `e3_q36`: spending ratio without the referenced household data.
- `e3_q43`: survey claim unsupported by supplied material.

Their answers were not guessed or rewritten.

## 9. Practice content added

| Subject/set | Count | Chapters | Source and confidence |
| --- | --- | --- | --- |
| NLKT — Applied Review: Principles, Measurement & Production | 12 | 1–6 | Local NLKT theory: principles/notes, temporary accounts, carrying amount, inventory, documents/flow, reconciliation, production accounts and finished-goods cost |
| TCCN — Vận dụng: hành vi, ngân sách & bảo hiểm | 12 | 1–5 | Local TCCN theory: biases, SMART/time planning, rewards, bancassurance, diversification, revolving fund/budget and the existing Selena insurance example |

`docs/practice-review/new-question-review.json` records every ID, chapter, heading, exact theory quotation, four options and explanation. A second pass rejected redundant drafts. Final questions have one intended answer; publication rotates options and a separate guard verifies the correct answer text after rotation. All 24 exact quotations remain present in the relevant current chapter. No web facts were used.

## 10. New practice pilots

**None.** Repairing and validating the two existing engines exposed actual scoring/storage/timer bugs and ambiguous content. Adding another subject/engine without equally strong source review and end-to-end coverage would reduce confidence. The optional pilot budget was left unused; all 24 additions extend the two tested systems.

## 11. Student acceptance verdict

Home → theory → practice → explanation → retry → theory works at all four sizes. Navigation stays accessible after deep scrolling, questions/results are readable and graded selections stay stable. Rendered screenshots were inspected as well as automated assertions.

Remaining learner limitations: some theory examples lack supplied details; English course terminology/questions coexist with Vietnamese guidance; dense mobile tables require horizontal scrolling; written accounting exercises require comparison with a worked solution. Visual density and language balance still need owner judgment.

## 12. Validation

| Check | Result |
| --- | --- |
| HTML5 parser | PASS — 0 errors |
| Full regression | PASS — 22/22 |
| Signed-out browser audit | PASS — 18/18 pages |
| Four-viewport homepage/theory suite | PASS — 13/13 routes; 82 chapter states at each size, 65 representative component captures |
| Student acceptance | PASS — 4/4 viewport scenarios, both subjects each; retry position checked after scrolling settles |
| Deep practice behavior | PASS — 10/10 scenarios, both practice routes |
| Repeated theory interactions | PASS — 12/12 routes, 82 states, 270 repeated actions |
| Mobile component/flashcard overflow | PASS — no findings |
| Academic guard at approved checkpoint | PASS — 12 theory pages, 82 sections, both original practice banks; exact documented exceptions only |
| Guard mutation self-test | PASS — formula, case name, number, chapter ID and answer-key mutations detected |
| Independent preservation guard against main | PASS — chapters, titles, numeric tables, formulas, fields, data attributes, cards and short routes |
| New-question trace/mapping | PASS — 24/24 |
| Shared JS syntax | PASS — auth, admin, header and study helper |
| Browser duplicate IDs, runtime/console errors, failed assets, missing/invalid handlers, broken internal links | 0 |
| Git whitespace | PASS |

Commands/limitations are in `tests/README.md`. The original verbatim prose test remains as `tests/verbatim_content_check.py`; it still flags authorized editorial edits against pre-polish main and is **not** represented as passing. The active guard protects complete chapter text, headings and inline theory scripts at the approved checkpoint with exact reviewed substitutions. The independent structure/data guard still compares against main.

No behavior assertion was removed to obtain a pass. The old finance assumption of exactly 50 questions now uses the exact eligible deduplicated bank count with a minimum-coverage assertion; scoring, reset, error and state checks remain. Generated-handler compilation and actual NLKT clicks caught defects missing from the previous suite. Diagnostic filtered runs were followed by full runs.

## 13. Academic preservation

- Academic facts intentionally changed: **NO** — theory facts and existing answer keys were not rewritten.
- Formulas changed: **NO**.
- Existing numerical values/datasets changed: **NO**. Public practice inventory/scope **did** change: four held items, duplicate suppression within attempts, narrowed ABC and 24 new questions. The bank is not claimed to be byte-identical.
- Article numbers changed: **NO**.
- Case names changed: **NO**.
- External academic knowledge added: **NO**.

The four finance originals and full former ABC exercise are archived intact in `docs/practice-review/`. No missing academic facts were replaced with outside knowledge. Review files, tests and this report are excluded from Firebase hosting.

## 14. Screenshots/artifacts

Local artifacts (screenshots/JSON outputs are ignored by Git and remain on this machine):

- `D:\kienthucsinhvien-main\tests\screenshots\round2\final-home-{1440,1366,390,375}.png`
- `D:\kienthucsinhvien-main\tests\screenshots\round2\final-{NLKT,TCCN}-{width}-{top,sticky,result,explanation,practice}.png`
- `D:\kienthucsinhvien-main\tests\screenshots\nightly\`: 13 routes, four widths, 82 chapter states per width, representative components and contact sheets.
- `D:\kienthucsinhvien-main\tests\{audit,regression,nightly,practice-behavior,student-acceptance,theory-interactions,component-overflow}-results.json`
- `D:\kienthucsinhvien-main\docs\practice-review\`: tracked source evidence, exact editorial/code substitutions, archived content.

Final acceptance captures wait for transitions; baseline/probe captures are investigation evidence. Contact sheets contain the whole screenshot instead of cropping it.

## 15. Remaining concerns

1. No live Google OAuth exchange, authenticated production database rule test or production deployment was performed. Fixture success does not prove live permissions/service availability.
2. Accounting's existing cloud-set precedence is unchanged: a nonempty valid remote collection may replace bundled local sets. Before release, verify the live collection if the new bundled set must be visible there. This task did not write to production.
3. Some theory examples still lack needed information. Held finance questions/ABC ending statements should remain unavailable until adequate supplied material supports them.
4. Mobile evidence is emulation, not physical Safari/Android certification. Existing CDN dependencies remain.

## 16. Owner decisions needed tomorrow

- Approve desktop/mobile density, practice CTA placement and retained subject styling.
- Decide whether to retain the English-question/Vietnamese-guidance balance for future content.
- Review narrowed ABC and the held-item inventory as product scope. Restoring unsupported portions requires source context.
- Decide when to release after review through the normal process. Merge/deployment are not part of this handoff.

Owner review required: **YES**. Production deployed: **NO**.

Overall: **READY FOR MORNING OWNER REVIEW**.
