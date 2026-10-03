const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{root,routes}=require('./handoff-browser.cjs');
const {measureReadingFonts}=require('./reading-font-gate.cjs');
const fixture=fs.readFileSync(path.join(__dirname,'firebase-fixture.js'),'utf8');
const results=[];
const sourceCommit=require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8',windowsHide:true}).trim();
// Browser preference, not CSS font multiplication or pinch/pageScaleFactor.
// Chromium's default storage partition key is "x" (empty relative path).
// https://chromium.googlesource.com/chromium/src/+/lkgr/chrome/browser/ui/zoom/chrome_zoom_level_prefs.cc
async function launch(factor){
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'edu-review-zoom-'));
 fs.mkdirSync(path.join(profile,'Default'));
 fs.writeFileSync(path.join(profile,'Default/Preferences'),JSON.stringify({partition:{default_zoom_level:{x:Math.log(factor)/Math.log(1.2)}}}));
 const context=await chromium.launchPersistentContext(profile,{channel:'msedge',headless:true,viewport:null,args:['--window-size=1366,900']});
 await context.addInitScript(()=>window.__fixtureOptions={user:{uid:'zoom-fixture',displayName:'Sinh viên kiểm zoom',email:'zoom@example.test'}});
 await context.route(/https:\/\/www\.gstatic\.com\/firebasejs\/.+\.js/,r=>r.fulfill({contentType:'text/javascript',body:r.request().url().includes('firebase-app-compat')?fixture:''}));
 await context.route(/firebaseio\.com|firebasedatabase\.app|firestore\.googleapis\.com|identitytoolkit\.googleapis\.com/,r=>r.abort());
 return {context,profile};
}
async function cleanup(session){
 await session.context.close();
 const target=path.resolve(session.profile),temp=path.resolve(os.tmpdir())+path.sep;
 if(!target.startsWith(temp)||!path.basename(target).startsWith('edu-review-zoom-'))throw Error('Unexpected temporary profile path');
 fs.rmSync(target,{recursive:true,force:true});
}
(async()=>{
 const normal=await launch(1),zoomed=await launch(2);
 try{
  const base=await normal.context.newPage();await base.goto('http://127.0.0.1:4173/NLKT');await base.evaluate(()=>document.fonts.ready);
  const baseline=await base.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,font:parseFloat(getComputedStyle(document.querySelector('.chapter-objective')).fontSize)}));await base.close();
  for(const route of [...routes,'/','/NLKT#edu-reading-ch1-4','/KTTC#edu-reading-review-1','/TCCN#edu-reading-ch5-1',...['NhapMonLuatHoc','KTQT','LTMQT','NLTTTC','TCCN','NguyenLyKeToan'].map(r=>'/'+r+'-LuyenDe')]){
   const p=await zoomed.context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
   const row={route,status:'FAIL'};
   try{
    await p.goto('http://127.0.0.1:4173'+route,{waitUntil:'load'});await p.evaluate(()=>document.fonts.ready);
    await p.waitForTimeout(150);
    const metrics=await p.evaluate(()=>({width:innerWidth,documentWidth:document.documentElement.scrollWidth,dpr:devicePixelRatio,pinchScale:visualViewport.scale,font:document.querySelector('.chapter-objective')?parseFloat(getComputedStyle(document.querySelector('.chapter-objective')).fontSize):null}));
    Object.assign(row,{baseline,metrics});
    assert(Math.abs(metrics.dpr/baseline.dpr-2)<.01,'devicePixelRatio must double at browser zoom');
    assert(Math.abs(metrics.width*2-baseline.width)<=2,'layout viewport must halve');assert.equal(metrics.pinchScale,1,'no pinch zoom');
    if(metrics.font!==null)assert.equal(metrics.font,baseline.font,'computed font unchanged');
    assert(metrics.documentWidth<=metrics.width+1,'no document overflow');
    const section=await p.evaluate(()=>window.EduHeader?'#'+EduHeader.activeTab:document.body.classList.contains('edu-home-page')?'body':'#overview');
    row.fonts=await p.locator(section).evaluate(measureReadingFonts);assert.deepEqual(row.fonts.failures,[]);
    if(route.includes('#')){
     const id=route.split('#')[1];await p.waitForFunction(id=>document.activeElement?.id===id,id);
     row.anchor=await p.evaluate(id=>({active:EduHeader.activeTab,picker:document.querySelector('#edu-chapter-picker').value,focus:document.activeElement.id,top:document.getElementById(id).getBoundingClientRect().top,header:document.querySelector('#edu-header').getBoundingClientRect().bottom}),id);
     assert.equal(row.anchor.active,row.anchor.picker);assert.equal(row.anchor.focus,id);assert(row.anchor.top>=row.anchor.header+23);
    }
    assert.deepEqual(errors,[]);row.status='PASS';console.log('PASS actual browser zoom 200%',route,metrics.width,metrics.dpr);
   }catch(e){row.error=e.stack;console.error('FAIL actual browser zoom',route,e.message)}finally{await p.close();results.push(row)}
  }
 }finally{
  const browser=zoomed.context.browser().version();await cleanup(normal);await cleanup(zoomed);
  fs.writeFileSync(path.join(root,'docs/edu-connect-handoff-2026-10-03/independent-review/browser-zoom.json'),JSON.stringify({browser,source_commit:sourceCommit,method:'Edge browser preference default zoom factor 2; verified by doubled DPR, halved layout viewport, unchanged computed font, visualViewport.scale=1',screenshots_enabled:false,results},null,2));
 }
 if(results.some(r=>r.status==='FAIL'))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
