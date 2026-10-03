# EDU CONNECT — independent responsive source review

Review snapshot: 2026-10-03; baseline `5b0e619fb6838363a79dcb2966a6c138375a59ec` and current uncommitted draft. Read-only review of repository; no implementation files edited by this reviewer.

## Evidence limits

This is source analysis, not a rendered 320px/390px browser test. It predicts cases requiring verification and distinguishes intentional horizontal scrolling from uncontrolled/clipped overflow. A full mobile pass remains required before marking mobile complete. Academic correctness has not been independently checked against original UEL materials.

## Findings requiring attention before implementing the draft

1. **VHDD double padding introduced by the shared mobile rule.** `body.edu-study-page :is(.learn-panel,.learn-section,.lesson-section){padding:1rem}` adds padding to `.lesson-section`, which previously owns no outer padding. Its `.section-head` already has padding and subsequent children already have `.85rem` mobile side margins. A 320px viewport gives approximately 288px within main; the new outer padding and old margins reduce children to about 227px before their own padding. Exclude `.lesson-section` from this blanket rule or reconcile the entire inner spacing system. This especially squeezes two-column concept maps and the culture matrix.

2. **TLUD reinforcement matrix may clip at 320px.** `.matrix4` retains `95px 1fr 1fr`, `overflow:hidden` and long English terms such as “Reinforcement” and “Strengthens behavior.” Implicit minimum-content widths can expand the `1fr` tracks beyond the 288px content area; the overflow would then be hidden. Use explicit `minmax(0,1fr)` tracks with controlled wrapping, or preserve the semantic matrix in a visibly scrollable wrapper. At 390px the additional width may conceal the issue; check both widths.

3. **KTCT calculator fields remain three columns at phone widths.** The two `grid grid-cols-3 gap-3` calculator input groups lack a responsive collapse. At 320px, card padding can leave about 70–80px per input, making lengthy numerical values and labels inconvenient even without page overflow. Prefer one column below a suitable breakpoint; verify value entry, labels and result output.

4. **Flashcards require intrinsic-height verification.** NLKT155px, NLTTTC170/190px, STKN150px, TLUD160px inner and VHDD190px inner have/had absolute faces. Raising typography can clip or overlap answers. The current NLKT draft changes to overlapping grid faces are sensible. Apply equivalent structural treatment only to the remaining affected variants, retaining flip classes and event behavior. KTTC, KTQT, TCCN and LTMQT already use intrinsic/min-height variants; avoid unnecessary conversion.

5. **Theory navigation draft is useful but needs rendered checks.** It keeps `#nav-menu` and chapter IDs, adds arrows and a native picker below768px, and computes scroll offset from visible navigation. Check: all tab selections; current picker value; selecting after deep scrolling; chapter heading below sticky nav; compact brand state; keyboard selection; resizing around767/768px; arrows after fonts load. The new38px-wide arrow target is44px high. Existing regression assertions that require `#nav-menu` visible at every width will need an explicit either-strip-or-picker update rather than silently removing navigation coverage.

6. **Practice navigation is still a separate design.** The six practice pages retain their own native picker below1280px and a different active underline. They do not inherit theory's new blue chapter component. Standardize the visual treatment deliberately without converting their scoring/navigation scripts to the theory component.

## Coverage across 12 theory pages

| Subject/route | Source findings and tomorrow's verification focus |
|---|---|
| NMLH | Most content grids already collapse at mobile breakpoints. Numerous14px prose and12px labels can be tiring; scoped paragraph hierarchy is preferable to changing every heading. Chapter6 keeps a two-column penalty grid on phones; inspect whether one column improves reading at320px. |
| KTCTMLN | Raw dollar-delimited formulas appear in static and generated output. Draft formatting fixes require formula/arithmetic preservation. Inspect the two three-column calculator groups and chart labels at320/390px. |
| KTTC | Tables intentionally have620–680px minimum widths inside `.scroll-table`; retain horizontal scroll and add a cue, not forced tiny text. `.card-head` badges are nowrap but the draft's wrapping header helps. Existing grid-face flashcards are intrinsically sized. |
| NLKT | Account tables intentionally scroll. Draft intrinsic flashcards are appropriate. Eight tabs can hide Review on desktop; arrows/picker address discovery. Check long account names, journal entries and chart-of-accounts filter widths. |
| KTQT | Graphs/minimum620px SVG shells and720px tables/mindmaps are intentionally scrollable; provide clear scroll cues. Main grids collapse. Keep semantic graph colors and formula text sizes rather than neutralizing everything blue. |
| LTMQT | `.grid-auto` already uses `minmax(min(100%,250px),1fr)`, a good narrow-container safeguard. Flash-grid minimum220px and mindmap minimum620/720px should be checked in their actual padded containers; mindmaps require visible scroll affordance. |
| TCCN | Main grids collapse and most panels use safe minmax tracks. Long practical chapters need within-chapter anchors. Existing min-height/grid-face flashcards are not the same fixed-face problem as NLTTTC/STKN. Sources/limitations should stay readable and prominent. |
| NLTTTC | Many diagrams already flatten into readable mobile stacks. Timelines retain5×220px tracks and need scroll cues. Absolute flashcard faces plus increased text are the main clipping risk. Check calculator rows and long instrument labels. |
| PTBV | Goal tiles remain two columns at mobile, so long labels may become dense at320px. Course-map modal retains two columns and can be narrow. Check floating course-map button against chapter controls/content; keep full roadmap readable. |
| STKN | Workspace/scenario grids require minimum240px tracks. Direct interaction containers leave about256px at320px, so generally fit; nested instances need rechecking. Empathy map keeps90px center plus two narrow side columns; inspect labels and preserve the model topology. Fixed flip faces remain a risk. |
| TLUD | Matrix issue above; `.grid-auto` minimum220px is usually safe in the current unpadded learn-block, but nested cards should be checked. Emotion strip deliberately scrolls. Review interactions need touch and keyboard checks as well as source checks. |
| VHDDTKD | Shared padding regression above. Culture matrix, continuum labels, concept map and long source captions are important phone checks. Flashcard inner faces remain absolute; verify long answers at enlarged text. |

