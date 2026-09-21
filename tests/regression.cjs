const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const fixture = fs.readFileSync(path.join(__dirname, 'firebase-fixture.js'), 'utf8');
const root = path.resolve(__dirname, '..');
const subjects = [
    'KE_TOAN_TAI_CHINH.html',
    'KINH_TE_QUOC_TE.html',
    'KinhTeChinhTriMacLeNin.html',
    'LUAT_THUONG_MAI_QUOC_TE.html',
    'NGUYEN_LY_KE_TOAN.html',
    'NGUYEN_LY_THI_TRUONG_TAI_CHINH.html',
    'NhapMonLuatHoc.html',
    'PHAT_TRIEN_BEN_VUNG.html',
    'SANG_TAO_KHOI_NGHIEP.html',
    'TAI_CHINH_CA_NHAN.html',
    'TAM_LY_UNG_DUNG.html',
    'VAN_HOA_VA_DAO_DUC_TRONG_KINH_DOANH_QUOC_TE.html'
];
const theoryRoutes = {
    'KE_TOAN_TAI_CHINH.html':'KTTC',
    'KINH_TE_QUOC_TE.html':'KTQT',
    'KinhTeChinhTriMacLeNin.html':'KTCTMLN',
    'LUAT_THUONG_MAI_QUOC_TE.html':'LTMQT',
    'NGUYEN_LY_KE_TOAN.html':'NLKT',
    'NGUYEN_LY_THI_TRUONG_TAI_CHINH.html':'NLTTTC',
    'NhapMonLuatHoc.html':'NMLH',
    'PHAT_TRIEN_BEN_VUNG.html':'PTBV',
    'SANG_TAO_KHOI_NGHIEP.html':'STKN',
    'TAI_CHINH_CA_NHAN.html':'TCCN',
    'TAM_LY_UNG_DUNG.html':'TLUD',
    'VAN_HOA_VA_DAO_DUC_TRONG_KINH_DOANH_QUOC_TE.html':'VHDDTKD'
};
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
    for (const file of subjects) {
        const source = fs.readFileSync(path.join(root, file), 'utf8');
        assert(/window\.EDU_PAGE_CONFIG\s*=\s*\{/.test(source), file + ' must define EDU_PAGE_CONFIG');
        assert(source.includes('<div id="edu-header"></div>'), file + ' must provide the shared header mount');
        assert(/<script\s+defer(?:="")?\s+src="\/edu-header\.js"><\/script>/.test(source), file + ' must load edu-header.js');
        assert(!source.includes('id="nav-menu"'), file + ' must not retain a static desktop nav');
        assert(!source.includes('id="mobile-nav"'), file + ' must not retain a static mobile nav');
        assert(!/function\s+(?:attemptSwitchTab|forceSwitchTab)\s*\(/.test(source), file + ' must not retain page-owned tab switching');
    }
    browser = await chromium.launch({channel:process.env.BROWSER_CHANNEL || 'msedge',headless:true});
    for (const file of subjects) await test(file + ': chapters, headers, tools and profile', async () => {
        const page = await open(theoryRoutes[file], {user});
        try {
            assert.equal(new URL(page.url()).pathname, '/' + theoryRoutes[file], file + ' short public route');
            const contract = await page.evaluate(() => ({
                config: window.EDU_PAGE_CONFIG,
                api: !!window.EduHeader,
                route: document.getElementById('edu-header')?.dataset.eduRoute,
                home: document.querySelector('.edu-header-brand')?.getAttribute('href'),
                subject: document.querySelector('.edu-header-subject')?.title,
                ids: ['online-count','nav-login-btn','nav-user-profile','user-avatar','user-name','nav-menu'].every(id => !!document.getElementById(id)),
                buttonIds: [...document.querySelectorAll('#nav-menu [data-edu-tab]')].map(el => el.dataset.eduTab),
                buttonLabels: [...document.querySelectorAll('#nav-menu [data-edu-tab]')].map(el => el.textContent.trim())
            }));
            assert(contract.api, file + ' shared API');
            assert(contract.ids, file + ' stable auth and navigation IDs');
            assert.equal(contract.route, contract.config.route);
            assert.equal(contract.home, '/');
            assert.equal(contract.subject, contract.config.subject);
            assert.deepEqual(contract.buttonIds, contract.config.chapters.map(chapter => chapter.id));
            assert.deepEqual(contract.buttonLabels, contract.config.chapters.map(chapter => chapter.shortLabel));
            assert(await page.locator('#nav-user-profile').isVisible());
            assert(!await page.locator('#nav-login-btn').isVisible());
            const options = contract.config.chapters.map(chapter => chapter.id);
            assert.equal(await page.evaluate(()=>window.EduHeader.activeTab),contract.config.defaultTab);
            assert.equal(await page.locator('#'+contract.config.defaultTab).evaluate(el=>el.classList.contains('animate-fade-in')),false,'initial tab must not animate');
            for (const width of [375,768,1280,1440]) {
                await page.setViewportSize({width,height:812});
                for (const id of options) {
                    await page.locator(`#nav-menu [data-edu-tab="${id}"]`).click();
                    assert(await page.locator('#'+id).isVisible(),file+' chapter '+id);
                    assert.equal(await page.locator(`#nav-menu [data-edu-tab="${id}"]`).getAttribute('aria-current'),'page');
                    assert.equal(await page.evaluate(()=>window.EduHeader.activeTab),id);
                    const visibleChapters = await page.locator('.tab-content').evaluateAll(els=>els.filter(e=>getComputedStyle(e).display!=='none').length);
                    assert.equal(visibleChapters,1);
                    assert.deepEqual(await page.locator('.tab-content.animate-fade-in').evaluateAll((els,chapterIds)=>els.map(el=>el.id).filter(tabId=>chapterIds.includes(tabId)),options),[id]);
                    await checkLayout(page,file+' '+width+' '+id);
                }
                assert.equal(await page.locator('#mobile-nav').count(),0,'no chapter dropdown');
                assert(await page.locator('#nav-menu').isVisible(),'chapter strip at every width');
            }
            if (file === 'KINH_TE_QUOC_TE.html') {
                const replay = await page.evaluate(async () => {
                    const target = document.getElementById('ch3');
                    window.EduHeader.switchTab('ch3', { scroll: false });
                    const classChanges = [];
                    const observer = new MutationObserver(records => classChanges.push(...records));
                    observer.observe(target, { attributes: true, attributeFilter: ['class'] });
                    window.EduHeader.switchTab('ch3', { scroll: false });
                    await Promise.resolve();
                    observer.disconnect();
                    return { classChanges: classChanges.length, animated: target.classList.contains('animate-fade-in') };
                });
                assert(replay.classChanges >= 2,'repeated tab switch must remove and restore the animation class');
                assert(replay.animated,'repeated tab switch must finish with animation enabled');
                await page.evaluate(() => window.EduHeader.switchTab('ch3', { scroll: false }));
                assert(await page.locator('#importTariffSvg').isVisible(),'tariff replay visual must remain visible after tab switches');
                assert(await page.locator('#importTariffSvg > *').count()>0,'tariff replay visual must retain rendered SVG content');
            }
            // Exercise each course's calculators with their existing default inputs.
            const calls = {
                'KE_TOAN_TAI_CHINH.html':['calcNRV()','buildPL()','calcCashFlow()'],
                'KINH_TE_QUOC_TE.html':['importTariffReplay()','quotaReplay()','subsidyReplay()'],
                'KinhTeChinhTriMacLeNin.html':['KTCT.calcW()','KTCT.calcM()','KTCT.calcSurplus()'],
                'NGUYEN_LY_KE_TOAN.html':['renderCoa()','renderFormulaReview()','calcProductionCost()'],
                'NGUYEN_LY_THI_TRUONG_TAI_CHINH.html':['calcExpectedReturn()','calcSimpleInterest()'],
                'PHAT_TRIEN_BEN_VUNG.html':['openCourseMap()','closeCourseMap()'],
                'TAI_CHINH_CA_NHAN.html':['calcBalanceSheet()','calcFV()','calcSolvency()'],
                'VAN_HOA_VA_DAO_DUC_TRONG_KINH_DOANH_QUOC_TE.html':[]
            }[file] || [];
            for(const call of calls) await page.evaluate(code=>window.eval(code),call);
            if (file === 'VAN_HOA_VA_DAO_DUC_TRONG_KINH_DOANH_QUOC_TE.html') {
                await page.evaluate(() => window.EduHeader.switchTab('ch1', { scroll: false }));
                await page.locator('[data-layer="tree"]').click();
                assert(await page.locator('#layer-stage').isVisible());
                await page.evaluate(() => window.EduHeader.switchTab('ch2', { scroll: false }));
                await page.locator('#hof-high').click();
                assert(await page.locator('#hofstede-output').isVisible());
            }
            assert.deepEqual(page.errors,[]);
            assert.equal(await page.evaluate(()=>__firebaseTest.authListenerCount()),1,'shared auth only');
            await page.setViewportSize({width:375,height:812});
            await page.locator(`#nav-menu [data-edu-tab="${options[0]}"]`).click();
            await page.waitForTimeout(500);
            await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
            await page.screenshot({path:path.join(__dirname,'screenshots',file.replace('.html','')+'-mobile.png')});
        } finally { await page.close(); }
    });
    await test('Guest modal focus, short viewport, Escape and clean routes', async () => {
        const page = await open('KTQT');
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
        const page = await open('KTQT');
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
        const page = await open('KTQT',{popupError:'auth/popup-closed-by-user'});
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
        const page = await open('TCCN',{user});
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
            const theoryHrefs = await page.locator('a.course-card').evaluateAll(links => links.map(link => link.getAttribute('href')));
            assert.deepEqual(theoryHrefs.sort(), Object.values(theoryRoutes).map(route => '/' + route).sort());
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
            assert.equal(await page.getByRole('link',{name:'Xem lý thuyết'}).getAttribute('href'),'/TCCN');
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
    await test('Current subject calculators and visual replays respond to input', async () => {
        const cases = [
            {file:'KTQT',values:{importT:'1.5'},output:'importTariffResult',invoke:'importTariffReplay()'},
            {file:'KTTC',values:{nrvQty:'9000'},output:'nrvOut',invoke:'calcNRV()'},
            {file:'NLKT',values:{'pc-open':'100','pc-incurred':'500','pc-close':'50','pc-units':'10'},output:'pc-result',invoke:'calcProductionCost()'},
            {file:'NLTTTC',values:{'si-p':'100','si-i':'10','si-t':'3'},output:'si-result',invoke:'calcSimpleInterest()'},
            {file:'TCCN',values:{'fv-pv':'100','fv-i':'10','fv-n':'3'},output:'fv-result',invoke:'calcFV()'}
        ];
        for(const {file,values,output,invoke} of cases) {
            const page=await open(file,{user});
            try {
                const firstInput=Object.keys(values)[0];
                const id=await page.locator('#'+firstInput).evaluate(e=>e.closest('.tab-content').id);
                await page.locator(`#nav-menu [data-edu-tab="${id}"]`).click();
                for(const [input,value] of Object.entries(values)) await page.locator('#'+input).fill(value);
                await page.evaluate(code=>window.eval(code),invoke);
                const result = await page.locator('#'+output).innerText();
                assert(result && !/NaN|Infinity/.test(result));
                await checkLayout(page,file+' tool');
                if(file==='KTQT') assert(await page.locator('#importTariffSvg > *').count()>0);
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
