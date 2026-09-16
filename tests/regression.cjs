const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const fixture = fs.readFileSync(path.join(__dirname, 'firebase-fixture.js'), 'utf8');
const root = path.resolve(__dirname, '..');
const subjects = fs.readdirSync(root).filter(f => f.endsWith('.html') && fs.readFileSync(path.join(root,f),'utf8').includes('id="mobile-nav"'));
const user = {uid:'test-user', email:'student@example.test', displayName:'Sinh viên có họ và tên rất dài để kiểm tra bố cục giao diện',photoURL:null};
const results = [];
let browser;
async function test(name, run) { if(process.env.TEST_FILTER && !name.includes(process.env.TEST_FILTER)) return; try { await run(); results.push({name,pass:true}); console.log('PASS',name); } catch(e) { results.push({name,pass:false,error:e.stack}); console.error('FAIL',name,e.message); } }
async function open(file, options = {}, width = 375) {
    const page = await browser.newPage({viewport:{width,height:812}});
    page.errors = [];
    page.on('pageerror', e => page.errors.push(e.message));
    page.on('dialog', d => d.accept());
    await page.addInitScript(value => { window.__fixtureOptions = value; }, options);
    await page.route(/https:\/\/www\.gstatic\.com\/firebasejs\/.+\.js/, route => route.fulfill({contentType:'text/javascript',body:route.request().url().includes('firebase-app-compat') ? fixture : ''}));
    await page.goto('http://127.0.0.1:4173/' + file.replace('.html',''), {waitUntil:'load'});
    await page.waitForFunction(() => typeof firebase !== 'undefined' && firebase.apps.length === 1);
    await page.waitForTimeout(150);
    return page;
}
async function layout(page) {
    return page.evaluate(() => {
        const row = document.querySelector('.site-header-row');
        const children = row ? [...row.children].filter(e=>e.getBoundingClientRect().width) : [];
        const rects = children.map(e=>e.getBoundingClientRect());
        return {width:innerWidth, scrollWidth:document.documentElement.scrollWidth, collision:rects.some((r,i)=>i && r.left < rects[i-1].right-1), navHeight:document.querySelector('nav')?.getBoundingClientRect().height};
    });
}
async function checkLayout(page, label) { const value = await layout(page); assert(value.scrollWidth <= value.width+1, label + ' overflow: '+JSON.stringify(value)); assert(!value.collision,label+' header collision'); }
(async () => {
    browser = await chromium.launch({channel:process.env.BROWSER_CHANNEL || 'msedge',headless:true});
    for (const file of subjects) await test(file + ': chapters, headers, tools and profile', async () => {
        const page = await open(file, {user});
        try {
            assert(await page.locator('#nav-user-profile').isVisible());
            assert(!await page.locator('#nav-login-btn').isVisible());
            const options = await page.locator('#mobile-nav option').evaluateAll(els=>els.map(e=>e.value));
            for (const width of [375,768,1280,1440]) {
                await page.setViewportSize({width,height:812});
                for (const id of options) {
                    if(width<1280) await page.locator('#mobile-nav').selectOption(id);
                    else await page.locator('#nav-menu button').filter({hasText: await page.locator('#nav-menu button').evaluateAll((els,value)=>els.find(e=>e.getAttribute('onclick').includes("'"+value+"'"))?.textContent,id)}).click();
                    assert(await page.locator('#'+id).isVisible(),file+' chapter '+id);
                    assert.equal(await page.locator('#mobile-nav').inputValue(),id);
                    const visibleChapters = await page.locator('.tab-content').evaluateAll(els=>els.filter(e=>getComputedStyle(e).display!=='none').length);
                    assert.equal(visibleChapters,1);
                    await checkLayout(page,file+' '+width+' '+id);
                }
                assert.equal(await page.locator('#mobile-nav').isVisible(),width<1280);
                assert.equal(await page.locator('#nav-menu').isVisible(),width>=1280);
            }
            // Exercise each course's calculators with their existing default inputs.
            const calls = {
                'KinhTeQuocTe.html':['calculateERP()','updateLaborChart()','updateDualLaborChart()'],
                'KinhTeChinhTriMacLeNin.html':['KTCT.calcW()','KTCT.calcM()','KTCT.calcSurplus()'],
                'NguyenLyKeToan.html':["addEqRow('a')",'solveAdvancedEquation()','calcPnL()','calcTAcc()','calcAcq()','calcDep()','calcZ()'],
                'QuanTriHoc.html':['generateSWOTStrategies()','updateLeadershipStyle()'],
                'TaiChinhCaNhan.html':['calculateRatios()','calculateFV()','calculateEqualPrincipal()'],
                'LuatThuongMaiQT.html':['calculateTariff()']
            }[file] || [];
            for(const call of calls) await page.evaluate(code=>window.eval(code),call);
            assert.deepEqual(page.errors,[]);
            assert.equal(await page.evaluate(()=>__firebaseTest.authListenerCount()),1,'shared auth only');
            await page.setViewportSize({width:375,height:812});
            await page.locator('#mobile-nav').selectOption(options[0]);
            await page.waitForTimeout(500);
            await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
            await page.screenshot({path:path.join(__dirname,'screenshots',file.replace('.html','')+'-mobile.png')});
        } finally { await page.close(); }
    });
    await test('Guest modal focus, short viewport, Escape and clean routes', async () => {
        const page = await open('KinhTeQuocTe');
        try {
            await page.setViewportSize({width:375,height:420});
            assert(await page.locator('#welcome-modal').isVisible());
            const bounds = await page.locator('#welcome-modal-content').boundingBox();
            assert(bounds.y >= 0 && bounds.y+bounds.height<=421);
            const buttons = page.locator('#welcome-modal button');
            await buttons.first().focus(); await page.keyboard.press('Shift+Tab');
            assert(await buttons.last().evaluate(e=>e===document.activeElement));
            await page.keyboard.press('Tab');
            assert(await buttons.first().evaluate(e=>e===document.activeElement));
            await page.keyboard.press('Escape'); await page.waitForURL('http://127.0.0.1:4173/');
            await page.waitForFunction(()=>typeof continueAsGuest==='function');
            await page.evaluate(()=>continueAsGuest());
            assert.equal(await page.evaluate(()=>localStorage.getItem('onthi_role')),'guest');
            await page.goto('http://127.0.0.1:4173/index');
            await page.waitForFunction(()=>typeof continueAsGuest==='function');
            await page.evaluate(()=>continueAsGuest());
            assert(page.url().endsWith('/index'));
            assert.deepEqual(page.errors,[]);
        } finally { await page.close(); }
    });
    await test('Login deduplication, profile fallback, listener cleanup, keyboard logout', async () => {
        const page = await open('KinhTeQuocTe');
        try {
            await page.evaluate(()=>Promise.all([loginGoogleReal(),loginGoogleReal()]));
            assert.equal(await page.evaluate(()=>__firebaseTest.popupCalls),1);
            assert(!await page.locator('#welcome-modal').isVisible());
            assert(await page.locator('#nav-user-profile').isVisible());
            assert.equal(await page.locator('#user-avatar').getAttribute('src'),'/android-chrome-192x192.png');
            await page.evaluate(()=>__firebaseTest.setUser({...firebase.auth().currentUser,uid:'second-user'}));
            assert.equal(await page.evaluate(()=>__firebaseTest.listeners['.info/connected'].size),1);
            await page.locator('#nav-user-profile').focus(); await page.keyboard.press('Enter');
            await page.waitForURL('http://127.0.0.1:4173/');
            assert.equal(await page.evaluate(()=>localStorage.getItem('onthi_role')),null);
            assert.deepEqual(page.errors,[]);
        } finally { await page.close(); }
    });
    await test('Popup cancellation and logout failure remain usable', async () => {
        const page = await open('KinhTeQuocTe',{popupError:'auth/popup-closed-by-user'});
        try {
            await page.locator('#welcome-modal button').first().click();
            await page.waitForTimeout(80);
            assert(await page.locator('#welcome-modal').isVisible());
            await page.evaluate(()=>{__firebaseTest.options.popupError=null;});
            await page.locator('#welcome-modal button').first().click();
            await page.waitForFunction(()=>firebase.auth().currentUser);
            await page.evaluate(()=>{__firebaseTest.options.signOutError=true;});
            assert.equal(await page.evaluate(()=>logoutReal()),false);
            assert(await page.locator('#nav-user-profile').isVisible());
            assert.equal(await page.evaluate(()=>__firebaseTest.listeners['.info/connected'].size),1);
            assert.deepEqual(page.errors,[]);
        } finally { await page.close(); }
    });
    await test('Idle initialization, expiry, activity, and stalled presence writes', async () => {
        const page = await open('TaiChinhCaNhan',{user});
        try {
            assert(Number(await page.evaluate(()=>localStorage.getItem('last_active_time')))>0);
            await page.evaluate(()=>{localStorage.setItem('last_active_time',Date.now()-25*3600000); __firebaseTest.options.signOutError=true;});
            await page.evaluate(()=>checkIdleTime());
            assert.equal(await page.evaluate(()=>__firebaseTest.signOutCalls),1);
            await page.evaluate(()=>resetIdleTimer());
            assert(Date.now()-Number(await page.evaluate(()=>localStorage.getItem('last_active_time')))<5000);
            await page.evaluate(()=>{__firebaseTest.options.signOutError=false;__firebaseTest.options.stallWrites=true;});
            await page.locator('#nav-user-profile').click();
            await page.waitForURL('http://127.0.0.1:4173/',{timeout:5000});
            assert.deepEqual(page.errors,[]);
        } finally { await page.close(); }
    });
    await test('Online configuration handles malformed data', async () => {
        const page = await open('index');
        try {
            for(const value of [{isAutoMode:false,min:'oops',max:null},{isAutoMode:false,min:100,max:2},{isAutoMode:false,min:0,max:0}]) {
                await page.evaluate(v=>__firebaseTest.emit('settings/online_counter',v),value);
                const count=Number(await page.locator('#online-count').innerText());
                assert(Number.isFinite(count) && count>=0);
            }
            assert.equal(await page.locator('#online-count').innerText(),'0');
            assert.deepEqual(page.errors,[]);
        } finally { await page.close(); }
    });
    await test('Practice: accounting quiz grading, retry, solutions, and failed cloud writes', async () => {
        const page = await open('NguyenLyKeToan-LuyenDe',{user,cloudError:true});
        try {
            const sets = await page.evaluate(()=>exerciseSets.map(s=>({id:s.id,mode:s.mode})));
            assert(sets.some(s=>s.mode==='mcq') && sets.some(s=>s.mode==='problem'));
            await page.evaluate(id=>openSet(id),sets.find(s=>s.mode==='mcq').id);
            await page.locator('#question-list button').first().click();
            assert.equal(await page.locator('#answered-count').innerText(),'1');
            await page.evaluate(()=>{for(const q of currentSet.questions) selectAnswer(q.id,q.answer);});
            await page.getByRole('button',{name:'Nộp bài',exact:true}).click();
            assert((await page.locator('#result-box').innerText()).includes('100%'));
            assert((await page.locator('#result-box').innerText()).includes('Kết quả đã được lưu'));
            await page.evaluate(()=>{resetCurrentQuiz();__firebaseTest.options.writeError=true;});
            await page.getByRole('button',{name:'Nộp bài',exact:true}).click();
            await page.waitForFunction(()=>document.getElementById('result-box').textContent.includes('Không thể lưu'));
            await checkLayout(page,'accounting practice results');
            await page.evaluate(id=>openSet(id),sets.find(s=>s.mode==='problem').id);
            await page.getByRole('button',{name:'Xem / Ẩn lời giải',exact:true}).click();
            assert(await page.locator('#problem-solution').isVisible());
            await checkLayout(page,'accounting problem solution');
            await page.locator('[onclick="closePracticePanel()"]').click();
            assert(await page.locator('#overview').isVisible());
            assert.deepEqual(page.errors,[]);
        } finally {await page.close();}
    });
    await test('Practice: finance quick quiz, exam, timer, mistakes, and restart', async () => {
        const page = await open('TCCN-LuyenDe');
        try {
            await page.locator('#mobile-nav').selectOption('quick');
            await page.locator('[onclick="startQuick20()"]').click();
            assert.equal(await page.evaluate(()=>currentSession.questions.length),20);
            await page.locator('#practice-content [onclick^="selectAnswer"]').first().click();
            assert.equal(await page.locator('#answered-num').innerText(),'1');
            await checkLayout(page,'finance quick question');
            await page.evaluate(()=>{finishStudySession();});
            assert(await page.locator('#result-box').isVisible());
            await page.evaluate(()=>{setWrongIds([]); startExam(0);});
            assert.equal(await page.evaluate(()=>currentSession.questions.length),50);
            const timer = await page.locator('#timer-pill').innerText();
            await page.waitForTimeout(1100);
            assert.notEqual(await page.locator('#timer-pill').innerText(),timer);
            await page.evaluate(()=>{const q=currentSession.questions[0];selectAnswer(q.id,q.answer);submitSession(false);});
            assert((await page.locator('#result-box').innerText()).includes('1/50'));
            assert.equal(await page.evaluate(()=>getAttempts().length),1);
            assert.equal(await page.evaluate(()=>getWrongIds().length),49);
            await page.locator('#mobile-nav').selectOption('mistakes');
            await checkLayout(page,'finance mistakes');
            await page.locator('[onclick="startMistakes()"]').click();
            assert.equal(await page.evaluate(()=>currentSession.questions.length),49);
            await page.evaluate(()=>restartCurrentSession());
            assert.equal(await page.evaluate(()=>Object.keys(selectedAnswers).length),0);
            await page.locator('[onclick="closePracticePanel()"]').click();
            assert.equal(await page.evaluate(()=>timerInterval),null);
            assert.deepEqual(page.errors,[]);
        } finally {await page.close();}
    });
    await test('Calculators, chart updates, flashcards and SWOT respond to input', async () => {
        const cases = [
            ['KinhTeQuocTe','ch5','labor-slider','12','stat-wage','8'],
            ['NguyenLyKeToan','ch3','t-ob-dr','125','t-cb-dr',null],
            ['QuanTriHoc','ch6','slider-task','9','val-task','9'],
            ['TaiChinhCaNhan','ch4','calc-assets','1000','ratio-output',null]
        ];
        for(const [file,chapter,input,value,output,expected] of cases) {
            const page=await open(file,{user});
            try {
                const id=await page.locator('#'+input).evaluate(e=>e.closest('.tab-content').id);
                await page.locator('#mobile-nav').selectOption(id);
                await page.locator('#'+input).fill(value);
                await page.locator('#'+input).dispatchEvent('input');
                if(file==='TaiChinhCaNhan') await page.locator('[onclick="calculateRatios()"]').click();
                const result = await page.locator('#'+output).innerText();
                assert(result && !/NaN|Infinity/.test(result));
                if(expected) assert(result.includes(expected),result);
                await checkLayout(page,file+' tool');
                if(file==='KinhTeQuocTe') assert.equal(await page.evaluate(()=>Chart.getChart('laborChart').data.datasets[0].data.length>0),true);
                if(file==='TaiChinhCaNhan') {
                    await page.locator('#mobile-nav').selectOption('overview');
                    await page.locator('.flip-card').first().click();
                    assert(await page.locator('.flip-card').first().evaluate(e=>e.classList.contains('flipped')));
                }
                assert.deepEqual(page.errors,[]);
            } finally {await page.close();}
        }
    });
    await test('Admin responsive controls and history modal', async () => {
        const page=await open('admin',{user:{...user,email:'tuannguyen3847@gmail.com'}});
        try {
            await checkLayout(page,'admin mobile');
            assert.equal(await page.locator('#manualMin').isDisabled(),false);
            await page.evaluate(() => {
                const trigger = document.createElement('button');
                trigger.id = 'history-test-trigger';
                trigger.textContent = 'Open history';
                document.body.appendChild(trigger);
                trigger.focus();
            });
            await page.evaluate(()=>viewLoginHistory('test-user','very.long.address.for.testing@example.test'));
            assert(await page.locator('#historyModal').isVisible());
            assert(await page.locator('#closeHistoryModalBtn').evaluate(e=>e===document.activeElement));
            await page.keyboard.press('Tab');
            assert(await page.locator('#closeHistoryModalBtn').evaluate(e=>e===document.activeElement));
            await page.keyboard.press('Shift+Tab');
            assert(await page.locator('#closeHistoryModalBtn').evaluate(e=>e===document.activeElement));
            await page.keyboard.press('Escape');
            assert(!await page.locator('#historyModal').isVisible());
            assert(await page.locator('#history-test-trigger').evaluate(e=>e===document.activeElement));
            await page.evaluate(()=>__firebaseTest.emit('settings/online_counter',{isAutoMode:true,min:40,max:50}));
            assert.equal(await page.locator('#manualMin').isDisabled(),true);
            assert.deepEqual(page.errors,[]);
        } finally {await page.close();}
        const failurePage=await open('admin',{
            user:{...user,email:'tuannguyen3847@gmail.com'},
            listenerErrorPaths:['settings/online_counter'],
            onceErrorPaths:['users/test-user/login_history']
        });
        try {
            await failurePage.waitForFunction(()=>document.getElementById('saveStatus').textContent.includes('Không thể tải'));
            await failurePage.evaluate(()=>viewLoginHistory('test-user','student@example.test'));
            await failurePage.waitForFunction(()=>document.getElementById('historyList').textContent.includes('Không thể tải'));
            await failurePage.locator('#closeHistoryModalBtn').click();
            await failurePage.evaluate(()=>{__firebaseTest.options.writeError=true;});
            await failurePage.locator('#autoModeToggle').uncheck();
            await failurePage.locator('#manualMin').fill('40');
            await failurePage.locator('#manualMax').fill('50');
            await failurePage.evaluate(()=>updateOnlineConfig());
            await failurePage.waitForFunction(()=>document.getElementById('saveStatus').textContent.includes('Không thể lưu'));
            const writesBefore = await failurePage.evaluate(()=>__firebaseTest.writes.length);
            await failurePage.locator('#manualMin').fill('60');
            await failurePage.locator('#manualMax').fill('50');
            await failurePage.evaluate(()=>updateOnlineConfig());
            assert((await failurePage.locator('#saveStatus').innerText()).includes('Min ≤ Max'));
            assert.equal(await failurePage.evaluate(()=>__firebaseTest.writes.length),writesBefore);
            await checkLayout(failurePage,'admin request failures');
            assert.deepEqual(failurePage.errors,[]);
        } finally {await failurePage.close();}
    });
    await browser.close();
    fs.writeFileSync(path.join(__dirname,'regression-results.json'),JSON.stringify(results,null,2));
    if(results.some(r=>!r.pass)) process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