## Coverage across six practice pages

All six use responsive Tailwind grids, native mobile navigation and44px option targets through shared CSS. Their primary source risks are the signed-in/out header with a long subject subtitle, fixed sticky action area, nested card padding, and generated question/answer text. Check both320px and390px, with a four-digit online count, a long account name, short/long questions, unanswered/wrong/correct/retry states and open result explanations.

| Practice route | Particular focus |
|---|---|
| NguyenLyKeToan-LuyenDe | Long English case requirements; three-column small metrics; generated case/solution tables; non-MCQ guided work. |
| TCCN-LuyenDe | Five navigation modes; sticky exam controls; mistakes buttons; timer; long finance options and explanations. |
| NhapMonLuatHoc-LuyenDe | Long legal stems; chapter labels; feedback reading flow. |
| KTQT-LuyenDe | Long economic terms/formulas; feedback paragraphs; overview statistics must not remain blank. |
| LTMQT-LuyenDe | Long case/term labels; feedback paragraphs; overview statistics must not remain blank. |
| NLTTTC-LuyenDe | Long financial instrument names; numerical options; overview statistics must not remain blank. |

## Learner organization recommendations

- Standardize module headings and descriptive prose, but leave chart labels and semantic correct/wrong/warning colors purposeful.
- Limit full-width prose to about75–78ch; keep tables and visualization modules full-width.
- Give long chapters a collapsible “Trong chương này” anchor list, preserving existing chapter/tab IDs.
- Replace compiler/author instructions with concise learner directions only when meaning and pedagogic limitations remain intact. Maintain an exact before/after record of editorial substitutions.
- Preserve source uncertainty rather than removing limitations to make copy sound confident.

## Source validation snapshot

- HTML5 parse/duplicate IDs: **PASS, zero errors** on this draft snapshot.
- `node --check` shared header/study scripts and37 inline executable scripts: **PASS on current draft**.
- `git diff --check`: **FAIL** on current draft; trailing whitespace in NMLH and numerous blank lines in TCCN. Clean when implementing; this is a formatting issue, not proof of a runtime fault.
- `preservation_check.py 5b0e619...`: **PASS** all12 routes, documented negative guards and homepage/route contracts. Its four academic-completion subjects have weaker table/formula coverage, so this does not replace strict text/script comparison.
- `practice_trace_check.py`: **PASS**24 new +40 pilot +40 Pass03 questions; evidence is local chapter trace, not independent textbook verification.
- Existing `content_check.py --self-test`: **FAIL** at KTTC because draft editorial replacements are not in the academic allowlist. This cannot be reported as passing.
- Current HTML inline scripts unchanged against baseline for NLKT/KTTC/TCCN/NMLH. KTCT changes five generated output lines: dollar syntax/arrow formatting; runtime arithmetic requires a narrow recorded exception and comparison.
- No mobile render, OAuth, deployed change or academic-source validation was performed by this reviewer.

Implementation has been deferred by the user. Treat uncommitted changes as reviewable proposals, not deployed fixes or verified results.

## Final acceptance matrix for tomorrow's single implementation pass

| Area | Required acceptance evidence |
|---|---|
| Scope | Branch based on current approved repository SHA; no deployment; exact file diff and editorial before/after list. |
| Coverage | Every chapter/review tab across12 subjects, every mode across6 practice routes; include320,390,768 and desktop widths. |
| Typography | Long Vietnamese accented and English content is readable; no unintentionally tiny prose, cut glyphs, clipped labels or disproportionate headings. |
| Flashcards | NLKT `.flip-face`, NLTTTC `.flip-face`, STKN `.flip-front/.flip-back`, TLUD `.flip-front/.flip-back`, VHDD `.flip-front/.flip-back`: full longest answer visible before/after flip, no overlap with following card, keyboard/touch activation retained. |
| Phone diagrams | TLUD `.matrix4`; VHDD `.culture-matrix/.concept-map`; STKN `.empathy-grid`; PTBV `.goal-grid/.map-cols`; NLTTTC `.timeline`: all relationships/labels readable, deliberate scroll has a visible cue. |
| Navigation | Desktop arrows reveal hidden chapters; native picker lists all chapters and tracks selection; selected chapter begins below sticky nav after deep scroll; keyboard and breakpoint changes work. |
| Calculators | KTCT triple input groups usable at320px; all existing min/max/step/default values and arithmetic retained; formatted results render without raw author syntax. |
| Practice | Long question/option/explanation fits; select/change/submit/lock/retry/unanswered/time-expiry behavior unchanged; sticky actions accessible without hiding the last question. |
| Preservation | Exact baseline comparison of routes, question banks, answers, formulas/numerical values, field constraints and scripts; output-format/copy exceptions must be narrow and enumerated. Existing academic guard passes after documented exact substitutions, not broad ignores. |
| Evidence | Before/after screenshots of representative high-impact changes, complete coverage results and explicit remaining limitations. |
