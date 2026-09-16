# Edu Connect baseline audit — complete

Task status: PASS.

Branch: `codex/baseline-audit-v1`
Starting commit: `a687e8cbb113f3c2312f7c5b72ac41d038828326`
No deployment or merge has been performed.

## Implemented changes

- Repaired the malformed homepage login attribute and HTML entity/tag parse errors.
- Enabled the existing accounting practice card, removed the nonexistent law
  practice destination, and corrected both finance practice links.
- Added a shared header stylesheet. All ten subject/practice pages use a chapter
  selector below 1280px and a full chapter row below the brand/profile above it.
  Long profile names truncate; login controls and logos fit mobile widths.
- Centralized welcome-modal Escape handling and keyboard focus containment.
  Profile logout controls work with Enter/Space and avatars have a local fallback.
- Preserved Firebase compat architecture. Auth restores the same guest/member UI,
  removes obsolete presence listeners, catches presence failures, initializes the
  idle timestamp, checks stale restored sessions, and allows logout to finish
  when an offline presence write is queued.
- Removed competing practice-page auth listeners and fallback counters. Shared
  counter settings are validated and an initial count is rendered immediately.
- Added a useful homepage recovery link to the 404 page.
- Fixed the admin history modal's missing Escape/focus behavior, mobile control
  wrapping, and uncaught settings/history request failures. Disabled automatic
  counter inputs are also disabled for keyboard users.
- Added optional test scripts; excluded tests/docs from Firebase Hosting.

## Changed files

`index.html`, `404.html`, `auth.js`, `shared.css`, `admin.html`, `admin.js`,
`KinhTeQuocTe.html`, `NguyenLyKeToan.html`, `QuanTriHoc.html`,
`NhapMonLuatHoc.html`, `TaiChinhCaNhan.html`, `KinhTeChinhTriMacLeNin.html`,
`LuatThuongMaiQT.html`, `VHDDTKD.html`, `TCCN-LuyenDe.html`,
`NguyenLyKeToan-LuyenDe.html`, `firebase.json`, `.gitignore`, `tests/*`,
and this report.

## Evidence collected

- HTML5 parser: 16 original errors; **0 errors after fixes** across all 14 HTML files.
- Chapter preservation: **all 57 chapter/section texts unchanged**, ignoring HTML
  comments and whitespace, compared with the starting branch.
- `node --check` passes for auth.js, admin.js, and the regression runner.
- `git diff --check` passes.
- Real-CDN signed-out local audit exercised all pages and chapter states at
  375, 768, 1280 and 1440 pixels. The post-fix run found no JavaScript runtime
  errors, console errors, failed requests, duplicate IDs, broken local links,
  chapter-navigation gaps or document-level overflow. The admin redirect check
  waits for the signed-out redirect and homepage auth initialization to finish.
- Isolated browser regression run: **all 19 scenarios passed**. All ten
  subject/practice chapter/header/profile scenarios passed at four widths.
  Modal focus/short viewport/Escape, Google popup deduplication and cancellation,
  profile fallback, listener cleanup, keyboard logout, logout failure, idle
  initialization/expiry, offline write timeout and malformed online settings passed.
- Accounting quiz grading, retry, solutions and failed cloud-write feedback passed.
- Finance quick quiz, exam grading, timer, mistakes list, retry and close behavior passed.
- Admin Escape handling, focus containment/restoration, mobile controls, input
  validation, and simulated settings/history read and write failures passed.
- Calculator input events, chart dataset availability, finance flashcards and
  management slider updates passed. Other existing calculator entry points ran
  without JavaScript errors. Mobile screenshots were generated and sampled.

## Remaining verification

None within Task 001 scope. The full real-CDN audit and full isolated regression
suite completed cleanly after the corrected Finance and Admin scenarios passed.

Authenticated tests use a Firebase test double and never write to production.
Real Firebase SDK initialization was tested as a guest; a completed Google OAuth
exchange and authenticated production database permissions require an owner
session and were not claimed as verified. See `tests/README.md` for reproduction.
