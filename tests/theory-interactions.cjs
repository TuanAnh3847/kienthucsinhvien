// Detect broken UTF-8 sequences; standalone Ã is valid Vietnamese (for example ĐÃ).
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');const fixture=fs.readFileSync(path.join(__dirname,'firebase-fixture.js'),'utf8');
const routes=JSON.parse(fs.readFileSync('firebase.json')).hosting.rewrites.map(r=>r.source);const report=[];

const LEAKAGE_REGEX = /được bảo toàn|không được bảo toàn|Tài liệu môn học|Bài học (?:preserves|contains|keeps|explicitly|says|states|connects|supplies|asks|target|statistic|history|numerical|also|labels|criteria|equity|basis|account-basis|rows|problem|equilibrium|rate)|theo cách diễn đạt|cách diễn đạt trong bài|course terminology|formal items|readable extrema|consideration set|the[⚠\s]*Lưu ý|Build Pack|compiler|renderer|CLO\s*\d|Learning block|Course focus|course definition|course exercise|source description|source framing|no causal weight|no ranking added|not added|exam engine|factual quality|preserved exactly|Three Các định nghĩa|Exactly six roots|One-screen review|Bốn orientation được giữ nguyên|What to preserve|no invented one-to-one|Slide asks|khớp nguồn/i;

// Regression self-test: verify that forbidden builder residue is actively detected and flagged
const regressionBad = [
  'Bài học says Article IX:2 had not been used',
  'theo cách diễn đạt trong bài',
  'cách diễn đạt trong bài',
  'Convergent vs Divergent — course terminology',
  '29 formal items',
  'Neutral / Emotional chart — readable extrema',
  'chỉ trình bày như một consideration set',
  'Duration, capacity & the⚠ Lưu ý',
  'Bài học states price is not the most important factor',
  'dữ liệu được bảo toàn',
  'Learning block 1. What is culture?',
  'Course focus: participation in goal setting',
  'IFI — course definition',
  'course exercise không đưa universal persuasion',
  'Ghi observations theo source description',
  'source framing',
  'no causal weights or rankings are added',
  'no ranking added',
  'không thành exam engine',
  'không được hệ thống chấm factual quality',
  'preserved exactly as written',
  'Three Các định nghĩa form the chapter foundation',
  'Exactly six roots — no causal weights',
  'One-screen review anchors across the course',
  'Bốn orientation được giữ nguyên',
  'What to preserve',
  'no invented one-to-one mapping',
  'Slide asks "What is protection?"',
  'thứ tự khớp nguồn.'
];
for (const s of regressionBad) {
  assert(LEAKAGE_REGEX.test(s), 'Leakage regression failed to detect bad phrasing: ' + s);
}
const regressionGood = [
  'Thời lượng, dung lượng và các lưu ý trọng tâm',
  '29 tiêu chí ôn tập',
  'Tư duy hội tụ và tư duy phân kỳ (Convergent vs Divergent)',
  'tập hợp các phương án cần cân nhắc khi lập kế hoạch',
  'Trị giá hải quan sử dụng giá trị giao dịch thực tế',
  'Khái niệm 1. What is culture?',
  'Trọng tâm áp dụng: mức độ tham gia vào việc thiết lập mục tiêu',
  'IFI — định nghĩa trọng tâm',
  'Ghi lại quan sát của bạn',
  'Phần này dùng để tự luyện; không chấm điểm tự động.',
  'SƠ ĐỒ ÔN TẬP',
  'Phần này dùng để ôn nhanh lý thuyết và công thức.',
  'Ba định nghĩa nền tảng của chương bao gồm:',
  'Sáu nguồn gốc cốt lõi dẫn đến hành vi phi đạo đức:',
  'Tổng hợp các sơ đồ tư duy trọng tâm toàn bộ môn học.',
  'Bốn định hướng chiến lược cơ bản: Ethnocentric, Polycentric, Regiocentric, Geocentric.',
  'Điểm cần nhớ',
  'Không ghép cứng từng thách thức với một cơ hội duy nhất.',
  'thứ tự chính xác.'
];
for (const s of good = regressionGood) {
  assert(!LEAKAGE_REGEX.test(s), 'Leakage regression falsely flagged clean phrasing: ' + s);
}

