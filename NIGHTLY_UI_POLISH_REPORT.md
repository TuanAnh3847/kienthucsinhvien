# OVERNIGHT UI POLISH COMPLETE

Date: 2026-09-21

- Baseline: `2f1668eedb37bf5f920c8f77341cdffea07878cb`; clean main matched origin/main.
- Branch: `codex/nightly-ui-polish-v1`.
- Final implementation commit: `a2299bcfc880649da247fe1d123c467b7de806da`.
- Final commit: the documentation-only commit containing this report, immediately after the implementation commit above; resolve with `git rev-parse HEAD`.
- Push destination: `origin/codex/nightly-ui-polish-v1`.
- Main remains at the baseline. No merge, force push, deployment or shutdown performed.

## Content cleanup

Reviewed all 12 theory pages and their generated activity feedback. Removed source/slide/lecturer/build narration and awkward mixed-language labels; retained academic terminology, legitimate sources of law and resources, caveats, and unresolved facts. Improved compact study guides without introducing outside academic knowledge. Removed PTBV's administrative CO1/CO2/CLO1–3 block and surrounding whitespace, while retaining its useful chapter-topic map. Removed TCCN's internal implementation/deferred-feature list.

The homepage welcome now addresses learners directly. All subject-card text remains exactly unchanged, including the preexisting TCCN class wording, as required by the card-content constraint.

## Header, typography and density

- Shared near-black brand row and one horizontally scrollable chapter strip on desktop/mobile. Active tabs have a filled state, keyboard focus and automatic horizontal visibility.
- Brand row scrolls out naturally and becomes inert; chapter navigation remains sticky. Returning near the top restores the brand row without shifting document geometry.
- Removed duplicate page scroll handlers that overrode the shared chapter API. Existing account/profile/presence hooks and practice navigation remain supported.
- Hero wording preserved; responsive title size now 30–44 px. Reduced guide, introduction and chapter whitespace while retaining each subject's visual identity.
- Homepage cards at 1440 px: 279 px before, 230 px after, a 17.6% height reduction, with the same content and main font size.

## Interaction controls

Enhanced 81 short-choice selects into native radio chips: NLTTTC 16, PTBV 59, VHDDTKD 6. The original selects remain authoritative for existing grading. Keyboard selection, checked state, change events and reset behavior are synchronized. Longer option lists remain styled native selects.

Eleven suitable activities use two columns on desktop (NLTTTC 4, PTBV 7) and one column on mobile. PTBV's Challenge/Opportunity activity was checked through correct answers, grading and reset.

## Visual QA

Inspected homepage and KTTC, KTQT, KTCTMLN, LTMQT, NLKT, NLTTTC, NMLH, PTBV, STKN, TCCN, TLUD and VHDDTKD. Captured top and sticky states at 1440 and 375 px, plus 82 chapter/review states at both widths and 65 representative component captures. Reviewed tables, timelines, diagrams, formulas, flashcards, tools, disclosures and callouts where available.

Fixed TCCN mobile grid overflow, LTMQT flashcard face sizing, and clipped long flashcard answers in KTTC/TCCN. Final component overflow scan found no uncontained mobile content or clipped flashcard backs. Intended horizontally scrollable tables and diagrams remain scrollable.

Local evidence: `tests/screenshots/nightly/` (ignored from Git), including refreshed `sheet-1440-top-*.png`, `sheet-375-top-*.png`, sticky sheets, subject component sheets and PTBV sorter captures. Baseline homepage: `tests/screenshots/nightly-home-before.png`.

## Validation

| Check | Result |
| --- | --- |
| HTML5 parser | PASS — 0 errors |
| Regression suite, rerun after final copy edits | PASS — 21/21 |
| Browser audit | PASS — 18/18 pages |
| Final homepage/theory visual-interaction suite | PASS — 13/13 routes |
| Theory routes | PASS — 12/12 |
| Shared JS syntax and inline theory scripts | PASS |
| Duplicate IDs, runtime errors, failed assets, broken links in browser audit | 0 |
| Responsive sticky/restore behavior, tab visibility and choice controls | PASS |
| Mobile component overflow and flashcard clipping scan | PASS — no findings |
| Academic structure/data preservation check | PASS — 12/12 pages, homepage cards and route rewrites |
| Git whitespace check | PASS |

**Legacy verbatim-content guard: expected FAIL.** The unchanged `tests/content_check.py` compares all prose exactly with main and therefore detects the editorial changes this task requested. It was not weakened or presented as passing. The separate preservation check verifies chapter order, hero text, input constraints/defaults, option values, data attributes, numeric table values, formula expressions, card text and route rewrites; this is not a proof of semantic equivalence for every sentence.

## Academic preservation and remaining concerns

- Facts changed: none intended; editorial framing reviewed in context.
- Formulas changed: none.
- Article numbers changed: none.
- Datasets changed: none.
- Answer semantics changed: none; existing grading logic remains in place.
- Existing incomplete chapters, undefined thresholds and unavailable data remain explicit; no replacement facts invented.
- Useful English academic terms/cases remain; this was not a full translation.
- One final scanner candidate describes the calculator's annual/monthly rate limitation and is intentionally retained as learner guidance.
- Authentication behavior was regression-tested with fixtures; no live Google OAuth session or authenticated production writes were performed.
- Screenshots are local review evidence, not committed artifacts. The report is excluded from Firebase hosting; route configuration is unchanged.

Production deployed: **NO**.

Overall: **READY FOR OWNER VISUAL REVIEW**.
