// Same rendered color measurement as the full-route contrast audit.
module.exports = ()=>{
   const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number),lum=c=>c.slice(0,3).reduce((v,x,i)=>{x/=255;return v+[.2126,.7152,.0722][i]*(x<=.04045?x/12.92:((x+.055)/1.055)**2.4)},0),fails=new Map();let tested=0,excluded=0;
   for(const e of document.querySelectorAll('body *')){
    if(!e.getClientRects().length||e.closest('svg,[aria-hidden=true],.edu-visually-hidden')||![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))continue;
    const style=getComputedStyle(e);if(style.visibility==='hidden'||style.opacity!=='1'||/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+$/u.test(e.textContent.trim())){excluded++;continue}
    const fg=rgb(style.color),layers=[];let gradient=false;
    for(let n=e;n;n=n.parentElement){const s=getComputedStyle(n);if(s.backgroundImage!=='none'){gradient=true;break}layers.push(rgb(s.backgroundColor))}
    if(gradient||fg.length<3){excluded++;continue}
    let bg=[255,255,255];for(const layer of layers.reverse()){const a=layer[3]??1;bg=bg.map((v,i)=>layer[i]*a+v*(1-a))}
    const a=fg[3]??1,color=bg.map((v,i)=>fg[i]*a+v*(1-a)),ratio=(Math.max(lum(color),lum(bg))+.05)/(Math.min(lum(color),lum(bg))+.05),size=parseFloat(style.fontSize),large=size>=24||size>=18.66&&parseInt(style.fontWeight)>=700;tested++;
    if(ratio<(large?3:4.5)-.01){const key=style.color+' / '+bg.map(Math.round).join(',');if(!fails.has(key))fails.set(key,{color:style.color,background:bg.map(Math.round),ratio:+ratio.toFixed(2),examples:[]});const item=fails.get(key);if(item.examples.length<3)item.examples.push({tag:e.tagName,class:e.className,size,text:e.textContent.trim().slice(0,80)})}
   }return {tested,excluded,failures:[...fails.values()]};
};
