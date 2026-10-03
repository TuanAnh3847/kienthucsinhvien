const {screenshot}=require('./qa-screenshot.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');const {open,evidence}=require('./handoff-browser.cjs');
const out=path.join(evidence,process.env.ZOOM_DIAGRAMS?'after/diagram-zoom':'after/zoom');fs.mkdirSync(out,{recursive:true});
const previous=process.env.ZOOM_ROUTES&&fs.existsSync(path.join(out,'results.json'))?JSON.parse(fs.readFileSync(path.join(out,'results.json'),'utf8')):[];
const results=previous.filter(r=>!process.env.ZOOM_ROUTES.split(',').includes(r.route));
const cases=process.env.ZOOM_DIAGRAMS?[['STKN','ch7'],['STKN','ch3'],['VHDDTKD','ch1'],['VHDDTKD','ch3'],['LTMQT','ch5'],['TLUD','ch1']]:[['NLKT','ch1'],['KTTC','review'],['KTQT','ch5'],['NMLH','ch5'],['KTCTMLN','ch2'],['TCCN','ch5'],['NLTTTC','ch2'],['LTMQT','ch1'],['VHDDTKD','ch2'],['PTBV','ch2'],['STKN','ch6'],['TLUD','ch7']];
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{
 for(const [route,tab]of cases.filter(([route])=>!process.env.ZOOM_ROUTES||process.env.ZOOM_ROUTES.split(',').includes(route)))for(const width of [320,390,768]){
  const record={route,tab,width,method:'200% text size and computed line metrics in reading content and chapter controls; SVG coordinates unchanged',pass:false};const p=await open(b,'/'+route,width,width===768?1024:844);
  try{
   await p.evaluate(id=>EduHeader.switchTab(id,{scroll:false,animate:false}),tab);
   record.text_nodes=await p.evaluate(id=>{
    const section=document.getElementById(id),nodes=[...section.querySelectorAll('*'),...document.querySelectorAll('#edu-chapter-picker,#nav-menu button')].filter(e=>!e.closest('svg') && (e.matches('select')||[...e.childNodes].some(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim())));
    const original=nodes.map(e=>{const style=getComputedStyle(e);return [e,parseFloat(style.fontSize),parseFloat(style.lineHeight)]});original.forEach(([e,size,line])=>{e.style.fontSize=(size*2)+'px';if(Number.isFinite(line))e.style.lineHeight=(line*2)+'px'});window.dispatchEvent(new Event('resize'));return original.length;
   },tab);await p.waitForTimeout(150);
   record.document_width=await p.evaluate(()=>document.documentElement.scrollWidth);if(record.document_width>width+1)record.overflow=await p.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>e.getClientRects().length&&e.getBoundingClientRect().right>innerWidth+1&&!e.closest('.edu-scroll-region')).map(e=>({tag:e.tagName,class:e.className,text:e.textContent.trim().slice(0,70),right:e.getBoundingClientRect().right,width:e.getBoundingClientRect().width})).slice(0,25));assert(record.document_width<=width+1,'page overflow at 200% text');
   record.clipped=await p.locator('#'+tab).evaluate(section=>{
    const bad=[];for(const e of section.querySelectorAll('p,.flip-face,.flip-front,.flip-back')){
     if(!e.getClientRects().length||getComputedStyle(e).visibility==='hidden')continue;
     const range=document.createRange();range.selectNodeContents(e);const text=range.getBoundingClientRect(),box=e.getBoundingClientRect();
     if(text.width>box.width+3||text.height>box.height+3)bad.push({text:e.textContent.trim().slice(0,100),class:e.className,textWidth:text.width,width:box.width,textHeight:text.height,height:box.height});
    }return bad;
   });assert.deepEqual(record.clipped,[],'body/face text beyond its box');
   record.scroll_regions=await p.locator('#'+tab+' .edu-scroll-region').evaluateAll(es=>es.filter(e=>e.getClientRects().length&&e.scrollWidth>e.clientWidth+2).map(e=>{e.scrollTo({left:e.scrollWidth,behavior:'instant'});return {role:e.getAttribute('role'),name:e.getAttribute('aria-label'),max:e.scrollWidth-e.clientWidth,reached:e.scrollLeft>=e.scrollWidth-e.clientWidth-1}}));
   assert(record.scroll_regions.every(r=>r.reached&&r.name));
   const images=[];for(const position of ['top','middle','bottom']){
    await p.evaluate(position=>{const max=document.documentElement.scrollHeight-innerHeight;scrollTo({top:position==='top'?0:position==='middle'?max/2:max,behavior:'instant'})},position);await p.waitForTimeout(60);
    const file=`${route}_${tab}_${width}_text200_${position}.png`;await screenshot(p,{path:path.join(out,file)});images.push('evidence/'+path.relative(evidence,path.join(out,file)).replace(/\\/g,'/'));
   }record.evidence=images;record.pass=true;console.log('PASS',route,tab,width);
  }catch(e){record.error=e.stack;record.wide_boxes=await p.evaluate(()=>[...document.querySelectorAll('main *')].filter(e=>e.getClientRects().length&&e.scrollWidth>e.clientWidth+3&&!e.closest('.edu-scroll-region')).map(e=>({tag:e.tagName,class:e.className,scroll:e.scrollWidth,client:e.clientWidth,overflow:getComputedStyle(e).overflowX,text:e.textContent.trim().slice(0,80)})).slice(-30));await screenshot(p,{path:path.join(out,`${route}_${tab}_${width}_failed.png`)});console.error('FAIL',route,tab,width,e.message)}finally{await p.close();results.push(record);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2))}
 }
}finally{await b.close()}if(results.some(r=>!r.pass))process.exitCode=1;})().catch(e=>{console.error(e);process.exitCode=1});
