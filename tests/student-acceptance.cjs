// End-to-end UI journey: begin at home, study, practice, review, retry, return.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fixture=fs.readFileSync(path.join(__dirname,'firebase-fixture.js'),'utf8');
const out=path.join(__dirname,'screenshots','round2');fs.mkdirSync(out,{recursive:true});
const results=[];
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{
 for(const [width,height]of [[1440,900],[1366,768],[390,844],[375,812]]){
 const p=await b.newPage({viewport:{width,height},isMobile:width<600,hasTouch:width<600});const errors=[],failed=[];p.on('pageerror',e=>{errors.push(e.message);console.error(p.url(),e.stack)});p.on('requestfailed',r=>failed.push(r.url()));p.on('dialog',d=>d.accept());
 await p.addInitScript(()=>window.__fixtureOptions={user:{uid:'test-user',email:'student@example.test',displayName:'Sinh viên'}});
 await p.route(/https:\/\/www\.gstatic\.com\/firebasejs\/.+\.js/,r=>r.fulfill({contentType:'text/javascript',body:r.request().url().includes('firebase-app-compat')?fixture:''}));
 try{
 await p.goto('http://127.0.0.1:4173/',{waitUntil:'load'});await p.waitForTimeout(550);await p.screenshot({path:path.join(out,`final-home-${width}.png`)});
 for(const subject of ['NLKT','TCCN']){
  await p.locator(`a[href="/${subject}"]`).click();await p.waitForTimeout(550);await p.screenshot({path:path.join(out,`final-${subject}-${width}-top.png`)});
  const nav=p.locator('#nav-menu button');await nav.nth(1).click();await p.mouse.wheel(0,900);await p.waitForTimeout(550);
  assert(await p.locator('#nav-menu').evaluate(el=>Math.abs(el.getBoundingClientRect().top)<2));
  await p.screenshot({path:path.join(out,`final-${subject}-${width}-sticky.png`)});
  await nav.nth(2).click();await p.waitForTimeout(600);
  assert(await p.locator('.tab-content:visible > header').evaluate(el=>el.getBoundingClientRect().top>=document.getElementById('nav-menu').getBoundingClientRect().bottom-2),'chapter title not covered after switching deeply scrolled');
  await nav.first().click();await p.waitForTimeout(500);
  if(subject==='NLKT'){
   const quiz=p.locator('#principle-choices button');await quiz.first().click();await quiz.nth(1).click();await p.locator('#principle-quiz').getByRole('button',{name:'Câu khác',exact:true}).click();
  }else{
   const card=p.locator('.study-flip').first();await card.click();await card.click();
  }
  await p.locator('.study-practice-link').click();await p.waitForTimeout(500);
  if(subject==='NLKT'){
   await p.getByRole('button',{name:'Bắt đầu luyện theo chương',exact:true}).click();await p.getByRole('button',{name:'Mở bài luyện',exact:true}).first().click();
   await p.locator('#question-list > div').first().locator('button').nth(1).click();await p.locator('#question-list > div').first().locator('button').first().click();
   for(const q of await p.locator('#question-list > div').all())await q.locator('button').first().click();
   await p.getByRole('button',{name:'Nộp bài',exact:true}).click();
  }else{
   await p.getByRole('button',{name:'Vào luyện thi',exact:true}).click();await p.locator('#exam-grid article').filter({hasText:'Vận dụng: hành vi, ngân sách & bảo hiểm'}).getByRole('button',{name:'Bắt đầu làm bài',exact:true}).click();
   await p.locator('.question-card').first().locator('button').nth(1).click();await p.locator('.question-card').first().locator('button').first().click();
   for(const q of await p.locator('.question-card').all())await q.locator('button').first().click();
   await p.getByRole('button',{name:'Nộp bài',exact:true}).click();
  }
  await p.waitForTimeout(650);assert(await p.locator('#result-box').isVisible());assert.match(await p.locator('#result-box').innerText(),/% correct/);
  await p.screenshot({path:path.join(out,`final-${subject}-${width}-result.png`)});
  await p.locator('#question-list > div').first().scrollIntoViewIfNeeded();await p.waitForTimeout(300);await p.screenshot({path:path.join(out,`final-${subject}-${width}-explanation.png`)});
  await p.getByRole('button',{name:'Làm lại',exact:true}).click();assert(!await p.locator('#result-box').isVisible());
  await p.waitForFunction(()=>{const el=document.getElementById('practice-panel');return Math.abs(el.getBoundingClientRect().top-parseFloat(getComputedStyle(el).scrollMarginTop))<3},{},{timeout:3000});
  const retryPosition=await p.locator('#practice-panel').evaluate(el=>({top:el.getBoundingClientRect().top,margin:getComputedStyle(el).scrollMarginTop,padding:getComputedStyle(document.documentElement).scrollPaddingTop,scroll:scrollY}));
  assert(Math.abs(retryPosition.top-parseFloat(retryPosition.margin))<3,subject+' '+width+' retry position '+JSON.stringify(retryPosition));
  await p.screenshot({path:path.join(out,`final-${subject}-${width}-practice.png`)});
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await p.locator('.practice-theory-link a').click();assert.equal(new URL(p.url()).pathname,'/'+subject);
  await p.getByRole('link',{name:'Về trang chủ Edu Connect'}).click();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);results.push({width,height,pass:true,subjects:['NLKT','TCCN']});console.log('PASS student acceptance',width,height);
 }finally{await p.close()}
 }
}finally{await b.close();fs.writeFileSync(path.join(__dirname,'student-acceptance-results.json'),JSON.stringify(results,null,2))}})().catch(e=>{console.error(e);process.exitCode=1});
