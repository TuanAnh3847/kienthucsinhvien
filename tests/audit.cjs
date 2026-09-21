const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const hosting = JSON.parse(fs.readFileSync(path.join(root, 'firebase.json'), 'utf8')).hosting;
const rewrites = hosting.rewrites || [];
const rewriteSources = new Set(rewrites.map(rule => rule.source));
const publicRouteByFile = new Map(rewrites.map(rule => [rule.destination.replace(/^\//, ''), rule.source]));
const files = fs.readdirSync(root).filter(f => f.endsWith('.html') && (!process.env.AUDIT_FILTER || f.includes(process.env.AUDIT_FILTER)));
const report = [];
(async () => {
  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true });
  for (const file of files) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [], consoleErrors = [], failedRequests = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('requestfailed', r => failedRequests.push(r.url()));
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    for (const [i, m] of [...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].entries()) {
      try { new vm.Script(m[1], { filename: file + ':' + i }); } catch (e) { errors.push(e.message); }
    }
    const publicRoute = publicRouteByFile.get(file) || (file === 'index.html' ? '/' : '/' + file.replace('.html', ''));
    await page.goto('http://127.0.0.1:4173' + publicRoute, { waitUntil: 'load' });
    if (file === 'admin.html') {
      await page.waitForURL(/\/(?:index(?:\.html)?)?$/);
      await page.waitForFunction(() => typeof loginGoogleReal === 'function');
    }
    await page.waitForTimeout(700);
    const structure = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map(e => e.id);
      const missingHandlers = [];
      for (const el of document.querySelectorAll('*')) for (const a of el.attributes) {
        if (!a.name.startsWith('on')) continue;
        try { new Function('event', a.value); } catch (error) { missingHandlers.push('Invalid '+a.name+' on '+el.tagName+'#'+el.id+': '+error.message); }
        for (const m of a.value.matchAll(/(?<![.\w])([a-zA-Z_$][\w$]*)\s*\(/g)) {
          if (['if','for','confirm','alert'].includes(m[1])) continue;
          try { if (typeof window.eval(m[1]) !== 'function') missingHandlers.push(m[1]); } catch { missingHandlers.push(m[1]); }
        }
      }
      return { duplicateIds: [...new Set(ids.filter((id,i) => ids.indexOf(id) !== i))], missingHandlers: [...new Set(missingHandlers)], links: [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')), chapters: window.EduHeader ? window.EduHeader.config.chapters.map(chapter => chapter.id) : [...document.querySelectorAll('#mobile-nav option')].map(o => o.value), modal: !!document.getElementById('welcome-modal'), firebase: typeof firebase !== 'undefined' && firebase.apps.length === 1 };
    });
    const brokenLinks = structure.links.filter(h => {
      if (!h || /^(#|mailto:|tel:|https?:|javascript:)/.test(h)) return false;
      const pathname = h.split(/[?#]/)[0];
      if (rewriteSources.has(pathname.startsWith('/') ? pathname : '/' + pathname)) return false;
      const p = pathname.replace(/^\//,'') || 'index.html';
      return !fs.existsSync(path.join(root, p)) && !fs.existsSync(path.join(root, p + '.html'));
    });
    const widths = [];
    // Inspect content behind the login overlay without signing into the live backend.
    await page.evaluate(() => document.getElementById('welcome-modal')?.classList.add('hidden'));
    for (const width of [375,768,1280,1440]) {
      await page.setViewportSize({ width, height: 900 });
      const states = [];
      for (const chapter of structure.chapters.length ? structure.chapters : ['']) {
        if (chapter) await page.evaluate(value => {
          if (window.EduHeader) window.EduHeader.switchTab(value, {scroll:false});
          else { const el = document.getElementById('mobile-nav'); el.value = value; el.dispatchEvent(new Event('change', {bubbles:true})); }
        }, chapter);
        await page.waitForTimeout(60);
        states.push(await page.evaluate(() => {
          const visible = el => !!el && el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0;
          const overflow = [...document.querySelectorAll('body *')].filter(el => { const r=el.getBoundingClientRect(); return visible(el) && r.right > innerWidth+2 && !el.closest('.overflow-x-auto, .scroll-table'); }).slice(0,8).map(el => el.tagName + '#' + el.id + '.' + String(el.className).slice(0,80));
          const wideScroll = [...document.querySelectorAll('body *')].filter(el => visible(el) && el.scrollWidth > el.clientWidth + 2).slice(0,8).map(el => ({el:el.tagName + '#' + el.id + '.' + String(el.className).slice(0,60), clientWidth:el.clientWidth, scrollWidth:el.scrollWidth, overflowX:getComputedStyle(el).overflowX}));
          return { chapter: window.EduHeader?.activeTab || document.getElementById('mobile-nav')?.value, scrollWidth:document.documentElement.scrollWidth, desktopNav:visible(document.getElementById('nav-menu')), mobileNav:visible(document.getElementById('mobile-nav')), overflow, wideScroll };
        }));
      }
      widths.push({width, states});
    }
    const item = {file, errors, consoleErrors, failedRequests, ...structure, brokenLinks, widths};
    report.push(item);
    console.log(JSON.stringify({file, errors,consoleErrors,failedRequests,duplicateIds:item.duplicateIds,missingHandlers:item.missingHandlers,brokenLinks, issues:widths.flatMap(w=>w.states.filter(s=>s.scrollWidth>w.width+2 || (item.chapters.length && !s.desktopNav && !s.mobileNav)).map(s=>({width:w.width,...s})))}));
    await page.close();
  }
  await browser.close();
  fs.writeFileSync(process.env.AUDIT_REPORT || 'tests/audit-results.json', JSON.stringify(report,null,2));
  if (report.some(r => r.errors.length || r.consoleErrors.length || r.failedRequests.length || r.duplicateIds.length || r.missingHandlers.length || r.brokenLinks.length || r.widths.some(w=>w.states.some(s=>s.scrollWidth>w.width+2 || (r.chapters.length && !s.desktopNav && !s.mobileNav))))) process.exitCode = 1;
})().catch(e => {console.error(e);process.exitCode=1;});
