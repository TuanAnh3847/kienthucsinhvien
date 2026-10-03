const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');const {open,evidence}=require('./handoff-browser.cjs');
const out=path.join(evidence,'after/practice-header');fs.mkdirSync(out,{recursive:true});const results=[];
async function test(name,fn){try{results.push({name,pass:true,...await fn()});console.log('PASS',name)}catch(e){results.push({name,pass:false,error:e.stack});console.error('FAIL',name,e.message)}}
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{
 for(const route of ['NhapMonLuatHoc','KTQT','LTMQT','NLTTTC','TCCN','NguyenLyKeToan'].map(r=>'/'+r+'-LuyenDe')){
  const p=await open(b,route,390,844);try{for(const width of [320,390,768,1279,1280,1366])await test(route+' long account / online 1234 / navigation '+width,async()=>{
   await p.setViewportSize({width,height:width<768?844:900});await p.evaluate(()=>__firebaseTest.emit('settings/online_counter',{isAutoMode:false,min:1234,max:1234}));
   assert.equal(await p.locator('#online-count').innerText(),'1234');const picker=p.locator('#mobile-nav');
   if(await picker.isVisible()){await picker.focus();await p.keyboard.press('End');await p.keyboard.press('Enter');}
   else{await p.locator('#nav-menu button').last().focus();await p.keyboard.press('Enter');}
   const last=await picker.locator('option').last().getAttribute('value');assert.equal(await picker.inputValue(),last);assert(await p.locator('#'+last).isVisible());
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   const file=route.slice(1)+'_'+width+'.png';await p.screenshot({path:path.join(out,file)});return {width,last,evidence:'evidence/after/practice-header/'+file};
  });}finally{await p.close()}
 }
 for(const width of [390,1366])await test('TCCN real interval expiry '+width,async()=>{
  const p=await open(b,'/TCCN-LuyenDe',width,900);p.on('dialog',d=>d.accept());try{
   const started=Date.now();await p.evaluate(()=>{startExam(0);deadline=Date.now()+1800});
   await p.waitForFunction(()=>document.getElementById('result-box').textContent.includes('Hết giờ'),null,{timeout:7000});
   const elapsed=Date.now()-started;assert(elapsed>=1700&&elapsed<7000);assert.equal(await p.evaluate(()=>getAttempts().length),1);assert.equal(await p.evaluate(()=>timerInterval),null);
   await p.waitForTimeout(1200);assert.equal(await p.evaluate(()=>getAttempts().length),1);await p.evaluate(()=>restartCurrentSession());assert(!await p.locator('#result-box').isVisible());
   return {width,elapsed_ms:elapsed,attempts:1,real_interval:true};
  }finally{await p.close()}
 });
}finally{await b.close();fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2))}if(results.some(r=>!r.pass))process.exitCode=1;})().catch(e=>{console.error(e);process.exitCode=1});
