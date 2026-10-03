if(process.env.QA_SCREENSHOTS!=='1'){console.log('Image artifacts disabled by default; set QA_SCREENSHOTS=1 to opt in.');process.exit(0);}
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const {chromium}=require('playwright');const {open,evidence}=require('./handoff-browser.cjs');
const dir=path.join(evidence,'after/render'),file=path.join(dir,'results.json');
const data=JSON.parse(fs.readFileSync(file,'utf8')),captures=[];
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 for(const row of data.results.filter(r=>r.metrics.height>8000)){
  const p=await open(browser,row.route,row.width,row.height);try{
   await p.evaluate(id=>EduHeader.switchTab(id,{scroll:false,animate:false}),row.state);
   await p.locator('#'+row.state).evaluate(e=>e.querySelectorAll('details').forEach(d=>d.open=true));
   await p.waitForTimeout(100);await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
   const height=await p.evaluate(()=>document.documentElement.scrollHeight),tiles=[],steps=[];let end=0;
   while(end<height){
    await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),Math.max(0,end-300));await p.waitForTimeout(40);
    const bounds=await p.evaluate(()=>({y:Math.round(scrollY),header:Math.max(0,document.querySelector('#edu-header')?.getBoundingClientRect().bottom||0),width:innerWidth,height:innerHeight}));
    const start=end-bounds.y,n=Math.min(bounds.height-start,height-end);
    if(end>0&&start<bounds.header)throw Error('Sticky header would cover unread body');
    if(n<=0)throw Error('Capture failed to advance');
    const shot=await p.screenshot();tiles.push({input:await sharp(shot).extract({left:0,top:start,width:row.width,height:n}).png().toBuffer(),left:0,top:end});steps.push({...bounds,captured_start:end,captured_end:end+n});end+=n;
   }
   await sharp({create:{width:row.width,height,channels:3,background:'#fff'}}).composite(tiles).png().toFile(path.join(dir,row.coverage_id+'.png'));
   row.capture_method='stitched live viewports with overlap and sticky-header exclusion';captures.push({coverage_id:row.coverage_id,height,steps});console.log('TILED',row.coverage_id,steps.length);
  }finally{await p.close()}
 }
}finally{await browser.close();fs.writeFileSync(file,JSON.stringify(data,null,2));fs.writeFileSync(path.join(dir,'capture-fidelity.json'),JSON.stringify({reason:'Very tall Chromium full-page images repeated the header; these captures use actual viewport pixels.',captures},null,2))}})().catch(e=>{console.error(e);process.exitCode=1});
