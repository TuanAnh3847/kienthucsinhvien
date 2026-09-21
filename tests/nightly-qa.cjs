// Rendered evidence and behavior checks for the nightly UI pass.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const fixture = fs.readFileSync(path.join(__dirname,'firebase-fixture.js'),'utf8');
const routes = JSON.parse(fs.readFileSync('firebase.json')).hosting.rewrites.map(r=>r.source);
const out = path.join(__dirname,'screenshots','nightly');
fs.mkdirSync(out,{recursive:true});
const results = [];
let browser;
(async()=>{
 browser = await chromium.launch({channel:'msedge',headless:true});
 for(const route of ['/',...routes].filter(route=>!process.env.NIGHTLY_FILTER || process.env.NIGHTLY_FILTER.split(',').includes(route))) {
  const page = await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>window.__fixtureOptions={user:{uid:'test-user',email:'student@example.test',displayName:'Sinh viên',photoURL:null}});
  await page.route(/https:\/\/www\.gstatic\.com\/firebasejs\/.+\.js/,r=>r.fulfill({contentType:'text/javascript',body:r.request().url().includes('firebase-app-compat')?fixture:''}));
  await page.goto('http://127.0.0.1:4173'+route,{waitUntil:'load'});
  await page.waitForFunction(()=>typeof tailwind!=='undefined');
  await page.waitForTimeout(300);
  const name=route.slice(1)||'home';
  const item={route,widths:[],leakage:[],controls:[],errors};
  for(const width of [1440,375]) {
   await page.setViewportSize({width,height:1000});
   await page.evaluate(()=>{window.scrollTo({top:0,behavior:'instant'});if(window.EduHeader)EduHeader.switchTab(EduHeader.config.defaultTab,{scroll:false,animate:false});});
   await page.waitForTimeout(250);
   await page.screenshot({path:path.join(out,`${name}-${width}-top.png`)});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),route+' page overflow '+width);
   if(route==='/') {
    item.widths.push({width,cards:await page.locator('.course-card').evaluateAll(es=>es.map(e=>e.offsetHeight))});
    continue;
   }
   assert.equal(await page.locator('.site-header-row').evaluate(e=>e.inert),false);
   assert(await page.locator('#nav-menu [aria-current="page"]').evaluate(el=>{
    const r=el.getBoundingClientRect(),strip=el.parentElement.getBoundingClientRect();
    return r.left>=strip.left-2 && r.right<=strip.right+2;
   }),route+' active chapter stays in view after resize');
   await page.evaluate(()=>window.scrollTo({top:650,behavior:'instant'}));
   await page.waitForTimeout(250);
   const sticky=await page.locator('#nav-menu').evaluate(e=>({top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom,height:e.offsetHeight}));
   assert(Math.abs(sticky.top)<2,route+' sticky strip must sit at viewport top');
   assert.equal(await page.locator('.site-header-row').evaluate(e=>e.inert),true);
   await page.screenshot({path:path.join(out,`${name}-${width}-sticky.png`)});
   const chapters=await page.evaluate(()=>EduHeader.config.chapters.map(ch=>ch.id));
   for(const chapter of chapters) {
    await page.evaluate(id=>EduHeader.switchTab(id,{behavior:'instant',animate:false}),chapter);
    await page.waitForTimeout(80);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),route+' '+chapter+' overflow '+width);
    await page.screenshot({path:path.join(out,`${name}-${width}-${chapter}.png`)});
    if(width===1440) {
     const suspect=await page.locator('#'+chapter).evaluate(el=>[...el.querySelectorAll('p,li,h2,h3,h4,summary,td,th,.source-tag,.source-note,.source-line')].map(e=>e.textContent.trim()).filter(t=>/\bslides?\b|\bsource\b|lecturer|canonical|trích xuất|học liệu|CLO\d|\bCO[12]\b|course direction|build pack|blueprint|compiler|renderer|\[cite:|S\d\s*p\.|SB-|CFX-|AMB-|LIM-|trang này|trang không|không tự|không dựng|không infer|không normalize|Theory phase|Practice phase|bài học-bounded/i.test(t)));
     item.leakage.push(...suspect.map(text=>({chapter,text})));
    }
   }
   // Use a real label click and native radio keyboard operation, then inspect
   // the select value read by the existing grading functions.
   const first=page.locator('.edu-choice-row').first();
   if(await first.count()) {
    const ch=await first.evaluate(e=>e.closest('.tab-content').id);
    await page.evaluate(id=>EduHeader.switchTab(id,{behavior:'instant',animate:false}),ch);
    const labels=first.locator('.edu-choice');
    await labels.first().click();
    assert.equal(await first.locator('select').inputValue(),await first.locator('input:checked').inputValue());
    await first.locator('input:checked').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await first.locator('select').inputValue(),await first.locator('input:checked').inputValue());
    await page.screenshot({path:path.join(out,`${name}-${width}-choices.png`)});
    item.controls.push({width,groups:await page.locator('.edu-choice-group').count(),grids:await page.locator('.edu-compact-activity').count()});
   }
   await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
   await page.waitForTimeout(200);
   assert.equal(await page.locator('.site-header-row').evaluate(e=>e.inert),false,'brand restores');
   item.widths.push({width,sticky,chapters:chapters.length});
  }
  if(route==='/PTBV') {
   await page.evaluate(()=>EduHeader.switchTab('ch2',{behavior:'instant',animate:false}));
   const quiz=page.locator('#quiz-challenge-opportunity');
   // Find the actual activity by its two preserved answer values.
   const id=await page.evaluate(()=>[...document.querySelectorAll('.quiz-list')].find(el=>el.querySelector('option[value="Challenge"]')&&el.querySelector('option[value="Opportunity"]'))?.id);
   assert(id,'Challenge / Opportunity activity exists');
   await page.evaluate(id=>{const el=document.getElementById(id);el.scrollIntoView({block:'center',behavior:'instant'});},id);
   const activity=page.locator('#'+id);
   for(const row of await activity.locator('.quiz-row').all()) {
    const correct=await row.getAttribute('data-correct');
    await row.locator('.edu-choice').filter({has:page.locator(`input[value="${correct}"]`)}).click();
   }
   await activity.getByRole('button',{name:'Kiểm tra',exact:true}).click();
   assert.equal(await activity.locator('.quiz-row.wrong').count(),0);
   assert.equal(await activity.locator('.quiz-row.correct').count(),await activity.locator('.quiz-row').count());
   await activity.getByRole('button',{name:'Làm lại',exact:true}).click();
   assert.equal(await activity.locator('input:checked').count(),0,'reset clears chip state');
   assert.equal(await activity.locator('.quiz-row.correct').count(),0);
   for(const width of [1440,375]) {
    await page.setViewportSize({width,height:1000});
    await activity.evaluate(e=>window.scrollTo({top:e.getBoundingClientRect().top+scrollY-90,behavior:'instant'}));
    await page.screenshot({path:path.join(out,`PTBV-${width}-sorter.png`)});
   }
   item.sorter='correct answers, scoring and reset PASS';
  }
  if(route!=='/') {
   item.components=[];
   await page.setViewportSize({width:1440,height:1000});
   const types={
    table:'table', timeline:'.timeline,.timeline-shell,.timeline-container',
    mindmap:'.mindmap,.mind-map', diagram:'.diagram,.flow,.learning-visual,svg[id]',
    formula:'.formula-box,.big-formula,.formula-card',
    flashcard:'.flashcard,.flip-card,.study-flip',
    tool:'.interactive-box,.interaction,.tool-panel,.calculator',
    disclosure:'details', callout:'.callout,.note,.warning-box'
   };
   for(const [type,selector] of Object.entries(types)) {
    const target=page.locator('.tab-content').locator(selector).first();
    if(!await target.count())continue;
    const chapter=await target.evaluate(e=>e.closest('.tab-content').id);
    await page.evaluate(id=>EduHeader.switchTab(id,{behavior:'instant',animate:false}),chapter);
    if(type==='disclosure') await target.locator('summary').first().click();
    if(type==='flashcard') await target.click();
    await target.evaluate(el=>window.scrollTo({top:el.getBoundingClientRect().top+scrollY-85,behavior:'instant'}));
    await page.waitForTimeout(type==='flashcard'?650:180);
    await page.screenshot({path:path.join(out,`${name}-component-${type}.png`)});
    item.components.push({type,chapter});
   }
  }
  assert.deepEqual(errors,[]);
  results.push(item);
  fs.writeFileSync('tests/nightly-results.json',JSON.stringify(results,null,2));
  console.log('PASS',route,JSON.stringify(item.controls),'visible scan candidates:',item.leakage.length);
  await page.close();
 }
 await browser.close();
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1;});
