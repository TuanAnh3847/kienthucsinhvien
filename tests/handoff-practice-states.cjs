const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {open,root,evidence}=require('./handoff-browser.cjs');
const {readCSV}=require('./csv-records.cjs');
const rows=readCSV(path.join(root,'docs/edu-connect-handoff-2026-10-03/checklists/PRACTICE-STATE-CHECKLIST.csv'));
const out=path.join(evidence,'after/practice-states');fs.mkdirSync(out,{recursive:true});const results=[];
async function openSet(page,row){
 await page.evaluate(({id,finance})=>{
  if(!finance){openSet(id);return;}
  if(id.startsWith('chapter-'))startChapter(CHAPTERS[Number(id.slice(8))-1]);
  else if(id==='quick-20')startQuick20();
  else if(id==='weak-20'){setWrongIds(QUESTION_BANK.slice(0,8).map(q=>q.id));startWeak20();}
  else if(id==='mistakes-populated'){setWrongIds(QUESTION_BANK.slice(0,8).map(q=>q.id));startMistakes();}
  else startExam({'exam-1':0,'exam-2':1,'exam-3':2,'exam-applied':3,'exam-final-mix':4}[id]);
 },{id:row.set_id,finance:row.route==='/TCCN-LuyenDe'});
}
(async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true});
 try{
  const groups=new Map();for(const row of rows){const key=row.route+'@'+row.width;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row);}
  for(const group of groups.values()){
   const p=await open(b,group[0].route,+group[0].width,+group[0].width===320?740:+group[0].width===768?1024:900);
   p.on('dialog',d=>d.accept());
   try{for(const row of group){
    const item={state_test_id:row.state_test_id,route:row.route,set_id:row.set_id,width:+row.width,tests:{},errors:[],fixture:'Firebase fixture; student@example.test; local storage isolated to browser context'};
    try{
     await openSet(p,row);
     if(row.kind==='GUIDED_CASE'){
      assert(await p.locator('#practice-panel').isVisible());
      assert(!await p.locator('#problem-solution').isVisible());
      await p.getByRole('button',{name:'Xem / Ẩn lời giải',exact:true}).click();assert(await p.locator('#problem-solution').isVisible());
      await p.getByRole('button',{name:'Xem / Ẩn lời giải',exact:true}).click();assert(!await p.locator('#problem-solution').isVisible());
      item.tests.solution_toggle='PASS';item.tests.autograde='N/A_GUIDED_SELF_COMPARISON';
     }else{
      const finance=row.route==='/TCCN-LuyenDe';
      const state=await p.evaluate(finance=>({questions:(finance?currentSession:currentSet).questions.map(q=>({id:q.id,answer:q.answer,options:q.options,explanation:q.explanation})),instant:finance&&currentSession.showInstant}),finance);
      item.question_ids=state.questions.map(q=>q.id);item.question_count=state.questions.length;
      assert.equal(new Set(item.question_ids).size,item.question_ids.length);
      if(/^\d+$/.test(row.question_count))assert.equal(item.question_count,+row.question_count);
      const q=state.questions[0],wrong=(q.answer+1)%q.options.length;
      await p.locator('#q-'+q.id+' button').nth(wrong).click();item.tests.wrong_selection='PASS';
      await p.evaluate(({id,answer})=>selectAnswer(id,answer),q);
      const selected=await p.evaluate(id=>selectedAnswers[id],q.id);
      assert.equal(selected,state.instant?wrong:q.answer);
      item.tests.change_answer=state.instant?'N/A_FIRST_ANSWER_LOCK_VERIFIED':'PASS';
      const submit=async()=>p.evaluate(finance=>{if(finance){if(currentSession.showInstant)finishStudySession();else submitSession(false);}else submitQuiz();},finance);
      await submit();assert(await p.locator('#result-box').isVisible());
      const result=await p.locator('#result-box').innerText();await submit();assert.equal(await p.locator('#result-box').innerText(),result);item.tests.repeat_submit='PASS';
      const answers=await p.evaluate(()=>JSON.stringify(selectedAnswers));await p.evaluate(({id,answer})=>selectAnswer(id,answer),{id:q.id,answer:wrong});assert.equal(await p.evaluate(()=>JSON.stringify(selectedAnswers)),answers);item.tests.post_submit_lock='PASS';
      const retry=async()=>p.evaluate(finance=>finance?restartCurrentSession():resetCurrentQuiz(),finance);
      await retry();assert(!await p.locator('#result-box').isVisible());assert.equal(await p.evaluate(()=>Object.keys(selectedAnswers).length),0);item.tests.retry_reset='PASS';
      await submit();assert.match(await p.locator('#result-box').innerText(),new RegExp('0/'+item.question_count));item.tests.unanswered_submit='PASS';
      await retry();
      await p.evaluate(finance=>{for(const q of (finance?currentSession:currentSet).questions)selectAnswer(q.id,q.answer);},finance);
      await submit();assert.match(await p.locator('#result-box').innerText(),/100%/);item.tests.correct_selection='PASS';item.tests.submit_score_explanation='PASS';
      for(const q of state.questions){const text=await p.locator('#q-'+q.id).innerText();assert(text.includes(q.explanation),q.id+' explanation missing');}
      if(row.kind==='MCQ_TIMER'){
       await retry();await p.evaluate(()=>{deadline=Date.now()-1000;tickTimer();tickTimer()});assert.match(await p.locator('#result-box').innerText(),/Hết giờ/);assert.equal(await p.evaluate(()=>timerInterval),null);item.tests.expiry='PASS';
      }else item.tests.expiry='N/A_NO_COUNTDOWN';
      await retry();
      await p.evaluate(()=>{window.__savedStorageGet=Storage.prototype.getItem;window.__savedStorageSet=Storage.prototype.setItem;Storage.prototype.getItem=Storage.prototype.setItem=()=>{throw new DOMException('Blocked','SecurityError')}});
      await submit();assert(await p.locator('#result-box').isVisible());await retry();assert(!await p.locator('#result-box').isVisible());
      await p.evaluate(()=>{Storage.prototype.getItem=window.__savedStorageGet;Storage.prototype.setItem=window.__savedStorageSet});item.tests.storage_failure='PASS';
     }
     assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'practice page overflow');item.tests.open_and_long_text='AUTOMATED_LAYOUT_PASS_VISUAL_PENDING';
     assert.deepEqual(p.errors,[]);item.automated_status='PASS';
     if(row===group[0]||row.kind==='GUIDED_CASE'||row.set_id==='exam-final-mix'){
      const image=row.state_test_id+'.png';await p.screenshot({path:path.join(out,image),fullPage:true});item.evidence='evidence/after/practice-states/'+image;
     }else item.evidence='evidence/after/practice-states/results.json#'+row.state_test_id;
    }catch(error){item.automated_status='FAIL';item.errors.push(error.message);console.error('FAIL',row.state_test_id,error.message);}
    results.push(item);console.log('STATE',row.state_test_id,item.automated_status);
   }}finally{await p.close();}
   fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({browser:b.version(),results},null,2));
  }
 }finally{await b.close();}
 if(results.some(r=>r.automated_status!=='PASS'))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
