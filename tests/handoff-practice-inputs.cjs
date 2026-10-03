const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');const {open,evidence}=require('./handoff-browser.cjs');
const {readCSV}=require('./csv-records.cjs');
const rows=readCSV(path.join(evidence,'../checklists/PRACTICE-STATE-CHECKLIST.csv'));
const routes=[...new Set(rows.map(r=>r.route))],out=path.join(evidence,'after/practice-inputs');fs.mkdirSync(out,{recursive:true});
async function activate(p,button,method,key='Enter'){
 await button.evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}));
 if(method==='touch'){const cdp=await p.context().newCDPSession(p),b=await button.boundingBox();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach()}
 else{await button.focus();await p.keyboard.press(key)}
 await p.waitForTimeout(80);
}
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true}),results=[];try{
 for(const route of routes)for(const width of [320,390])for(const method of ['keyboard','touch']){
  const p=await open(browser,route,width,844),r={route,width,method,pass:false,evidence:[]};p.on('dialog',d=>d.accept());try{
   const finance=route==='/TCCN-LuyenDe',set=rows.find(r=>r.route===route&&r.kind!=='GUIDED_CASE').set_id;
   await p.evaluate(({finance,set})=>finance?startExam(0):openSet(set),{finance,set});
   const qs=await p.evaluate(finance=>(finance?currentSession:currentSet).questions.map(q=>({id:q.id,answer:q.answer,n:q.options.length})),finance);
   for(let i=0;i<2;i++){const q=qs[i],index=i===0?q.answer:(q.answer+1)%q.n;await activate(p,p.locator('#q-'+q.id+' button').nth(index),method,i===0?'Enter':'Space');assert.equal(await p.locator('#q-'+q.id+' button').nth(index).getAttribute('aria-pressed'),'true')}
   await p.evaluate(finance=>{(finance?currentSession:currentSet).questions.slice(2).forEach(q=>selectAnswer(q.id,(q.answer+1)%q.options.length))},finance);
   await activate(p,p.getByRole('button',{name:/^Nộp bài/}).first(),method);
   assert(await p.evaluate(finance=>finance?sessionSubmitted:lastScore!==null,finance));
   assert(await p.locator('[id^="q-"] button').evaluateAll(es=>es.every(e=>e.disabled)));
   for(let i=0;i<2;i++){const file=`${route.slice(1)}_${width}_${method}_${i===0?'correct':'wrong'}.png`;await p.locator('#q-'+qs[i].id).screenshot({path:path.join(out,file)});r.evidence.push('evidence/after/practice-inputs/'+file)}
   r.contrast=await p.evaluate(require('./handoff-contrast-measure.cjs'));assert.deepEqual(r.contrast.failures,[],'graded state contrast');
   await activate(p,p.getByRole('button',{name:/^Làm lại/}).first(),method);
   assert(await p.evaluate(finance=>finance?!sessionSubmitted:lastScore===null,finance));assert.equal(await p.locator('[id^="q-"] button[aria-pressed="true"]').count(),0);
   assert.deepEqual(p.errors,[]);r.pass=true;console.log('PASS',route,width,method);
  }catch(e){r.error=e.stack;console.error('FAIL',route,width,method,e.message)}finally{await p.close();results.push(r);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2))}
 }
}finally{await browser.close()}if(results.some(r=>!r.pass))process.exitCode=1})().catch(e=>{console.error(e);process.exitCode=1});
