const {screenshot}=require('./qa-screenshot.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {open,evidence}=require('./handoff-browser.cjs');
const out=path.join(evidence,'after/accessibility');fs.mkdirSync(out,{recursive:true});const results=[];
const theory=['NMLH','KTCTMLN','KTTC','NLKT','KTQT','TCCN','NLTTTC','LTMQT','VHDDTKD','PTBV','STKN','TLUD'];
const practice=['NhapMonLuatHoc','KTQT','LTMQT','NLTTTC','TCCN','NguyenLyKeToan'].map(s=>s+'-LuyenDe');
async function test(name,fn){try{results.push({name,pass:true,...await fn()});console.log('PASS',name)}catch(e){results.push({name,pass:false,error:e.stack});console.error('FAIL',name,e.message)}}
function contrast(a,b){const lum=s=>{const rgb=s.match(/[\d.]+/g).slice(0,3).map(Number).map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4});return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722};const l=[lum(a),lum(b)].sort((x,y)=>y-x);return (l[0]+.05)/(l[1]+.05)}
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 for(const route of theory)for(const width of [320,390,768,1366])await test(route+' keyboard, TOC, long header '+width,async()=>{
  const p=await open(browser,'/'+route,width,width<768?844:1024);try{
   await p.evaluate(()=>__firebaseTest.emit('settings/online_counter',{isAutoMode:false,min:1234,max:1234}));
   assert.equal(await p.locator('#online-count').innerText(),'1234');
   const ids=await p.evaluate(()=>EduHeader.config.chapters.map(c=>c.id));
   const picker=p.locator('#edu-chapter-picker');
   if(await picker.isVisible()){await picker.focus();await p.keyboard.press('End');await p.keyboard.press('Enter');await p.waitForTimeout(100);assert.equal(await picker.inputValue(),ids.at(-1));}
   else{const tab=p.locator(`[data-edu-tab="${ids.at(-1)}"]`);await tab.focus();await p.keyboard.press('Enter');}
   await p.waitForTimeout(100);assert(await p.locator('#'+ids.at(-1)).isVisible());
   const toc=p.locator('#'+ids.at(-1)+' .edu-chapter-toc');let anchor=null;
   if(await toc.count()){
    await toc.locator('summary').focus();await p.keyboard.press('Enter');
    const link=toc.locator('a').last();await link.focus();await p.keyboard.press('Enter');await p.waitForTimeout(100);
    anchor=await p.evaluate(()=>{const e=document.activeElement,h=document.querySelector('#edu-header');return {tag:e.tagName,top:e.getBoundingClientRect().top,header:h.getBoundingClientRect().bottom,id:e.id}});
    assert.match(anchor.tag,/H[1-6]/);assert(anchor.top>=anchor.header+16,'TOC target below visible header');
   }
   const bounds=await p.locator('#edu-header').evaluate(e=>({scroll:e.scrollWidth,width:e.clientWidth}));assert(bounds.scroll<=bounds.width+1,'long fixture header fits');
   const file=`${route}_${width}_header_keyboard.png`;await screenshot(p,{path:path.join(out,file)});
   assert.deepEqual(p.errors,[]);return {route,width,chapters:ids,anchor,header:bounds,online:1234,evidence:'evidence/after/accessibility/'+file};
  }finally{await p.close()}
 });
 for(const route of ['NhapMonLuatHoc','KTQT','LTMQT','NLTTTC'])await test(route+' finite numeric renderer boundaries',async()=>{
  const p=await open(browser,'/'+route+'-LuyenDe',390,844);try{
   const values=await p.evaluate(()=>[0,20,-1,1.25,null,undefined,NaN,Infinity].map(v=>({type:String(v),rendered:createElement('span','',v).textContent,normalized:safeText(v)})));
   assert.deepEqual(values.map(v=>v.rendered),['0','20','-1','1.25','','','','']);assert(values.every(v=>v.normalized===''));
   return {values};
  }finally{await p.close()}
 });
 for(const route of [...theory,...practice])await test(route+' contrast roles and reduced motion',async()=>{
  const p=await open(browser,'/'+route,390,844);try{
   const colors=await p.evaluate(()=>{
    const roles=['--edu-body','--edu-muted','--edu-heading','--edu-primary'];return roles.map(role=>{const e=document.createElement('span');e.textContent='Dấu tiếng Việt / English';e.style.color=`var(${role})`;e.style.backgroundColor='var(--edu-surface)';document.body.append(e);const c=getComputedStyle(e);const data={role,color:c.color,background:c.backgroundColor};e.remove();return data;});
   });for(const c of colors){c.ratio=contrast(c.color,c.background);assert(c.ratio>=4.5,JSON.stringify(c))}
   assert(await p.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches));
   const durations=await p.locator('.flip-inner,.flip-inner-local').evaluateAll(es=>es.map(e=>getComputedStyle(e).transitionDuration));assert(durations.every(d=>d.split(',').every(n=>parseFloat(n)<=.01)));
   return {colors,reduced_motion:true,flip_transition_durations:durations};
  }finally{await p.close()}
 });
 const context=await browser.newContext({hasTouch:true,viewport:{width:390,height:844},reducedMotion:'reduce'});
 try{for(const route of ['NLKT','NLTTTC','STKN','TLUD','VHDDTKD'])await test(route+' actual touch flip',async()=>{
  const p=await open(context,'/'+route,390,844);try{
   const ids=await p.evaluate(()=>EduHeader.config.chapters.map(c=>c.id));let tapped=0;
   for(const id of ids){await p.evaluate(id=>EduHeader.switchTab(id,{scroll:false,animate:false}),id);const card=p.locator('#'+id+' .flip-card,#'+id+' .flip-card-local').first();if(!await card.count())continue;
    await card.scrollIntoViewIfNeeded();const r=await card.boundingBox();assert(r.height>=44&&r.width>=44);const before=await card.getAttribute('class');await p.touchscreen.tap(r.x+r.width/2,r.y+Math.min(r.height/2,100));await p.waitForTimeout(30);assert.notEqual(await card.getAttribute('class'),before);tapped++;break;
   }assert(tapped>0);return {touch_taps:tapped};
  }finally{await p.close()}
 });}finally{await context.close()}
 for(const [width,height]of [[320,568],[390,844],[844,390],[768,1024]])await test('PTBV modal viewport '+width+'x'+height,async()=>{
  const p=await open(browser,'/PTBV',width,height);try{
   const trigger=p.locator('.course-map-fab');await trigger.focus();await p.keyboard.press('Enter');const modal=p.locator('#course-map-modal');assert(await modal.isVisible());
   const close=p.locator('.map-close');await close.focus();await p.keyboard.press('Shift+Tab');assert(await modal.evaluate(e=>e.contains(document.activeElement)));
   const body=p.locator('.map-card');await body.evaluate(e=>e.scrollTop=e.scrollHeight);assert(await body.evaluate(e=>e.scrollTop+e.clientHeight>=e.scrollHeight-1));
   const file=`PTBV_modal_${width}x${height}.png`;await screenshot(p,{path:path.join(out,file)});await p.keyboard.press('Escape');assert(!await modal.isVisible());assert(await trigger.evaluate(e=>document.activeElement===e));
   return {evidence:'evidence/after/accessibility/'+file};
  }finally{await p.close()}
 });
}finally{await browser.close();fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2))}if(results.some(r=>!r.pass))process.exitCode=1;})().catch(e=>{console.error(e);process.exitCode=1});
