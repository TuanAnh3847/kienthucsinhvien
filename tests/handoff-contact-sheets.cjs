// Layout survey sheets preserve every pixel of each full-page capture.
// They supplement full-resolution inspection; they never mark visual review PASS.
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const {evidence}=require('./handoff-browser.cjs');
const root=path.join(evidence,'after/render'),out=path.join(evidence,'after/contact-sheets');fs.mkdirSync(out,{recursive:true});
const results=JSON.parse(fs.readFileSync(path.join(root,'results.json'),'utf8')).results;
(async()=>{
 const tiles=[],width=320,height=1500;
 for(const row of results){
  const file=path.join(evidence,'..',row.evidence),data=await sharp(file).resize({width}).png().toBuffer(),meta=await sharp(data).metadata();
  for(let top=0;top<meta.height;top+=height){
   const n=Math.min(height,meta.height-top),body=await sharp(data).extract({left:0,top,width,height:n}).png().toBuffer();
   tiles.push({body,id:row.coverage_id,part:Math.floor(top/height)+1,scaled_top:top,scaled_height:n,source_width:row.width});
  }
 }
 const index=[];
 for(let start=0;start<tiles.length;start+=12){
  const group=tiles.slice(start,start+12),sheet=`sheet-${String(start/12+1).padStart(3,'0')}.png`,items=[];
  for(let i=0;i<group.length;i++){
   const tile=group[i],left=(i%4)*(width+8),top=Math.floor(i/4)*(height+42);
   const label=Buffer.from(`<svg width="320" height="38"><rect width="320" height="38" fill="#dbeafe"/><text x="4" y="14" font-family="Arial" font-size="10">${tile.id.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</text><text x="4" y="30" font-family="Arial" font-size="11">part ${tile.part}, scaled y=${tile.scaled_top}</text></svg>`);
   items.push({input:label,left,top},{input:tile.body,left,top:top+40});index.push({sheet,coverage_id:tile.id,part:tile.part,scaled_top:tile.scaled_top,source_width:tile.source_width});
  }
  await sharp({create:{width:4*(width+8),height:3*(height+42),channels:3,background:'#e2e8f0'}}).composite(items).png().toFile(path.join(out,sheet));
 }
 fs.writeFileSync(path.join(out,'index.json'),JSON.stringify({purpose:'Full-body layout survey only; read text, contrast and interactions in full-resolution captures/tests.',states:results.length,tiles:tiles.length,sheets:Math.ceil(tiles.length/12),index},null,2));console.log('CONTACTS',results.length,tiles.length,Math.ceil(tiles.length/12));
})().catch(e=>{console.error(e);process.exitCode=1});
