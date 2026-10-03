const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const {open,root,evidence}=require('./handoff-browser.cjs');
const {readCSV}=require('./csv-records.cjs');
const {capture}=require('./handoff-capture-page.cjs');
const {measureReadingFonts}=require('./reading-font-gate.cjs');
const {createHash}=require('node:crypto');
const sourceCommit=require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8',windowsHide:true}).trim();
const rows=readCSV(path.join(root,'docs/edu-connect-handoff-2026-10-03/checklists/RENDER-COVERAGE-416.csv'));
const output=process.env.RENDER_OUTPUT ? path.resolve(root,process.env.RENDER_OUTPUT) : path.join(evidence,'after/render');fs.mkdirSync(output,{recursive:true});
const shard=process.env.RENDER_SHARD===undefined?null:+process.env.RENDER_SHARD,shards=+(process.env.RENDER_SHARDS||2);
const resultsFile=path.join(output,shard===null?'results.json':`results-shard-${shard}.json`);
const old=process.env.RENDER_FILTER && fs.existsSync(path.join(output,'results.json')) ? JSON.parse(fs.readFileSync(path.join(output,'results.json'),'utf8')) : null;
const previous=old ? old.results.map(r=>({...r,tested_source_hashes:r.tested_source_hashes||old.source_hashes})) : [];
const results=previous.filter(r=>!process.env.RENDER_FILTER.split(',').includes(r.route));
const sourceHashes=Object.fromEntries(fs.readdirSync(root).filter(f=>/\.html$/.test(f)||['reading.css','reading.js','edu-header.js','edu-study.js','shared.css'].includes(f)).map(f=>[f,createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex')]));
(async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true});
 try{
  // Reuse one page per route/viewport; every configured state runs the gates.
  const groups=new Map();for(const row of rows){const key=row.route+'@'+row.width;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row);}
  let groupIndex=0;for(const group of groups.values()){
   if(shard!==null&&groupIndex++%shards!==shard)continue;
   if(process.env.RENDER_FILTER && !process.env.RENDER_FILTER.split(',').includes(group[0].route))continue;
   const p=await open(b,group[0].route,+group[0].width,+group[0].height);
   try{
    for(const row of group){
     if(row.kind==='THEORY') await p.evaluate(id=>EduHeader.switchTab(id,{behavior:'instant',animate:false}),row.state);
     let actualState=row.state;
     if(row.kind==='PRACTICE') {
      actualState=await p.locator('#mobile-nav').evaluate((el,label)=>{
       const id={'Tổng quan':'overview','Theo chương':'chapter','Trắc nghiệm':'quiz','Luyện đề':'practice','Test 20 câu':'quick','Luyện thi':'exam','Câu sai':'mistakes'}[label] || label;
       const option=[...el.options].find(o=>o.value===id || o.textContent.trim()===label || o.textContent.trim()===label.replace(/^\d+\.\s*/,''));
       if(!option)throw Error('Missing practice state '+label+'; options: '+[...el.options].map(o=>o.textContent.trim()));
       el.value=option.value;el.dispatchEvent(new Event('change',{bubbles:true}));return option.value;
      },row.state);
     }
     await p.waitForTimeout(100);
     const section=row.kind==='HOME'?'body':`#${actualState}`;
     const text=await p.locator(section).innerText();
     // Exercise disclosures, both card faces, and intentional horizontal wrappers.
     const interactions=await p.locator(section).evaluate(section=>{
      let details=0,faces=0,scrolls=0;
      section.querySelectorAll('details').forEach(d=>{d.open=true;details++;});
      section.querySelectorAll('.flip-card,.flip-card-local,.study-flip,.flashcard,.flash-card').forEach(c=>{c.click();c.click();faces++;});
      section.querySelectorAll('.scroll-table,.timeline,.table-wrap,.emotion-7,.graph-shell').forEach(w=>{if(w.scrollWidth>w.clientWidth+2){w.scrollLeft=w.scrollWidth;scrolls++;w.scrollLeft=0;}});
      return {details,faces,scrolls};
     });
     await p.waitForTimeout(100);
     await p.evaluate(()=>window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
     await p.waitForTimeout(60);
     const metrics=await p.locator(section).evaluate(section=>{
      const visible=e=>e.getClientRects().length && getComputedStyle(e).visibility!=='hidden';
      const tiny=[...section.querySelectorAll('p,.chapter-objective,.module-heading p,.section-head p')].filter(visible).filter(e=>parseFloat(getComputedStyle(e).fontSize)<14).map(e=>({text:e.textContent.trim().slice(0,100),class:e.className,font:getComputedStyle(e).fontSize}));
      const clipped=[];
      for(const face of section.querySelectorAll('.flip-face,.flip-front,.flip-back,.study-flip-face')){
       if(!visible(face))continue;
       const range=document.createRange();range.selectNodeContents(face);const tr=range.getBoundingClientRect(),r=face.getBoundingClientRect();
       if(tr.height>r.height+3)clipped.push({text:face.textContent.trim().slice(0,100),textHeight:tr.height,height:r.height});
      }
      const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
      const smallButtons=[...section.querySelectorAll('button')].filter(visible).filter(e=>{const r=e.getBoundingClientRect();return r.width<43.9||r.height<43.9}).map(e=>({text:e.textContent.slice(0,80),width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}));
      const splitNumbers=[...section.querySelectorAll('.edu-number-cell')].filter(visible).filter(e=>{const range=document.createRange();range.selectNodeContents(e);return range.getBoundingClientRect().height>parseFloat(getComputedStyle(e).lineHeight)+2}).map(e=>e.textContent.trim());
      return {width:innerWidth,documentWidth:document.documentElement.scrollWidth,height:section.scrollHeight,tiny,clipped,smallButtons,splitNumbers,duplicateIds:ids.filter((id,i)=>ids.indexOf(id)!==i),heading:section.querySelector('h2')?.textContent.trim()};
     });
     await p.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
     metrics.fonts=await p.locator(section).evaluate(measureReadingFonts);
     const screenshot=row.coverage_id+'.png';
     const captured=await capture(p,path.join(output,screenshot),+row.width);
     const failures=[];
     if(metrics.documentWidth>metrics.width+1)failures.push('document overflow');
     if(metrics.clipped.length)failures.push('flashcard text bounds exceed face');
     if(metrics.duplicateIds.length)failures.push('duplicate IDs');
     if(metrics.splitNumbers.length)failures.push('numeric table token split across lines');
     if(metrics.smallButtons.length)failures.push('buttons below 44px');
     if(metrics.fonts.failures.length)failures.push('reading font/line-height below role requirements');
     if(p.errors.length)failures.push('runtime errors');
     if(/\$\\(?:to|rightarrow|times)|\$[Wm]\$|�|â€|'\+formula\(/.test(text))failures.push('raw notation or broken encoding');
     results.push({coverage_id:row.coverage_id,route:row.route,state:row.state,width:+row.width,height:+row.height,tested_source_hashes:sourceHashes,automated_status:failures.length?'FAIL':'PASS',full_body_visual_review:process.env.QA_SCREENSHOTS==='1'?'PENDING':'NOT_REQUESTED',failures,metrics,interactions,capture:captured,errors:[...p.errors],evidence:process.env.QA_SCREENSHOTS==='1'?path.relative(root,path.join(output,screenshot)):null});
     console.log([failures.length?'FAIL':'RENDER',row.coverage_id,failures.join(';'),metrics.tiny.length?'small prose:'+metrics.tiny.length:''].filter(Boolean).join(' '));
     await p.locator(section).evaluate(section=>section.querySelectorAll('details').forEach(d=>d.open=false));
    }
   }finally{await p.close();}
   fs.writeFileSync(resultsFile,JSON.stringify({browser:b.version(),source_commit:sourceCommit,screenshots_enabled:process.env.QA_SCREENSHOTS==='1',source_hashes:sourceHashes,source_provenance:'Each row records the exact source hashes measured; filtered reruns retain earlier provenance for unaffected rows.',shard,shards,results},null,2));
  }
 }finally{await b.close();}
 if(results.some(r=>r.failures.length))process.exitCode=1;
})().catch(e=>{console.error(e);fs.writeFileSync(resultsFile,JSON.stringify({error:e.stack,results},null,2));process.exitCode=1});
