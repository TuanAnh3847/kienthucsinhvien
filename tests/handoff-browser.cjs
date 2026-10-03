const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const fixture = fs.readFileSync(path.join(__dirname, 'firebase-fixture.js'), 'utf8');
const root = path.resolve(__dirname, '..');
const evidence = path.join(root, 'docs/edu-connect-handoff-2026-10-03/evidence');
const routes = JSON.parse(fs.readFileSync(path.join(root, 'firebase.json'))).hosting.rewrites.map(r => r.source);
async function open(browser, route, width, height = 900) {
  const page = await browser.newPage({viewport:{width,height}, reducedMotion:'reduce'});
  page.errors = [];
  page.on('pageerror', e => page.errors.push(e.message));
  await page.addInitScript(() => { window.__fixtureOptions = {user:{uid:'handoff-fixture',displayName:'Sinh viên có họ và tên rất dài để kiểm tra bố cục',email:'student@example.test'}}; });
  await page.route(/https:\/\/www\.gstatic\.com\/firebasejs\/.+\.js/, r => r.fulfill({contentType:'text/javascript',body:r.request().url().includes('firebase-app-compat') ? fixture : ''}));
  // Block any production database endpoint even if a new SDK URL escapes the fixture.
  await page.route(/firebaseio\.com|firebasedatabase\.app|firestore\.googleapis\.com|identitytoolkit\.googleapis\.com/, r => r.abort());
  await page.goto('http://127.0.0.1:4173'+route, {waitUntil:'load'});
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);
  return page;
}
async function baseline() {
  const browser = await chromium.launch({channel:'msedge',headless:true});
  const captures = [['/KTCTMLN','ch2'],['/NLKT','ch1'],['/STKN','review'],['/NLTTTC','ch1'],['/TLUD','review'],['/VHDDTKD','review'],['/NhapMonLuatHoc-LuyenDe','overview'],['/NLTTTC-LuyenDe','overview'],['/','home']];
  fs.mkdirSync(path.join(evidence,'baseline-local'),{recursive:true});
  const results = [];
  try {
    for (const width of [320,1366]) for (const [route,tab] of captures) {
      const page = await open(browser,route,width,width===320?740:900);
      if (tab!=='home' && tab!=='overview') await page.evaluate(id=>EduHeader.switchTab(id,{scroll:false,animate:false}),tab);
      const name = `${route.slice(1)||'home'}_${tab}_${width}.png`;
      await page.screenshot({path:path.join(evidence,'baseline-local',name),fullPage:true});
      results.push({route,tab,width,errors:page.errors,evidence:`evidence/baseline-local/${name}`});
      await page.close();
      console.log('BASELINE',route,tab,width);
    }
    fs.writeFileSync(path.join(evidence,'baseline-local/results.json'),JSON.stringify({browser:browser.version(),base:'5b0e619fb6838363a79dcb2966a6c138375a59ec',results},null,2));
  } finally { await browser.close(); }
}
module.exports = {open,root,evidence,routes};
if (require.main===module) baseline().catch(e=>{console.error(e);process.exitCode=1});
