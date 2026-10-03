// Audit every visible control and activate each handler family using real keyboard/touch events.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');const {open,evidence}=require('./handoff-browser.cjs');
const routes=['NLKT','KTTC','KTQT','NMLH','KTCTMLN','TCCN','NLTTTC','LTMQT','VHDDTKD','PTBV','STKN','TLUD'];
const out=path.join(evidence,'after/input-methods-final');fs.mkdirSync(out,{recursive:true});const results=[];
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{
 for(const width of [320,390,768,1366])for(const route of routes){
  const p=await open(b,'/'+route,width,width<768?844:1024);p.on('dialog',d=>d.accept());
  const row={route,width,controls:0,keyboard_activations:[],failures:[]};
  try{const ids=await p.evaluate(()=>EduHeader.config.chapters.map(c=>c.id));
   await p.keyboard.press('Tab');
   for(const id of ids){await p.evaluate(id=>EduHeader.switchTab(id,{scroll:false,animate:false}),id);
    await p.locator('#'+id).evaluate(s=>s.querySelectorAll('details').forEach(d=>d.open=true));
    const controls=await p.locator('#'+id).evaluate(s=>[...s.querySelectorAll('button,a[href],input,select,textarea,summary,[role=button],[onclick],[tabindex]')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('[inert],[aria-hidden=true]')&&!e.disabled).map((e,i)=>{
     e.dataset.inputAudit=String(i);return {index:i,tag:e.tagName,type:e.type||'',role:e.getAttribute('role'),tabIndex:e.tabIndex,text:e.textContent.trim().slice(0,80),handler:e.getAttribute('onclick')||'',keyboard:e.getAttribute('onkeydown')||'',class:e.className};
    }));
    const families=new Map();
    for(const control of controls){
     row.controls++;const e=p.locator('#'+id+` [data-input-audit="${control.index}"]`);
     if(control.tabIndex<0){row.failures.push({id,...control,error:'visible interactive control not in keyboard sequence'});continue}
     await e.focus();const state=await e.evaluate(e=>({focused:document.activeElement===e,outline:getComputedStyle(e).outlineStyle,width:parseFloat(getComputedStyle(e).outlineWidth)}));
     if(!state.focused)row.failures.push({id,...control,error:'cannot focus'});
     if(!['INPUT','SELECT','TEXTAREA'].includes(control.tag)&&!(state.width>=2&&state.outline!=='none'))row.failures.push({id,...control,error:'focus indicator missing',state});
     if(control.role==='region'){
      const before=await e.evaluate(e=>e.scrollLeft);await p.keyboard.press('ArrowRight');await p.waitForTimeout(50);
      const moved=await e.evaluate((e,before)=>e.scrollLeft>before,before);if(!moved)row.failures.push({id,...control,error:'keyboard did not scroll horizontal region'});
      await e.evaluate(e=>e.scrollLeft=0);
     }
     if(control.handler){const key=control.handler.replace(/(['"])[\s\S]*?\1/g,'ARG').replace(/\d+/g,'N');if(!families.has(key))families.set(key,control)}
    }
    for(const control of families.values()){
     await p.evaluate(id=>EduHeader.switchTab(id,{scroll:false,animate:false}),id);
     const e=p.locator('#'+id+` [data-input-audit="${control.index}"]`);
     if(!await e.count()){row.keyboard_activations.push({id,handler:control.handler,result:'DOM_REPLACED_BY_EARLIER_ACTION'});continue}
     const before=await e.evaluate(e=>{window.__inputAuditClicked=false;e.addEventListener('click',()=>window.__inputAuditClicked=true,{once:true});return e.outerHTML});
     await e.focus();await p.keyboard.press('Enter');
     const clicked=await p.evaluate(()=>window.__inputAuditClicked),changed=!await e.count()||before!==await e.evaluate(e=>e.outerHTML);
     row.keyboard_activations.push({id,handler:control.handler,clicked,changed});if(!clicked&&!changed)row.failures.push({id,...control,error:'Enter neither clicked nor changed state of clickable control'});
    }
   }
   assert.deepEqual(p.errors,[]);row.pass=!row.failures.length;console.log(row.pass?'PASS':'FAIL',route,width,row.controls,row.failures.length);
  }catch(e){row.pass=false;row.error=e.stack;console.error('FAIL',route,width,e.message)}finally{await p.close();results.push(row);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2))}
 }
}finally{await b.close()}if(results.some(r=>!r.pass))process.exitCode=1;})().catch(e=>{console.error(e);process.exitCode=1});
