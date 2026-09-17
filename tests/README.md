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
