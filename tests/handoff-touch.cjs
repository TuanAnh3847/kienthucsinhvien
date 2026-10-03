const {screenshot}=require('./qa-screenshot.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');const {open,evidence}=require('./handoff-browser.cjs');
const routes=['NLKT','KTTC','KTQT','NMLH','KTCTMLN','TCCN','NLTTTC','LTMQT','VHDDTKD','PTBV','STKN','TLUD'].filter(r=>!process.env.TOUCH_ROUTES||process.env.TOUCH_ROUTES.split(',').includes(r));
const out=path.join(evidence,'after/touch');fs.mkdirSync(out,{recursive:true});
const previous=process.env.TOUCH_ROUTES&&fs.existsSync(path.join(out,'results.json'))?JSON.parse(fs.readFileSync(path.join(out,'results.json'),'utf8')):[];
const results=previous.filter(r=>!process.env.TOUCH_ROUTES?.split(',').includes(r.route));
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{
 for(const width of [320,390,768,1366]){const context=await b.newContext({hasTouch:true,isMobile:true,reducedMotion:'reduce',viewport:{width,height:width<768?844:1024}});
  try{for(const route of routes){const p=await open(context,'/'+route,width);p.on('dialog',d=>d.accept());const row={route,width,cards:0,disclosures:0,button_families:0,evidence:[],pass:false};
   try{const ids=await p.evaluate(()=>EduHeader.config.chapters.map(c=>c.id));for(const id of ids){
    await p.evaluate(id=>EduHeader.switchTab(id,{scroll:false,animate:false}),id);
    const cards=p.locator('#'+id+' .flip-card,#'+id+' .flip-card-local,#'+id+' .study-flip');
    const sizes=await cards.evaluateAll(es=>es.map((e,index)=>({index,height:e.getBoundingClientRect().height})));const longest=[...sizes].sort((a,b)=>b.height-a.height)[0]?.index;
    for(let i=0;i<sizes.length;i++){const card=cards.nth(i),before=await card.getAttribute('class');await card.tap();await p.waitForTimeout(25);assert.notEqual(await card.getAttribute('class'),before,'touch did not flip');
     if(i===longest){await card.evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}));await p.waitForTimeout(700);const file=`${route}_${id}_${width}_back.png`;await screenshot(card,{path:path.join(out,file)});row.evidence.push('evidence/after/touch/'+file)}
     await card.tap();assert.equal(await card.getAttribute('class'),before);row.cards++;
    }
    const disclosures=p.locator('#'+id+' details > summary');for(let i=0;i<await disclosures.count();i++){const s=disclosures.nth(i),before=await s.evaluate(e=>e.parentElement.open);await s.evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}));await p.waitForTimeout(160);await s.tap();assert.notEqual(await s.evaluate(e=>e.parentElement.open),before);await s.evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}));await p.waitForTimeout(160);await s.tap();assert.equal(await s.evaluate(e=>e.parentElement.open),before);row.disclosures++}
    const families=await p.locator('#'+id+' button[onclick]').evaluateAll(es=>{const found=new Map();for(const e of es.filter(e=>e.getClientRects().length&&!e.disabled)){const handler=e.getAttribute('onclick'),key=handler.replace(/(['"])[\s\S]*?\1/g,'ARG').replace(/\d+/g,'N');if(!found.has(key)){const n=found.size;e.dataset.touchAudit=String(n);found.set(key,{index:n,handler})}}return [...found.values()]});
    for(const f of families){await p.evaluate(id=>EduHeader.switchTab(id,{scroll:false,animate:false}),id);const e=p.locator('#'+id+` [data-touch-audit="${f.index}"]`);if(!await e.count())continue;await e.tap();row.button_families++}
   }assert.deepEqual(p.errors,[]);row.pass=true;console.log('PASS',route,width,row.cards,row.button_families);
   }catch(e){row.error=e.stack;console.error('FAIL',route,width,e.message)}finally{await p.close();results.push(row);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2))}
  }}finally{await context.close()}
 }
}finally{await b.close()}if(results.some(r=>!r.pass))process.exitCode=1;})().catch(e=>{console.error(e);process.exitCode=1});
