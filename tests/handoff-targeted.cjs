const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {open,evidence}=require('./handoff-browser.cjs');
const {chooseChapter}=require('./chapter-navigation.cjs');
const out=path.join(evidence,'after/targeted');fs.mkdirSync(out,{recursive:true});const results=[];
async function test(name,fn){try{const data=await fn();results.push({name,pass:true,...data});console.log('PASS',name);}catch(e){results.push({name,pass:false,error:e.message});console.error('FAIL',name,e.message);}}
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{
 for(const [route,tab]of [['/STKN','ch3'],['/NLTTTC','ch2'],['/TLUD','ch7'],['/PTBV','ch2'],['/VHDDTKD','ch2'],['/LTMQT','ch1']]){
  const p=await open(b,route,320,740);
  try{for(const width of [320,390,641,767,768,800,820,900,1024,1279,1280,1366])await test(route+' '+tab+' breakpoint '+width,async()=>{
   await p.setViewportSize({width,height:width<641?844:900});await chooseChapter(p,tab);await p.waitForTimeout(200);
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal document overflow');
   const shapes=await p.locator('#'+tab).evaluate(section=>{
    const containers=[...section.querySelectorAll('.function-wheel,.opportunity-ring,.empathy-grid,.wheel')];
    return containers.map(c=>({class:c.className,children:[...c.children].map(e=>({text:e.textContent.trim(),rect:JSON.parse(JSON.stringify(e.getBoundingClientRect()))}))}));
   });
   for(const shape of shapes)for(let i=0;i<shape.children.length;i++)for(let j=i+1;j<shape.children.length;j++){
    const a=shape.children[i].rect,c=shape.children[j].rect;
    assert(!(a.right>c.left+2&&c.right>a.left+2&&a.bottom>c.top+2&&c.bottom>a.top+2),'diagram nodes overlap '+shape.class);
   }
   const file=`${route.slice(1)}_${tab}_${width}.png`;await p.screenshot({path:path.join(out,file),fullPage:true});
   return {route,tab,width,shapes,evidence:'evidence/after/targeted/'+file};
  });}finally{await p.close();}
 }
 for(const route of ['/NLKT','/NLTTTC','/STKN','/TLUD','/VHDDTKD'])for(const width of [320,390])await test(route+' two faces at 200% text '+width,async()=>{
  const p=await open(b,route,width,844);try{
   const chapters=await p.evaluate(()=>EduHeader.config.chapters.map(c=>c.id));let cards=0;const images=[];
   for(const tab of chapters){await p.evaluate(id=>EduHeader.switchTab(id,{scroll:false,animate:false}),tab);
    const selector='#'+tab+' .flip-card, #'+tab+' .flip-card-local';
    if(!await p.locator(selector).count())continue;
    await p.locator(selector).evaluateAll(cs=>cs.forEach(c=>{
     const nodes=[c,...c.querySelectorAll('*')].map(e=>[e,parseFloat(getComputedStyle(e).fontSize)]);
     nodes.forEach(([e,size])=>e.style.fontSize=(size*2)+'px');
    }));
    const bad=await p.locator(selector).evaluateAll(cs=>{
     const errors=[];
     cs.forEach(c=>{for(const face of c.querySelectorAll('.flip-face,.flip-front,.flip-back')){
      const range=document.createRange();range.selectNodeContents(face);const text=range.getBoundingClientRect(),box=face.getBoundingClientRect();
      if(text.height>box.height+3||text.width>box.width+3)errors.push(face.textContent.slice(0,100));
     }c.click();c.click();});return errors;
    });assert.deepEqual(bad,[],'long card face clipping');cards+=await p.locator(selector).count();
    const file=`${route.slice(1)}_${tab}_${width}_text200.png`;await p.screenshot({path:path.join(out,file),fullPage:true});images.push('evidence/after/targeted/'+file);
   }
   assert(cards>0,'flashcards exist');assert.deepEqual(p.errors,[]);return {route,width,cards,evidence:images};
  }finally{await p.close();}
 });
 await test('PTBV modal keyboard, Escape, focus return and short landscape',async()=>{
  const p=await open(b,'/PTBV',568,320);try{
   const button=p.locator('.course-map-fab');await button.focus();await p.keyboard.press('Enter');
   assert(await p.locator('#course-map-modal').isVisible());
   assert(await p.locator('.map-close').evaluate(e=>e===document.activeElement));
   await p.keyboard.press('Tab');assert(await p.locator('#course-map-modal').evaluate(e=>e.contains(document.activeElement)));
   await p.locator('.map-card').evaluate(e=>e.scrollTop=e.scrollHeight);await p.screenshot({path:path.join(out,'PTBV_landscape_modal.png')});
   await p.keyboard.press('Escape');assert(!await p.locator('#course-map-modal').isVisible());assert(await button.evaluate(e=>e===document.activeElement));
   return {evidence:'evidence/after/targeted/PTBV_landscape_modal.png'};
  }finally{await p.close();}
 });
 await test('KTCT rendered math and unchanged arithmetic at custom inputs',async()=>{
  const p=await open(b,'/KTCTMLN',390,844);try{
   await chooseChapter(p,'ch2');
   const outputs=await p.evaluate(()=>{
    const values=[];for(const [c,v,m]of [[1000,200,200],[1234,456,789],[0,0,0]]){
     document.getElementById('calc-w-c').value=c;document.getElementById('calc-w-v').value=v;document.getElementById('calc-w-m').value=m;
     KTCT.calcW();
     const text=document.getElementById('res-w').innerText;
     if(!text.includes('= '+(c+v+m)+'$'))throw Error('Incorrect W arithmetic '+text);
     values.push({inputs:[c,v,m],text});
    }
    for(const [price,quantity,velocity]of [[50,1000,5],[123,456,7]]){
     document.getElementById('calc-m-p').value=price;document.getElementById('calc-m-q').value=quantity;document.getElementById('calc-m-v').value=velocity;KTCT.calcM();
     const text=document.getElementById('res-m').innerText;
     if(!text.includes((price*quantity/velocity).toFixed(2)+'$'))throw Error('Incorrect M arithmetic '+text);
     if(text.includes('$M$'))throw Error('Raw M notation');values.push({inputs:[price,quantity,velocity],text});
    }
    const previous=document.getElementById('res-m').innerText;document.getElementById('calc-m-v').value=0;KTCT.calcM();
    if(document.getElementById('res-m').innerText!==previous)throw Error('Invalid-velocity behavior changed');
    return values;
   });
   // The existing regression covers each page-owned calculator; this records notation as rendered.
   assert(!/\$W\$|\\rightarrow/.test(await p.locator('#ch2').innerText()));
   await p.screenshot({path:path.join(out,'KTCT_ch2_390_math.png'),fullPage:true});
   return {outputs,evidence:'evidence/after/targeted/KTCT_ch2_390_math.png'};
  }finally{await p.close();}
 });
}finally{await b.close();fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));}if(results.some(r=>!r.pass))process.exitCode=1;})().catch(e=>{console.error(e);process.exitCode=1});
