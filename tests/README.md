# Baseline audit checks

The production site remains static HTML/JavaScript with Firebase and CDN assets.
These optional development checks do not introduce a package/build system.
`tests/**` and `docs/**` are excluded from Firebase Hosting.

Requirements: Node.js with Playwright available through `NODE_PATH`, an installed
Edge browser (or set `BROWSER_CHANNEL=chrome`), and Python with html5lib. A local
test-only installation of html5lib can be placed in `tests/.python`.

Start the preview in a separate terminal:

```powershell
node tests/serve.cjs
```

Run checks with the configured Python and Node executables:

```powershell
python tests/html_check.py
python tests/content_check.py --self-test
python tests/preservation_check.py main
python tests/practice_trace_check.py
node --check auth.js
node --check admin.js
node --check edu-header.js
node tests/audit.cjs
node tests/regression.cjs
node tests/practice-behavior.cjs
node tests/student-acceptance.cjs
git diff --check
```

`audit.cjs` loads the real CDN libraries and Firebase SDK as a signed-out visitor,
checks public routes, IDs, inline script syntax/handlers, and each chapter at
375, 768, 1280 and 1440 pixels. The admin route is expected to redirect a guest.

`regression.cjs` loads real visual libraries but intercepts Firebase SDK requests
with `firebase-fixture.js`. It tests authenticated UI, modal keyboard behavior,
failure paths, database listener cleanup, quizzes, calculators and admin UI
without signing into or writing to production. It also enforces the shared
header source contract and exercises every migrated theory page at 375, 768,
1280 and 1440 pixels. It is not proof of a completed Google OAuth exchange or
authenticated production database permissions.

The browser checks need CDN network access. Optional `TEST_FILTER` selects a
regression scenario by name. JSON results and screenshots are generated under
`tests/`, ignored by Git, and never hosted. A filtered regression run replaces
the previous regression JSON; finish with the full suite for a complete report.

## Nightly presentation review

`node tests/nightly-qa.cjs` checks all 12 theory routes plus the homepage at
1440×900, 1366×768, 390×844 and 375×812, captures every chapter and top/sticky states, exercises
native radio keyboard selection, PTBV grading/reset, and representative
component disclosures/flashcards. It uses the same isolated Firebase fixture
as regression.cjs. Evidence is saved in `tests/screenshots/nightly/` and
`tests/nightly-results.json`. `NIGHTLY_FILTER=/PTBV,/TCCN` selects routes; finish
with an unfiltered run. `node tests/nightly-contact-sheets.cjs` makes local
review sheets using the optional `sharp` package.

`python tests/preservation_check.py main` compares chapter order, hero titles,
numeric table cells, formula expressions, input constraints, option values,
answer/dataset attributes, homepage card text and Firebase short routes with
the baseline. It complements behavior tests; it does not prove every prose
statement semantically identical.

`content_check.py` now calls the academic guard against the user-specified
approved checkpoint `2f03f26ef2d52861f08b1a97535ff375879fb7ae`. It compares ALL
theory chapter text, headings and inline scripts, allowing only exact reviewed
substitutions recorded in `docs/practice-review/theory-*-*.json`. It also protects
both existing practice banks: only four explicitly archived finance items and
the documented narrowing of incomplete ABC content differ. Added questions are
checked against their private review records and local theory by
`practice_trace_check.py`, including rotated option keys. `--self-test` proves
the guard detects formula, case-name, numeric, chapter and answer-key mutations.

The original verbatim test is preserved as `verbatim_content_check.py main`.
It still flags authorized editorial changes against pre-polish main. This
diagnostic is not the active academic guard and is not represented as passing.
The independent `preservation_check.py main` still protects original structure,
formulas, numeric table data, fields and routes. Its one additional reviewed
homepage exception removes the class-specific TCCN card phrase; no broad ignore
rules or skipped theory routes were added.

`editorial-polish.cjs`, `editorial-followup.cjs`, `guide-polish.cjs` and
`final-copy-polish.cjs` record the
one-time editorial substitutions for review. They mutate source files and are
not part of the test suite. `scan-script-copy.cjs` is a read-only aid for reviewing
potential source narration in script-generated copy; legitimate academic uses
and non-rendered metadata require contextual review.

`node tests/component-overflow.cjs` checks every chapter at 375 pixels for
content extending beyond the viewport without a scrollable ancestor, and
flashcard answers exceeding their faces. Intentional horizontal tables,
diagrams and hidden reverse faces are distinguished from clipped content.

## Round 2 student and practice QA

`practice-behavior.cjs` covers every MCQ bank, wrong/change/correct selection,
repeat submissions, post-submit locks, unanswered states, retry, wall-clock
expiry, malformed/blocked storage, unique randomized sets, duplicate question
IDs, route links and four viewport sizes. Firebase uses isolated fixtures.

`student-acceptance.cjs` starts at the homepage for both existing practice
subjects at all four sizes; mobile contexts enable touch/device emulation. It
switches chapters after deep scrolling, uses theory interactions, follows the
practice link, changes answers, submits, reviews, retries and returns to theory.
It captures final screenshots under `tests/screenshots/round2/`.

`round2-discovery.cjs` and `round2-probe.cjs` are baseline investigation scripts,
not final regression tests. The latter intentionally reproduced bugs before
repair and is no longer compatible with disabled submit controls.
`round2-copy.cjs`, `round2-content-review.cjs` and `add-reviewed-practice.cjs` are
one-time authoring records that mutate files; do not rerun as validation.

The practice regression's old 50-question assumption now uses the exact eligible,
deduplicated first bank with a minimum coverage assertion. No scoring, state,
error, route or reset assertions were removed. Browser audit additionally
compiles all generated inline handlers, catching malformed quote boundaries.
`theory-interactions.cjs` visits all 82 chapter/review states at 375 px, compiles generated handlers, repeats visible check/reset/calculator buttons, and checks runtime errors, overflow, broken encoding and presentation leakage. THEORY_FILTER is diagnostic only; use the full run for final results.
