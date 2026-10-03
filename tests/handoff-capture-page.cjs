const sharp=require('sharp');
async function capture(page,file,width){
 const height=await page.evaluate(()=>document.documentElement.scrollHeight);
 if(height<=8000){await page.screenshot({path:file,fullPage:true});return {method:'full page below 8000px',height}}
 const tiles=[],steps=[];let end=0;
 while(end<height){
  await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),Math.max(0,end-300));await page.waitForTimeout(40);
  const bounds=await page.evaluate(()=>({y:Math.round(scrollY),header:Math.max(0,document.querySelector('#edu-header')?.getBoundingClientRect().bottom||0),height:innerHeight}));
  const start=end-bounds.y,n=Math.min(bounds.height-start,height-end);
  if(end>0&&start<bounds.header)throw Error('Sticky header would cover unread body');
  if(n<=0)throw Error('Capture failed to advance');
  const shot=await page.screenshot();tiles.push({input:await sharp(shot).extract({left:0,top:start,width,height:n}).png().toBuffer(),left:0,top:end});steps.push({...bounds,captured_start:end,captured_end:end+n});end+=n;
 }
 await sharp({create:{width,height,channels:3,background:'#fff'}}).composite(tiles).png().toFile(file);
 await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
 return {method:'stitched visible viewports with overlap and sticky-header exclusion',height,steps};
}
module.exports={capture};
