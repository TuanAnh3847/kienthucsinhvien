// Semantic reading roles, independent of computed size; never classify by size.
// Tables/SVG use their own local-scroll/diagram checks, not prose typography.
function measureReadingFonts(section) {
  const note = '.hint,.helper,.micro-note,.status-note,.limitation,.source-limit,.source-warning,.callout-body,p.text-xs,p.source-note,p.center-note,p.interaction-hint,p.label-small,p.muted,p.soft-warning';
  const label = '.source-ref,.source-tag,.source-caption,.learn-kicker,.section-label,.interaction-kicker,.kicker,.pill,.badge,.flash-label,.eyebrow,.interaction-badge';
  const candidates = section.querySelectorAll(`p,.chapter-objective,#global-announcement .space-y-1 > .text-stone-600,${note},${label}`);
  const measurements = [], exceptions = [];
  for (const e of candidates) {
    const style = getComputedStyle(e);
    if (!e.getClientRects().length || style.visibility === 'hidden' || e.closest('[aria-hidden="true"]') || !e.textContent.trim()) continue;
    const description = {tag:e.tagName, class:typeof e.className==='string'?e.className:'', text:e.textContent.trim().slice(0,100)};
    if (e.closest('svg,table,[role="table"]')) {
      exceptions.push({...description, reason:'Data cell or diagram: separate numeric/overflow/diagram gates; not prose.'});
      continue;
    }
    // Home metadata and practice overview stat captions are short labels.
    const metadata = e.matches(label) || e.closest(label) || e.closest('.edu-subject-header,body.edu-home-page header,body.edu-home-page nav,footer,#overview-stats') ||
      (document.body.classList.contains('edu-home-page') && e.matches('p.text-xs'));
    const role = metadata ? 'label' : e.matches(note) || e.closest(note) || e.closest('#practice-courses') ? 'note' : 'prose';
    const size = parseFloat(style.fontSize), line = parseFloat(style.lineHeight), ratio = line / size;
    const minSize = {prose:16,note:15,label:13}[role], minLine = {prose:1.65,note:1.65,label:1.5}[role];
    const failures = [];
    if (!Number.isFinite(size) || size < minSize - .01) failures.push(`font below ${minSize}px`);
    if (!Number.isFinite(ratio) || ratio < minLine - .002 || (role==='prose' && ratio > 1.752)) failures.push(`line-height outside ${role==='prose'?'1.65–1.75':'>='+minLine}`);
    measurements.push({...description,role,font:size,lineHeight:line,ratio,failures});
  }
  return {measurements,exceptions,failures:measurements.filter(m=>m.failures.length)};
}
module.exports = {measureReadingFonts};
