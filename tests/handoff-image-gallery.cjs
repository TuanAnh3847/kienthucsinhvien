if(process.env.QA_SCREENSHOTS!=='1'){console.log('Image artifacts disabled by default; set QA_SCREENSHOTS=1 to opt in.');process.exit(0);}
// Build labeled survey sheets while retaining the original evidence images.
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const folder=path.resolve(process.argv[2]),out=path.join(folder,'gallery');fs.mkdirSync(out,{recursive:true});
(async()=>{const tiles=[];for(const file of fs.readdirSync(folder).filter(f=>f.endsWith('.png')&&!f.includes('failed')).sort()){
 const data=await sharp(path.join(folder,file)).resize({width:320,withoutEnlargement:true}).png().toBuffer(),m=await sharp(data).metadata();
 for(let y=0;y<m.height;y+=900)tiles.push({file,part:y/900+1,input:await sharp(data).extract({left:0,top:y,width:m.width,height:Math.min(900,m.height-y)}).png().toBuffer()});
}
const index=[];for(let start=0;start<tiles.length;start+=12){const name=`gallery-${String(start/12+1).padStart(3,'0')}.png`,items=[];
 for(let i=0;i<Math.min(12,tiles.length-start);i++){const t=tiles[start+i],left=i%4*328,top=Math.floor(i/4)*936;
  const label=Buffer.from(`<svg width="320" height="32"><rect width="320" height="32" fill="#dbeafe"/><text x="3" y="13" font-family="Arial" font-size="10">${t.file.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</text><text x="3" y="27" font-family="Arial" font-size="10">part ${t.part}</text></svg>`);
  items.push({input:label,left,top},{input:t.input,left,top:top+34});index.push({sheet:name,file:t.file,part:t.part});
 }
 await sharp({create:{width:1312,height:2808,channels:3,background:'#e2e8f0'}}).composite(items).png().toFile(path.join(out,name));
}fs.writeFileSync(path.join(out,'index.json'),JSON.stringify({purpose:'Visual survey; originals retained for reading at native size',tiles:tiles.length,sheets:Math.ceil(tiles.length/12),index},null,2));console.log('GALLERY',tiles.length,Math.ceil(tiles.length/12));
})().catch(e=>{console.error(e);process.exitCode=1});
