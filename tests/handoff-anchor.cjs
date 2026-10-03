const {screenshot}=require('./qa-screenshot.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');const {open,evidence}=require('./handoff-browser.cjs');
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true}),out=path.join(evidence,'after/anchor');fs.mkdirSync(out,{recursive:true});const rows=[];try{for(const width of [320,390,768,1366]){const p=await open(b,'/TCCN',width);try{
 const anchor=p.getByText('ANCHOR',{exact:true}),stage=anchor.locator('..');
 const labels=await stage.evaluate(e=>[...e.children].map(n=>{const r=document.createRange();r.selectNodeContents(n);const text=r.getBoundingClientRect(),box=n.getBoundingClientRect();return{value:n.textContent.trim(),font:parseFloat(getComputedStyle(n).fontSize),width:box.width,height:box.height,textWidth:text.width,textHeight:text.height}}));
 assert.equal(labels[0].value,'ANCHOR');assert(labels[0].textHeight<=labels[0].font*1.5+2,'ANCHOR must read as one word');assert(labels.every(l=>l.textWidth<=l.width+2&&l.textHeight<=l.height+2));
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth),width);
 const file='TCCN_anchor_'+width+'.png';await screenshot(stage,{path:path.join(out,file)});rows.push({width,pass:true,labels,evidence:'evidence/after/anchor/'+file});console.log('PASS',width);
 }finally{await p.close()}}}finally{await b.close()}fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(rows,null,2))})().catch(e=>{console.error(e);process.exitCode=1});
