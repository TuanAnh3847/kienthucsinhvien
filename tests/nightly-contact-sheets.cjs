const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const dir=path.join(__dirname,'screenshots','nightly');
(async()=>{
 for(const route of JSON.parse(fs.readFileSync('firebase.json')).hosting.rewrites) {
  const name=route.source.slice(1);
  const files=fs.readdirSync(dir).filter(f=>f.startsWith(`${name}-component-`));
  if(!files.length)continue;
  const tiles=[];
  for(let i=0;i<files.length;i++) {
   tiles.push({input:await sharp(path.join(dir,files[i])).resize(480,333).toBuffer(),left:(i%3)*480,top:Math.floor(i/3)*361+28});
   tiles.push({input:Buffer.from(`<svg width="480" height="28"><rect width="100%" height="100%" fill="#0f172a"/><text x="10" y="20" fill="white" font-family="Arial" font-size="16">${files[i]}</text></svg>`),left:(i%3)*480,top:Math.floor(i/3)*361});
  }
  await sharp({create:{width:1440,height:361*Math.ceil(files.length/3),channels:3,background:'#f1f5f9'}}).composite(tiles).png().toFile(path.join(dir,`components-${name}.png`));
 }
 for(const width of [1440,375]) for(const state of ['top','sticky','choices']) {
  const files=fs.readdirSync(dir).filter(f=>f.endsWith(`-${width}-${state}.png`));
  for(let offset=0;offset<files.length;offset+=4) {
   const batch=files.slice(offset,offset+4),w=width===1440?720:375,h=width===1440?500:1000;
   const tiles=[];
   for(let i=0;i<batch.length;i++) {
    tiles.push({input:await sharp(path.join(dir,batch[i])).resize(w,h).toBuffer(),left:(i%2)*w,top:Math.floor(i/2)*(h+28)+28});
    const title=Buffer.from(`<svg width="${w}" height="28"><rect width="100%" height="100%" fill="#0f172a"/><text x="12" y="20" fill="white" font-family="Arial" font-size="16">${batch[i]}</text></svg>`);
    tiles.push({input:title,left:(i%2)*w,top:Math.floor(i/2)*(h+28)});
   }
   await sharp({create:{width:w*2,height:(h+28)*Math.ceil(batch.length/2),channels:3,background:'#f1f5f9'}}).composite(tiles).png().toFile(path.join(dir,`sheet-${width}-${state}-${offset/4+1}.png`));
  }
 }
})();
