const fs=require('node:fs'),{chromium}=require('playwright');
const fixture=fs.readFileSync('tests/firebase-fixture.js','utf8');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const results=[];
 try {
  for(const route of JSON.parse(fs.readFileSync('firebase.json')).hosting.rewrites) {
   const page=await browser.newPage({viewport:{width:375,height:900}});
   await page.addInitScript(()=>window.__fixtureOptions={user:{uid:'test-user',email:'student@example.test',displayName:'Sinh viên',photoURL:null}});
   await page.route(/https:\/\/www\.gstatic\.com\/firebasejs\/.+\.js/,r=>r.fulfill({contentType:'text/javascript',body:r.request().url().includes('firebase-app-compat')?fixture:''}));
   await page.goto('http://127.0.0.1:4173'+route.source,{waitUntil:'load'});
   for(const chapter of await page.evaluate(()=>EduHeader.config.chapters.map(ch=>ch.id))) {
    await page.evaluate(id=>EduHeader.switchTab(id,{scroll:false,animate:false}),chapter);
    const issues=await page.locator('#'+chapter).evaluate(root=>{
     const overflow = [...root.querySelectorAll('*')].filter(el=>{
      const r=el.getBoundingClientRect(),style=getComputedStyle(el);
      if(!r.width||!r.height||r.right<=innerWidth+2||style.position==='absolute'||el.closest('svg'))return false;
      for(let p=el;p&&p!==document.body;p=p.parentElement) {
       const cs=getComputedStyle(p);
       if(['auto','scroll'].includes(cs.overflowX))return false;
       if(cs.backfaceVisibility==='hidden')return false;
      }
      return true;
     }).slice(0,8).map(el=>({tag:el.tagName,class:el.className,text:el.textContent.trim().slice(0,160)}));
     const clippedCards=[...root.querySelectorAll('.flip-back,.study-flip-back,.flash-back')].filter(el=>el.clientHeight>0&&el.scrollHeight>el.clientHeight+3).map(el=>({tag:el.tagName,class:el.className,text:el.textContent.trim().slice(0,160),height:el.clientHeight,scrollHeight:el.scrollHeight}));
     return [...overflow,...clippedCards];
    });
    if(issues.length)results.push({route:route.source,chapter,issues});
   }
   await page.close();
  }
  fs.writeFileSync('tests/component-overflow-results.json',JSON.stringify(results,null,2));
  console.log(JSON.stringify(results,null,2));
 } finally {await browser.close();}
})();
