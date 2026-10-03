const {screenshot}=require('./qa-screenshot.cjs');
// Inspect all question boxes and capture the longest actual question/graded explanation per set.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');const {open,evidence}=require('./handoff-browser.cjs');const {readCSV}=require('./csv-records.cjs');
const rows=readCSV(path.join(evidence,'../checklists/PRACTICE-STATE-CHECKLIST.csv')).filter(r=>!process.env.PRACTICE_READING_ROUTES||process.env.PRACTICE_READING_ROUTES.split(',').includes(r.route));
const out=path.join(evidence,'after/practice-reading');fs.mkdirSync(out,{recursive:true});
const previous=process.env.PRACTICE_READING_ROUTES&&fs.existsSync(path.join(out,'results.json'))?JSON.parse(fs.readFileSync(path.join(out,'results.json'),'utf8')):[];
const results=previous.filter(r=>!process.env.PRACTICE_READING_ROUTES.split(',').includes(r.route));
async function boxes(p){return p.locator('[id^="q-"]').evaluateAll(es=>es.map(e=>{
 const bad=[];for(const n of e.querySelectorAll('p,button')){const r=document.createRange();r.selectNodeContents(n);const t=r.getBoundingClientRect(),b=n.getBoundingClientRect();if(t.width>b.width+2||t.height>b.height+2)bad.push(n.textContent.trim().slice(0,100))}
 return {id:e.id,height:e.getBoundingClientRect().height,bad};
}));}
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{
 const groups=new Map();for(const r of rows){const key=r.route+'@'+r.width;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r)}
 for(const group of groups.values()){const p=await open(b,group[0].route,+group[0].width,+group[0].width<768?844:1024);p.on('dialog',d=>d.accept());
  try{for(const r of group){const row={state_test_id:r.state_test_id,route:r.route,width:+r.width,set_id:r.set_id,pass:false,evidence:[]};
   try{const finance=r.route==='/TCCN-LuyenDe';await p.evaluate(({id,finance})=>{
    if(!finance){openSet(id);return}if(id.startsWith('chapter-'))startChapter(CHAPTERS[Number(id.slice(8))-1]);
    else if(id==='quick-20')startQuick20();else if(id==='weak-20'||id==='mistakes-populated'){setWrongIds(QUESTION_BANK.slice(0,8).map(q=>q.id));id==='weak-20'?startWeak20():startMistakes()}
    else startExam({'exam-1':0,'exam-2':1,'exam-3':2,'exam-applied':3,'exam-final-mix':4}[id]);
   },{id:r.set_id,finance});await p.waitForTimeout(60);
   if(r.kind==='GUIDED_CASE'){
    await p.getByRole('button',{name:'Xem / Ẩn lời giải',exact:true}).click();
    const file=r.state_test_id+'_solution.png';await screenshot(p.locator('#practice-panel'),{path:path.join(out,file)});row.evidence.push('evidence/after/practice-reading/'+file);
   }else{
    row.question_ids=await p.evaluate(finance=>(finance?currentSession:currentSet).questions.map(q=>q.id),finance);
    for(const state of ['open','graded']){
     if(state==='graded')await p.evaluate(finance=>{const qs=(finance?currentSession:currentSet).questions;qs.forEach((q,i)=>selectAnswer(q.id,i===0?q.answer:(q.answer+1)%q.options.length));if(finance){currentSession.showInstant?finishStudySession():submitSession(false)}else submitQuiz()},finance);
     await p.waitForTimeout(60);const all=await boxes(p);row[state+'_boxes']=all;assert.equal(all.length,row.question_ids.length);assert(all.every(q=>!q.bad.length),'question text exceeds card');
     const longest=[...all].sort((a,b)=>b.height-a.height)[0],file=r.state_test_id+'_'+state+'.png';
     await screenshot(p.locator('#'+longest.id),{path:path.join(out,file)});row.evidence.push('evidence/after/practice-reading/'+file);row[state+'_longest']=longest.id;
    }
   }assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(p.errors,[]);row.pass=true;console.log('PASS',r.state_test_id);
   }catch(e){row.error=e.stack;console.error('FAIL',r.state_test_id,e.message)}results.push(row);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));
  }}finally{await p.close()}
 }
}finally{await b.close()}if(results.some(r=>!r.pass))process.exitCode=1;})().catch(e=>{console.error(e);process.exitCode=1});