(async()=>{
  const b=await chromium.launch({channel:'msedge',headless:true});
  try{
    for(const route of routes.filter(r=>!process.env.THEORY_FILTER||r===process.env.THEORY_FILTER)){
      const p=await b.newPage({viewport:{width:375,height:812},isMobile:true,hasTouch:true});
      const errors=[];
      p.on('pageerror',e=>errors.push(e.message));
      p.on('dialog',d=>d.accept());
      await p.addInitScript(()=>window.__fixtureOptions={user:{uid:'test-user',email:'student@example.test',displayName:'Sinh viên'}});
      await p.route(/https:\/\/www\.gstatic\.com\/firebasejs\/.+\.js/,r=>r.fulfill({contentType:'text/javascript',body:r.request().url().includes('firebase-app-compat')?fixture:''}));
      try{
        await p.goto('http://127.0.0.1:4173'+route);
        await p.waitForFunction(()=>window.EduHeader);
        let actions=0;
        const chapters=await p.evaluate(()=>EduHeader.config.chapters.map(c=>c.id));
        const findings=[];
        for(const id of chapters){
          await p.locator(`#nav-menu [data-edu-tab="${id}"]`).click();
          await p.waitForTimeout(100);
          const scan=await p.locator('#'+id).evaluate((el, pattern)=>{
            const rx=new RegExp(pattern, 'i');
            const bad=[];
            for(const e of el.querySelectorAll('*')) {
              for(const a of e.attributes){
                if(a.name.startsWith('on')) {
                  try{new Function('event',a.value)}catch(err){bad.push(e.tagName+' '+a.name+': '+err.message)}
                }
              }
            }
            const elements=[...el.querySelectorAll('p,li,h1,h2,h3,h4,summary,td,th,.source-tag,.source-note,.source-line,.status-note,.interaction-badge,.warning-box,.branch-output,.source-ref,figcaption,caption,.feedback,.interaction-feedback,.result,.callout,.notice')];
            const texts=elements.map(e=>e.textContent.trim()).filter(t=>rx.test(t));
            for(const e of el.querySelectorAll('*')) {
              for(const attr of ['data-content','placeholder','data-flow-detail','data-explanation']) {
                const val = e.getAttribute(attr);
                if(val && rx.test(val.trim())) texts.push(`[${attr}] ${val.trim()}`);
              }
            }
            return {
              handlers:bad,
              encoding:el.innerText.match(/.{0,35}(?:Ã[\u0080-\u00bf]|Â[\u0080-\u00bf]|Æ[\u0080-\u00bf]|\uFFFD).{0,35}/g),
              copy:texts
            };
          }, LEAKAGE_REGEX.source);
          assert.deepEqual(scan.handlers,[],route+' '+id);
          assert(!scan.encoding,route+' '+id+' mojibake: '+JSON.stringify(scan.encoding));
          findings.push(...scan.copy);

          // 1. Interactive action buttons (calculate, check, reset)
          const buttons=p.locator('#'+id).getByRole('button').filter({hasText:/^(Kiểm tra|Check|Tính|Calculate|Làm lại|Reset|Câu khác|Xáo lại)/i});
          const count=Math.min(await buttons.count(),4);
          for(let i=0;i<count;i++){
            if(await buttons.nth(i).isVisible()&&await buttons.nth(i).isEnabled()){
              await buttons.nth(i).click();
              await buttons.nth(i).click();
              actions+=2;
            }
          }

          // 2. Branch & flow buttons (exercise dynamic output text)
          const branchBtns=p.locator('#'+id+' .branch-btn, #'+id+' .dispute-node');
          const bCount=Math.min(await branchBtns.count(),6);
          for(let i=0;i<bCount;i++){
            if(await branchBtns.nth(i).isVisible()&&await branchBtns.nth(i).isEnabled()){
              await branchBtns.nth(i).click();
              actions++;
            }
          }

          // 3. Conflict modal triggers (exercise modal text and close)
          const conflictBtns=p.locator('#'+id+' .conflict-btn');
          const cCount=Math.min(await conflictBtns.count(),2);
          for(let i=0;i<cCount;i++){
            if(await conflictBtns.nth(i).isVisible()){
              await conflictBtns.nth(i).click();
              actions++;
              const modalFinding=await p.evaluate((pattern)=>{
                const modal=document.getElementById('conflict-modal');
                if(!modal||modal.classList.contains('hidden'))return null;
                const rx=new RegExp(pattern,'i');
                const t=modal.innerText||'';
                return rx.test(t)?t:null;
              }, LEAKAGE_REGEX.source);
              if(modalFinding) findings.push(`[modal] ${modalFinding}`);
              await p.keyboard.press('Escape');
            }
          }

          // Re-scan dynamic outputs after interaction
          const postScan=await p.locator('#'+id).evaluate((el, pattern)=>{
            const rx=new RegExp(pattern,'i');
            return [...el.querySelectorAll('.branch-output,#dispute-flow-detail,.feedback,.interaction-feedback,.result')]
              .map(e=>e.textContent.trim())
              .filter(t=>rx.test(t));
          }, LEAKAGE_REGEX.source);
          findings.push(...postScan);

          assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),route+' '+id+' overflow');
        }
        assert.deepEqual(errors,[],route);
        assert.deepEqual(findings,[],route+' presentation leakage');
        report.push({route,chapters:chapters.length,repeatedActions:actions,pass:true});
        console.log('PASS',route,chapters.length+' chapters',actions+' actions');
      }finally{await p.close()}
    }
  }finally{
    await b.close();
    fs.writeFileSync(path.join(__dirname,'theory-interactions-results.json'),JSON.stringify(report,null,2))
  }
})().catch(e=>{console.error(e);process.exitCode=1});
