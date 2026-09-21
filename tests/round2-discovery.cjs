// Initial rendered student inspection before implementation changes.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const fixture=fs.readFileSync(path.join(__dirname,'firebase-fixture.js'),'utf8');
const out=path.join(__dirname,'screenshots','round2');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
 const page=await browser.newPage({viewport:{width:1366,height:768}});
 await page.addInitScript(()=>window.__fixtureOptions={user:{uid:'test-user',email:'student@example.test',displayName:'Sinh viên',photoURL:null}});
 await page.route(/https:\/\/www\.gstatic\.com\/firebasejs\/.+\.js/,r=>r.fulfill({contentType:'text/javascript',body:r.request().url().includes('firebase-app-compat')?fixture:''}));
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 await page.screenshot({path:path.join(out,'before-home.png')});
 await page.locator('a[href="/NLKT"]').click();
 await page.waitForTimeout(700);
 await page.screenshot({path:path.join(out,'before-NLKT-top.png')});
 await page.getByRole('button',{name:'Ch.2: Financial Statements',exact:true}).click();
 await page.mouse.wheel(0,850);await page.waitForTimeout(500);
 await page.screenshot({path:path.join(out,'before-NLKT-scrolled.png')});
 await page.getByRole('button',{name:'Ch.3: Accounts & Double Entry',exact:true}).click();
 await page.waitForTimeout(500);
 console.log('NLKT chapter switch:',await page.locator('.tab-content:visible h2').allTextContents());
 await page.getByRole('link',{name:'Về trang chủ Edu Connect'}).click();
 for(const route of ['NguyenLyKeToan-LuyenDe','TCCN-LuyenDe']){
  await page.locator(`a[href="/${route}"]`).click();await page.waitForTimeout(500);
  console.log('\nPRACTICE '+route+'\n'+(await page.locator('body').innerText()).slice(0,18000));
  await page.screenshot({path:path.join(out,`before-${route}.png`)});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,`before-${route}-mobile.png`)});
  await page.goto('http://127.0.0.1:4173/');
  await page.setViewportSize({width:1366,height:768});
 }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
