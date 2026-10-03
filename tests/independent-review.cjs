const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const {chromium}=require('playwright');
const {open,root,routes}=require('./handoff-browser.cjs');
const {measureReadingFonts}=require('./reading-font-gate.cjs');
const out=path.join(root,'docs/edu-connect-handoff-2026-10-03/independent-review');
const sourceCommit=require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8',windowsHide:true}).trim();
fs.mkdirSync(out,{recursive:true});
const sourceHashes=Object.fromEntries(['reading.js','reading.css','edu-header.js','tests/reading-font-gate.cjs','tests/independent-review.cjs'].map(f=>[f,createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex')]));
const results=[];
async function test(name,fn){try{results.push({name,status:'PASS',...await fn()});console.log('PASS',name)}catch(e){results.push({name,status:'FAIL',error:e.stack});console.error('FAIL',name,e.message)}}
async function bounds(p,id,tab){
 await p.waitForFunction(id=>document.activeElement?.id===id,id);
 const m=await p.evaluate(id=>{
  const h=document.getElementById(id),r=h.getBoundingClientRect(),header=Math.max(0,document.querySelector('#edu-header').getBoundingClientRect().bottom);
  const disclosures=[];for(let d=h.parentElement;d;d=d.parentElement)if(d.tagName==='DETAILS')disclosures.push(d.open);
  return {id,headingTop:r.top,headingBottom:r.bottom,headerBottom:header,clearance:r.top-header,visible:!!h.getClientRects().length&&r.top>=header&&r.top<innerHeight,focus:document.activeElement.id,activeTab:EduHeader.activeTab,picker:document.querySelector('#edu-chapter-picker').value,disclosures,documentWidth:document.documentElement.scrollWidth,viewport:innerWidth};
 },id);
 assert(m.visible,'heading visible above header and within viewport');assert(m.clearance>=23,'24px header clearance');
 assert(m.disclosures.every(Boolean));assert.equal(m.focus,id);assert.equal(m.activeTab,tab);assert.equal(m.picker,tab);assert(m.documentWidth<=m.viewport+1);
 assert.deepEqual(p.errors,[]);return m;
}
async function chooseTab(p,tab){
 const picker=p.locator('#edu-chapter-picker');
 if(await picker.isVisible())await picker.selectOption(tab);
 else {const button=p.locator(`[data-edu-tab="${tab}"]`);await button.focus();await p.keyboard.press('Enter');}
 assert.equal(await p.evaluate(()=>EduHeader.activeTab),tab);
}
(async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true});
 try{
  for(const width of [320,390,768,1366]){
   for(const method of ['keyboard','touch'])await test(`R01 NLKT ${width} ${method}`,async()=>{
    const context=await b.newContext({hasTouch:method==='touch'}),p=await open(context,'/NLKT',width,width===320?740:width===768?1024:844);
    try{
     const targets=['edu-reading-ch1-4','edu-reading-ch1-5'];const measured=[];
     for(const id of targets){
      await p.evaluate(id=>{const h=document.getElementById(id);for(let d=h.parentElement;d;d=d.parentElement)if(d.tagName==='DETAILS')d.open=false;document.querySelector('#ch1 .edu-chapter-toc').open=true},id);
      const link=p.locator(`#ch1 .edu-chapter-toc a[href="#${id}"]`);
      if(method==='touch')await link.tap();else{await link.focus();await p.keyboard.press('Enter');}
      measured.push(await bounds(p,id,'ch1'));
     }
     // Add an inner disclosure around the original target; academic text is unchanged.
     const id=targets[0];await p.evaluate(id=>{const h=document.getElementById(id),inner=document.createElement('details'),s=document.createElement('summary');s.textContent='Nested regression fixture';h.before(inner);inner.append(s,h);for(let d=h.parentElement;d;d=d.parentElement)if(d.tagName==='DETAILS')d.open=false;document.querySelector('#ch1 .edu-chapter-toc').open=true},id);
     const link=p.locator(`#ch1 .edu-chapter-toc a[href="#${id}"]`);
     if(method==='touch')await link.tap();else{await link.focus();await p.keyboard.press('Enter');}
     measured.push({...await bounds(p,id,'ch1'),nested:true});assert(measured.at(-1).disclosures.length>=2);
     return {route:'/NLKT',width,method,measured};
    }finally{await context.close()}
   });
   for(const [route,tab,id]of [['/TCCN','ch5','edu-reading-ch5-1'],['/KTTC','review','edu-reading-review-1'],['/NLKT','ch1','edu-reading-ch1-4'],['/NLTTTC','ch3','tony-step-title']])await test(`R02 ${route} ${width}`,async()=>{
    const p=await open(b,route+'#'+id,width,width===768?1024:844),measured=[];
    try{
     measured.push({action:'new tab',...await bounds(p,id,tab)});
     await p.reload({waitUntil:'load'});measured.push({action:'reload',...await bounds(p,id,tab)});
     await p.evaluate(()=>{history.replaceState(null,'',location.pathname);EduHeader.switchTab(EduHeader.config.chapters.find(c=>c.id!==EduHeader.activeTab).id,{scroll:false,animate:false})});
     await p.evaluate(id=>location.hash=id,id);measured.push({action:'hashchange',...await bounds(p,id,tab)});
     return {route,tab,id,width,idType:id.startsWith('edu-reading-')?'generated':'existing source ID',measured};
    }finally{await p.close()}
   });
   await test(`R02 invalid fragment ${width}`,async()=>{
    const fragments=['not-a-heading','%E0%A4%A','%3Cimg%20src=x%20onerror=alert(1)%3E','edu-header'];const measured=[];
    for(const fragment of fragments){const p=await open(b,'/TCCN#'+fragment,width);try{
     assert.equal(await p.evaluate(()=>EduHeader.activeTab),'ch1');assert.deepEqual(p.errors,[]);
     await p.evaluate(()=>location.hash='another-unknown-heading');assert.equal(await p.evaluate(()=>EduHeader.activeTab),'ch1');assert.deepEqual(p.errors,[]);measured.push(fragment);
    }finally{await p.close()}}
    return {width,fragments:measured};
   });
   await test(`R03 HOME ${width}`,async()=>{
    const context=await b.newContext({hasTouch:true}),measured=[];
    try{for(const selector of ['#global-announcement button:not([aria-label])','#global-announcement button[aria-label]']){
     const p=await open(context,'/',width,width===320?740:844);try{
      const banner=p.locator('#global-announcement');assert(await banner.isVisible());
      // auth.js refreshes last_active_time on any user activity, including tap.
      const stableStorage=()=>JSON.stringify(Object.fromEntries(Object.entries({...localStorage}).filter(([key])=>key!=='last_active_time')));
      const storage=await p.evaluate(stableStorage);
      const m=await p.locator(selector).evaluate(e=>{const r=e.getBoundingClientRect(),svg=e.querySelector('svg')?.getBoundingClientRect();const title=document.querySelector('#global-announcement h3').getBoundingClientRect();return {width:r.width,height:r.height,icon:svg?{width:svg.width,height:svg.height}:null,overlap:!!e.getAttribute('aria-label')&&r.left<title.right&&r.right>title.left&&r.top<title.bottom&&r.bottom>title.top}});
      assert.equal(await p.evaluate(()=>innerWidth),width,'touch context uses requested viewport');
      assert(m.width>=44&&m.height>=44);assert(!m.overlap);if(m.icon)assert.deepEqual(m.icon,{width:16,height:16});
      await p.locator(selector).tap();await banner.waitFor({state:'hidden'});assert.equal(await p.evaluate(stableStorage),storage);
      await p.reload({waitUntil:'load'});assert(await banner.isVisible(),'original non-persistent dismissal still displays on reload');assert.deepEqual(p.errors,[]);measured.push({selector,...m,tap:'PASS',reload:'visible',storage:'stable keys unchanged; auth activity timestamp excluded'});
     }finally{await p.close()}
    }}finally{await context.close()}
    const signedOut=await open(b,'/',width);try{
     await signedOut.evaluate(()=>__firebaseTest.setUser(null));
     const buttons=await signedOut.locator('button:visible').evaluateAll(es=>es.map(e=>({text:e.textContent.trim().slice(0,50),width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})));
     assert(buttons.every(m=>m.width>=44&&m.height>=44),'all visible signed-out HOME buttons meet gate');
     return {route:'/',width,measured,signedOutButtons:buttons};
    }finally{await signedOut.close()}
   });
  }
  // Test every configured chapter via real chapter controls and validate every TOC target.
  for(const route of routes)for(const width of [320,390,768,1366])await test(`Shared TOC ${route} ${width}`,async()=>{
   const p=await open(b,route,width,width===320?740:width===768?1024:844),chapters=[];
   try{
    const ids=await p.evaluate(()=>EduHeader.config.chapters.map(c=>c.id));
    for(const tab of ids){
     await chooseTab(p,tab);
     const targets=await p.locator('#'+tab).evaluate(section=>[...section.querySelectorAll('.edu-chapter-toc a')].map(a=>{const h=document.getElementById(decodeURIComponent(a.hash.slice(1)));return {id:h?.id,valid:!!h&&section.contains(h)&&h.tagName==='H3',text:a.textContent===h?.textContent.trim()}}));
     assert(targets.every(t=>t.valid&&t.text));
     const anchors=[];
     for(const target of [targets[0],targets.at(-1)].filter((t,i,a)=>t&&a.findIndex(n=>n?.id===t.id)===i)){
      await p.locator('#'+tab).evaluate(section=>{section.querySelectorAll('details').forEach(d=>d.open=false);section.querySelector('.edu-chapter-toc').open=true});
      const link=p.locator(`#${tab} .edu-chapter-toc a[href="#${target.id}"]`);await link.focus();await p.keyboard.press('Enter');anchors.push(await bounds(p,target.id,tab));
     }
     chapters.push({tab,links:targets.length,anchors});
    }
    assert.deepEqual(p.errors,[]);return {route,width,chapters};
   }finally{await p.close()}
  });
  await test('R05 negative font and line-height controls',async()=>{
   const p=await open(b,'/NLKT',390);try{
    await p.locator('#ch1').evaluate(section=>{const fixture=document.createElement('section');fixture.id='font-negative-fixture';fixture.innerHTML='<p style="font-size:16px;line-height:1.7">Regression prose</p><p class="hint" style="font-size:15px;line-height:1.65">Regression note</p><span class="kicker" style="font-size:13px;line-height:1.5">Regression label</span>';section.append(fixture)});
    const fixture=p.locator('#font-negative-fixture'),good=await fixture.evaluate(measureReadingFonts);assert.equal(good.failures.length,0);assert.deepEqual(good.measurements.map(m=>m.role),['prose','note','label']);
    await fixture.evaluate(e=>[...e.children].forEach((n,i)=>n.style.setProperty('font-size',[12,14,12][i]+'px','important')));
    const small=await fixture.evaluate(measureReadingFonts);assert.equal(small.failures.length,3);
    await fixture.evaluate(e=>{[...e.children].forEach((n,i)=>{n.style.setProperty('font-size',[16,15,13][i]+'px','important');n.style.setProperty('line-height','1.1','important')})});
    const tight=await fixture.evaluate(measureReadingFonts);assert.equal(tight.failures.length,3);
    return {valid:good.measurements,smallFontRejected:small.failures,tightLineHeightRejected:tight.failures};
   }finally{await p.close()}
  });
 }finally{const browser=b.version();await b.close();fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({browser,source_commit:sourceCommit,sourceHashes,screenshots_enabled:false,results},null,2))}
 if(results.some(r=>r.status==='FAIL'))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
