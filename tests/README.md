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
python tests/content_check.py main
node --check auth.js
node --check admin.js
node --check edu-header.js
node tests/audit.cjs
node tests/regression.cjs
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
1440 and 375 pixels, captures every chapter and top/sticky states, exercises
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

The original `content_check.py main` remains intentionally strict and unchanged.
It reports changed chapter prose for this editorial batch, whose purpose is to
rewrite source/process narration. Do not interpret its expected difference as
a behavior pass, or weaken it to hide unexpected content changes.

`editorial-polish.cjs`, `editorial-followup.cjs` and `guide-polish.cjs` record the
one-time editorial substitutions for review. They mutate source files and are
not part of the test suite. `scan-script-copy.cjs` is a read-only aid for reviewing
potential source narration in script-generated copy; legitimate academic uses
and non-rendered metadata require contextual review.
