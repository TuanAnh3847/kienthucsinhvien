const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{open,evidence}=require('./handoff-browser.cjs');
const out=path.join(evidence,'after/pyramid');fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true}),results=[];try{
 for(const width of [320,390,768,1366])for(const zoom of [100,200]){
  const p=await open(b,'/TLUD',width,width===768?1024:900),r={width,zoom,pass:false};
  try{
   await p.evaluate(()=>EduHeader.switchTab('ch1',{scroll:false,animate:false}));
   const card=p.locator('#ch1 .svg-card').filter({has:p.locator('.pyramid')});
   if(zoom===200)await card.evaluate(e=>{for(const n of e.querySelectorAll('*'))if([...n.childNodes].some(c=>c.nodeType===Node.TEXT_NODE&&c.textContent.trim())){const s=getComputedStyle(n),f=parseFloat(s.fontSize),l=parseFloat(s.lineHeight);n.style.fontSize=f*2+'px';if(Number.isFinite(l))n.style.lineHeight=l*2+'px'}});
   r.labels=await card.locator('.pyr').evaluateAll(es=>es.map(e=>{const range=document.createRange();range.selectNodeContents(e);const text=range.getBoundingClientRect(),box=e.getBoundingClientRect();return {text:e.textContent.trim(),width:box.width,textWidth:text.width,height:box.height,textHeight:text.height,font:parseFloat(getComputedStyle(e).fontSize)}}));
   assert.equal(r.labels.length,5);assert(r.labels.every(l=>l.width>=Math.min(width-100,6*l.font)&&l.textWidth<=l.width+2&&l.textHeight<=l.height+2&&l.textHeight<=3*l.font*1.65),'labels fit their hierarchy band without letter-by-letter wrapping');
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'document fits');
   await card.scrollIntoViewIfNeeded();const file=`TLUD_pyramid_${width}_${zoom}.png`;await card.screenshot({path:path.join(out,file)});r.evidence='evidence/after/pyramid/'+file;r.pass=true;console.log('PASS',width,zoom);
  }catch(e){r.error=e.stack;console.error('FAIL',width,zoom,e.message)}finally{await p.close();results.push(r);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2))}
 }
}finally{await b.close()}if(results.some(r=>!r.pass))process.exitCode=1;})().catch(e=>{console.error(e);process.exitCode=1});
