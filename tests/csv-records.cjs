const fs=require('node:fs');
function readCSV(file) {
 const text=fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'');
 const rows=[];let row=[],field='',quoted=false;
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}
  else if(!quoted&&(c===','||c==='\n')){row.push(field);field='';if(c==='\n'){rows.push(row);row=[];}}
  else if(c!=='\r'||quoted)field+=c;
 }
 if(field||row.length){row.push(field);rows.push(row);}
 const headers=rows.shift();
 return rows.filter(r=>r.length>1).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]||''])));
}
function writeCSV(file,rows){const h=Object.keys(rows[0]);const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';fs.writeFileSync(file,'\uFEFF'+[h,...rows.map(r=>h.map(k=>r[k]))].map(r=>r.map(q).join(',')).join('\r\n')+'\r\n');}
module.exports={readCSV,writeCSV};
