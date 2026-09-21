const fs=require('node:fs');
for(const r of JSON.parse(fs.readFileSync('firebase.json')).hosting.rewrites){
 const s=fs.readFileSync(r.destination.slice(1),'utf8');
 const found=[];
 for(const script of s.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
  for(const text of script[1].matchAll(/(["'`])(?:\\.|(?!\1)[^\\])*?\1/g)) {
   const t=text[0];
   if(t.length<1800 && /\bslide(?:s)?\b|\bsource\b|lecturer|canonical|compiler|blueprint|renderer|\[cite:|trích xuất|không tự|không dựng|bài học-bounded|source-state|course-source|\bRAW\b/i.test(t) && !/^['"]source['"]$/.test(t)) found.push(t);
  }
 }
 console.log(r.source+'\n'+[...new Set(found)].join('\n'));
}
