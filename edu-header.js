/*
 * Edu Connect subject header platform.
 *
 * Load contract:
 *   1. Define window.EDU_PAGE_CONFIG.
 *   2. Load this file with defer.
 *   3. Load auth.js with defer after this file.
 *
 * The component owns header rendering and configured subject-tab state only.
 * Firebase authentication state remains owned by auth.js.
 */
(function initializeEduHeader() {
    'use strict';

    const config = window.EDU_PAGE_CONFIG;
    const mount = document.getElementById('edu-header');

    function fail(message) {
        console.error(`[EduHeader] ${message}`);
    }

    if (!mount) {
        fail('Missing #edu-header mount element.');
        return;
    }
    if (!config || typeof config !== 'object') {
        fail('window.EDU_PAGE_CONFIG must be defined before edu-header.js loads.');
        return;
    }

    const subject = String(config.subject || '').trim();
    const shortName = String(config.shortName || subject).trim();
    const icon = String(config.icon || '📚').trim();
    const route = String(config.route || window.location.pathname).trim();
    const chapters = Array.isArray(config.chapters)
        ? config.chapters.map(chapter => ({
            id: String(chapter?.id || '').trim(),
            shortLabel: String(chapter?.shortLabel || '').trim(),
            mobileLabel: String(chapter?.mobileLabel || chapter?.shortLabel || '').trim()
        }))
        : [];
    const chapterIds = chapters.map(chapter => chapter.id);
    const defaultTab = String(config.defaultTab || chapterIds[0] || '').trim();

    if (!subject || !shortName || !route) {
        fail('subject, shortName, and route must be non-empty strings.');
        return;
    }
    if (!chapters.length || chapters.some(chapter => !chapter.id || !chapter.shortLabel || !chapter.mobileLabel)) {
        fail('chapters must contain id, shortLabel, and mobileLabel.');
        return;
    }
    if (new Set(chapterIds).size !== chapterIds.length) {
        fail('Chapter IDs must be unique.');
        return;
    }
    if (!chapterIds.includes(defaultTab)) {
        fail('defaultTab must match a configured chapter ID.');
        return;
    }

    function element(tagName, className, text) {
        const node = document.createElement(tagName);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    const nav = element('nav', 'edu-subject-header glass-panel border-b border-stone-200 shadow-sm');
    nav.dataset.route = route;
    const container = element('div', 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8');
    const headerRow = element('div', 'site-header-row flex justify-between items-center h-16');

    const homeLink = element('a', 'edu-header-brand flex items-center gap-1 sm:gap-1.5 hover:opacity-80 transition-opacity group min-w-0');
    homeLink.href = '/';
    homeLink.setAttribute('aria-label', 'Về trang chủ Edu Connect');
    const logo = element('img', 'h-8 w-8 sm:h-10 sm:w-10 object-contain rounded-full shadow-sm border border-stone-200 group-hover:scale-105 transition-transform shrink-0');
    logo.src = '/android-chrome-192x192.png';
    logo.alt = 'Edu Connect';
    const brandCopy = element('div', 'edu-header-brand-copy flex flex-col justify-center min-w-0');
    brandCopy.appendChild(element('span', 'edu-header-name font-extrabold tracking-tight leading-none', 'EDU CONNECT'));
    const subjectLine = element('span', 'edu-header-subject text-[10px] sm:text-xs text-teal-700 font-bold uppercase tracking-wider mt-1');
    subjectLine.title = subject;
    subjectLine.appendChild(element('span', 'edu-header-subject-icon', icon));
    subjectLine.appendChild(document.createTextNode(` ${shortName}`));
    brandCopy.appendChild(subjectLine);
    homeLink.append(logo, brandCopy);

    const controls = element('div', 'edu-header-controls flex items-center shrink-0');
    const onlineBadge = element('div', 'flex px-2 sm:px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs sm:text-sm font-bold border border-green-200 items-center mr-2 sm:mr-4');
    onlineBadge.setAttribute('aria-label', 'Số người đang học trực tuyến');
    onlineBadge.appendChild(element('span', 'w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full mr-1.5 sm:mr-2 animate-pulse'));
    const onlineCount = element('span', 'mr-1', '...');
    onlineCount.id = 'online-count';
    onlineBadge.appendChild(onlineCount);
    onlineBadge.appendChild(element('span', 'hidden sm:inline', 'online'));

    const authArea = element('div', 'border-l border-stone-300 pl-3 sm:pl-4');
    const loginButton = element('button', 'hidden text-sm font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg border border-teal-200 transition-colors', 'Đăng nhập');
    loginButton.id = 'nav-login-btn';
    loginButton.type = 'button';
    loginButton.addEventListener('click', () => {
        if (typeof window.requestLogin === 'function') window.requestLogin();
        else if (typeof window.loginGoogleReal === 'function') window.loginGoogleReal();
    });

    const profile = element('div', 'hidden flex items-center gap-2 cursor-pointer group');
    profile.id = 'nav-user-profile';
    profile.setAttribute('role', 'button');
    profile.setAttribute('tabindex', '0');
    profile.setAttribute('aria-label', 'Đăng xuất');
    profile.title = 'Đăng xuất';
    profile.addEventListener('click', () => window.logoutReal?.());
    const avatar = element('img', 'w-8 h-8 rounded-full shadow-sm border border-teal-200 object-cover shrink-0');
    avatar.id = 'user-avatar';
    avatar.src = '/android-chrome-192x192.png';
    avatar.alt = 'Avatar';
    const userName = element('span', 'text-sm font-bold text-slate-800 hidden sm:block whitespace-nowrap', 'Sinh Viên');
    userName.id = 'user-name';
    profile.append(avatar, userName);
    authArea.append(loginButton, profile);
    controls.append(onlineBadge, authArea);
    headerRow.append(homeLink, controls);

    const desktopNav = element('div', 'chapter-nav');
    desktopNav.id = 'nav-menu';
    desktopNav.setAttribute('role', 'navigation');
    desktopNav.setAttribute('aria-label', `Điều hướng chương: ${subject}`);

    chapters.forEach(chapter => {
        const button = element('button', 'nav-btn px-3 py-2 text-xs 2xl:text-sm font-medium text-stone-500 transition-colors hover:text-teal-600', chapter.shortLabel);
        button.type = 'button';
        button.dataset.eduTab = chapter.id;
        button.setAttribute('aria-controls', chapter.id);
        button.addEventListener('click', () => switchTab(chapter.id));
        desktopNav.appendChild(button);

        button.title = chapter.mobileLabel;
    });
    container.append(headerRow, desktopNav);
    nav.appendChild(container);
    mount.replaceChildren(nav);
    mount.dataset.eduRoute = route;

    // The sticky mount moves up by exactly the brand-row height. This keeps
    // document geometry stable while the chapter strip settles at the top.
    let scrollFrame = 0;
    function syncScrollState() {
        scrollFrame = 0;
        const compact = window.scrollY >= headerRow.offsetHeight;
        mount.classList.toggle('edu-header-compact', compact);
        headerRow.inert = compact;
    }
    window.addEventListener('scroll', () => {
        if (!scrollFrame) scrollFrame = requestAnimationFrame(syncScrollState);
    }, { passive: true });
    syncScrollState();

    let activeTab = null;
    function switchTab(tabId, options = {}) {
        if (!chapterIds.includes(tabId)) return false;
        const target = document.getElementById(tabId);
        if (!target) return false;

        chapters.forEach(chapter => {
            const section = document.getElementById(chapter.id);
            if (!section) return;
            const isActive = chapter.id === tabId;
            section.classList.remove('animate-fade-in');
            section.classList.toggle('hidden', !isActive);
            section.classList.toggle('block', isActive);
        });
        if (options.animate !== false) {
            // Removing the class above and forcing layout lets repeated selections
            // restart the CSS animation instead of reusing its completed state.
            void target.offsetWidth;
            target.classList.add('animate-fade-in');
        }
        desktopNav.querySelectorAll('[data-edu-tab]').forEach(button => {
            const isActive = button.dataset.eduTab === tabId;
            button.classList.toggle('tab-active', isActive);
            button.classList.toggle('text-stone-500', !isActive);
            if (isActive) button.setAttribute('aria-current', 'page');
            else button.removeAttribute('aria-current');
        });
        activeTab = tabId;
        const selectedButton = desktopNav.querySelector(`[data-edu-tab="${CSS.escape(tabId)}"]`);
        if (selectedButton) {
            const stripRect = desktopNav.getBoundingClientRect();
            const buttonRect = selectedButton.getBoundingClientRect();
            if (buttonRect.left < stripRect.left || buttonRect.right > stripRect.right) {
                desktopNav.scrollTo({
                    left: desktopNav.scrollLeft + buttonRect.left - stripRect.left - (stripRect.width - buttonRect.width) / 2,
                    behavior: 'instant'
                });
            }
        }

        if (options.scroll !== false) {
            const offset = desktopNav.getBoundingClientRect().height + 16;
            const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset);
            const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            window.scrollTo({ top, behavior: options.behavior || (reducedMotion ? 'instant' : 'smooth') });
        }
        if (options.notify !== false) {
            if (typeof window.onEduTabChanged === 'function') window.onEduTabChanged(tabId);
            window.dispatchEvent(new CustomEvent('edu:tabchange', { detail: { tabId, route } }));
        }
        return true;
    }

    window.attemptSwitchTab = tabId => switchTab(tabId);
    window.EduHeader = Object.freeze({
        config: Object.freeze({ subject, shortName, icon, route, defaultTab, chapters: Object.freeze(chapters) }),
        get activeTab() { return activeTab; },
        switchTab
    });
    switchTab(defaultTab, { scroll: false, notify: false, animate: false });
    window.dispatchEvent(new CustomEvent('edu:headerready', { detail: { route, defaultTab } }));
})();
