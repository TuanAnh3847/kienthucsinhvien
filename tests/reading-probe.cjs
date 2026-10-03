const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const {open,evidence}=require('./handoff-browser.cjs');
(async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true});
 fs.mkdirSync(path.join(evidence,'after'),{recursive:true});
 try { for (const route of ['/KTTC','/LTMQT','/TLUD']) {
  const p=await open(b,route,320,740);
  if(route==='/KTTC') await p.evaluate(()=>{EduHeader.switchTab('ch3',{scroll:false,animate:false});document.querySelectorAll('#ch3 details').forEach(d=>d.open=true)});
  console.log(route,JSON.stringify(await p.evaluate(()=>[...document.querySelectorAll('main *')].filter(e=>{
    const r=e.getBoundingClientRect();if(!r.width||r.right<=innerWidth+1)return false;
    for(let a=e.parentElement;a&&a!==document.body;a=a.parentElement)if(/auto|scroll/.test(getComputedStyle(a).overflowX))return false;
    return true;
  }).map(e=>({tag:e.tagName,id:e.id,cls:String(e.className).slice(0,110),text:e.textContent.slice(0,110),right:e.getBoundingClientRect().right,font:getComputedStyle(e).fontSize})).slice(0,20))));
  if(route==='/LTMQT') {
   await p.evaluate(()=>EduHeader.switchTab('ch2',{behavior:'instant',animate:false}));
   console.log('LTMQT text bounds',JSON.stringify(await p.evaluate(()=>{
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);const bad=[];
    while(walker.nextNode()){
     const n=walker.currentNode,e=n.parentElement;if(!e||!n.textContent.trim()||e.closest('script,style,[aria-hidden="true"]'))continue;
     let scroll=false;for(let a=e;a&&a!==document.body;a=a.parentElement)if(/auto|scroll/.test(getComputedStyle(a).overflowX)){scroll=true;break;}
     if(scroll)continue;const range=document.createRange();range.selectNode(n);
     for(const r of range.getClientRects())if(r.width&&r.right>innerWidth+1)bad.push({text:n.textContent.slice(0,120),parent:e.className,right:r.right});
    }return {width:document.documentElement.scrollWidth,bad};
   })));
  }
  await p.screenshot({path:path.join(evidence,'after',`${route.slice(1)}_ch1_320_probe.png`),fullPage:true});
  if(route==='/STKN') {await p.evaluate(()=>EduHeader.switchTab('ch3',{scroll:false,animate:false}));await p.screenshot({path:path.join(evidence,'after','STKN_ch3_320_probe.png'),fullPage:true});}
  await p.close();
 }}finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
