// Supplemental contrast audit: stop at opaque surfaces and sample gradient stops.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');const {open,evidence}=require('./handoff-browser.cjs');const {readCSV}=require('./csv-records.cjs');
const out=path.join(evidence,'after/surface-contrast');fs.mkdirSync(out,{recursive:true});
const rows=readCSV(path.join(evidence,'../checklists/RENDER-COVERAGE-416.csv')).filter(r=>+r.width===320);
function measure(){
 const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number),blend=(a,b)=>{const alpha=a[3]??1;return b.map((v,i)=>a[i]*alpha+v*(1-alpha))},lum=c=>c.slice(0,3).reduce((v,x,i)=>{x/=255;return v+[.2126,.7152,.0722][i]*(x<=.04045?x/12.92:((x+.055)/1.055)**2.4)},0);
 let tested=0,gradientText=0,excluded=0;const failures=[];
 for(const e of document.querySelectorAll('body *')){
  if(!e.getClientRects().length||e.closest('svg,[aria-hidden=true],.edu-visually-hidden')||![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))continue;
  const style=getComputedStyle(e);if(style.visibility==='hidden'||/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+$/u.test(e.textContent.trim()))continue;
  let layers=[],bases=[[255,255,255]],gradient=false,unsupported=false;
  for(let n=e;n;n=n.parentElement){
   const s=getComputedStyle(n),color=rgb(s.backgroundColor);if(s.opacity!=='1'){unsupported=true;break}
   if(s.backgroundImage!=='none'){
    const stops=(s.backgroundImage.match(/rgba?\([^)]*\)/g)||[]).map(s=>{const c=rgb(s);return [c[0],c[1],c[2],c[3]??1]});
    if(!s.backgroundImage.includes('gradient(')||stops.length<2){unsupported=true;break}
    bases=[];for(let i=0;i<stops.length-1;i++)for(let t=0;t<=100;t++)bases.push(blend(stops[i].map((v,k)=>v+(stops[i+1][k]-v)*t/100),[255,255,255]));gradient=true;break;
   }
   layers.push(color);if((color[3]??1)===1)break;
  }
  if(unsupported){excluded++;continue}
  const fg=rgb(style.color);if(fg.length<3){excluded++;continue}
  let minimum=Infinity;for(let bg of bases){for(const color of [...layers].reverse())bg=blend(color,bg);const color=blend(fg,bg);minimum=Math.min(minimum,(Math.max(lum(color),lum(bg))+.05)/(Math.min(lum(color),lum(bg))+.05))}
  const size=parseFloat(style.fontSize),large=size>=24||size>=18.66&&parseInt(style.fontWeight)>=700;tested++;if(gradient)gradientText++;
  if(minimum<(large?3:4.5)-.01)failures.push({ratio:+minimum.toFixed(2),required:large?3:4.5,gradient,tag:e.tagName,class:e.className,size,color:style.color,text:[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim().slice(0,120)});
 }
 return {tested,gradientText,excluded,failures};
}
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true}),results=[];try{for(const row of rows){const page=await open(browser,row.route,320,740);try{
 if(row.kind==='THEORY')await page.evaluate(id=>EduHeader.switchTab(id,{scroll:false,animate:false}),row.state);
 if(row.kind==='PRACTICE')await page.locator('#mobile-nav').evaluate((el,label)=>{const id={'Tổng quan':'overview','Theo chương':'chapter','Trắc nghiệm':'quiz','Luyện đề':'practice','Test 20 câu':'quick','Luyện thi':'exam','Câu sai':'mistakes'}[label]||label;const option=[...el.options].find(o=>o.value===id||o.textContent.trim()===label||o.textContent.trim()===label.replace(/^\d+\.\s*/,''));el.value=option.value;el.dispatchEvent(new Event('change',{bubbles:true}))},row.state);
 const record=await page.evaluate(measure);results.push({id:row.coverage_id,...record});console.log(row.coverage_id,record.tested,record.gradientText,'failures',record.failures.length);
 }finally{await page.close()}fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2))}}finally{await browser.close()}
 if(results.some(r=>r.failures.length))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
