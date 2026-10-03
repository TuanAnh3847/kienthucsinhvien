/* Progressive reading tools. Existing course and practice handlers own state. */
(function enhanceReading() {
    'use strict';
    function start() {
        const config = window.EDU_PAGE_CONFIG;
        if (config?.route) document.body.classList.add('edu-route-' + config.route.slice(1));
        const header = document.getElementById('edu-header');
        const mapLauncher = document.querySelector('.course-map-fab');
        const headerContainer = header?.querySelector('.edu-subject-header > div');
        if (mapLauncher && headerContainer) headerContainer.append(mapLauncher);
        // Rotate only the flow symbol on phones; relationship labels stay horizontal.
        document.querySelectorAll('body.edu-route-KTTC .flow-arrow').forEach(arrow => {
            [...arrow.childNodes].filter(node => node.nodeType===Node.TEXT_NODE && node.textContent.includes('→')).forEach(node => {
                const symbol = document.createElement('span');
                symbol.className = 'edu-flow-symbol';
                symbol.textContent = node.textContent;
                node.replaceWith(symbol);
            });
        });
        // Keep the source percentages proportional; put labels below narrow segments.
        document.querySelectorAll('body.edu-route-VHDDTKD .barstack').forEach(bar => {
            const legend = document.createElement('div');
            legend.className = 'edu-data-legend';
            [...bar.children].forEach(segment => {
                const label = document.createElement('span');
                label.textContent = segment.textContent;
                segment.setAttribute('aria-label', segment.textContent);
                segment.textContent = '';
                legend.append(label);
            });
            bar.after(legend);
        });
        const updateOffset = () => document.documentElement.style.setProperty('--edu-visible-header', `${Math.max(0,header?.getBoundingClientRect().bottom || 0)}px`);
        window.addEventListener('scroll', updateOffset, {passive:true});
        window.addEventListener('resize', updateOffset);
        updateOffset();

        if (document.body.classList.contains('edu-study-page')) {
            let navigation = 0;
            const nextLayout = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            async function navigateHeading(heading) {
                const section = heading.closest('main .tab-content');
                if (!section || !window.EduHeader) return;
                const current = ++navigation;
                if (window.EduHeader.activeTab !== section.id) {
                    window.EduHeader.switchTab(section.id, {scroll:false, animate:false});
                }
                // Open every enclosing disclosure, including nested source examples.
                for (let parent = heading.parentElement; parent && parent !== section; parent = parent.parentElement) {
                    if (parent.tagName === 'DETAILS') parent.open = true;
                }
                await document.fonts?.ready;
                await nextLayout();
                if (current !== navigation || window.EduHeader.activeTab !== section.id) return;
                updateOffset();
                heading.scrollIntoView({block:'start', behavior:'instant'});
                await nextLayout();
                if (current !== navigation || window.EduHeader.activeTab !== section.id) return;
                // Sticky header bounds can change after the first scroll.
                updateOffset();
                const clearance = Math.max(0, header?.getBoundingClientRect().bottom || 0) + 24;
                window.scrollBy({top:heading.getBoundingClientRect().top - clearance, behavior:'instant'});
                heading.tabIndex = -1;
                heading.focus({preventScroll:true});
            }
            function restoreFragment() {
                ++navigation;
                let id;
                try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
                const heading = id ? document.getElementById(id) : null;
                // Only real headings in a configured reading section are destinations.
                if (heading?.matches('h1,h2,h3,h4,h5,h6') && heading.closest('main .tab-content')) {
                    void navigateHeading(heading);
                }
            }
            document.querySelectorAll('main .tab-content').forEach(section => {
                const headings = [...section.querySelectorAll('h3')].filter(h => h.textContent.trim() && !h.closest('.flip-card,.flip-card-local'));
                if (headings.length < 3) return;
                const toc = document.createElement('details');
                toc.className = 'edu-chapter-toc';
                const summary = document.createElement('summary');
                summary.textContent = 'Trong chương này';
                const list = document.createElement('ol');
                headings.forEach((heading,index) => {
                    if (!heading.id) {
                        let id = `edu-reading-${section.id}-${index + 1}`;
                        while (document.getElementById(id)) id += '-section';
                        heading.id = id;
                    }
                    heading.classList.add('edu-reading-anchor');
                    const li = document.createElement('li');
                    const link = document.createElement('a');
                    link.href = '#' + encodeURIComponent(heading.id);
                    link.textContent = heading.textContent.trim();
                    link.addEventListener('click', event => {
                        event.preventDefault();
                        history.replaceState(null,'','#'+encodeURIComponent(heading.id));
                        void navigateHeading(heading);
                    });
                    li.append(link); list.append(li);
                });
                toc.append(summary,list);
                const opening = section.querySelector(':scope > .chapter-opening,:scope > h2,:scope > header');
                if (opening) opening.after(toc); else section.prepend(toc);
            });
            window.addEventListener('hashchange', restoreFragment);
            if (window.EduHeader) restoreFragment();
            else window.addEventListener('edu:headerready', restoreFragment, {once:true});
        }

        // Keep the three-column operant comparison intact in its own scroll region.
        document.querySelectorAll('.matrix4').forEach(matrix => {
            if (matrix.parentElement.classList.contains('edu-matrix-scroll')) return;
            const wrap = document.createElement('div');
            wrap.className = 'scroll-table edu-matrix-scroll';
            matrix.before(wrap); wrap.append(matrix);
            matrix.setAttribute('role','table');
            matrix.setAttribute('aria-label','Ma trận điều kiện hóa thao tác: hệ quả, củng cố và trừng phạt');
            const cells = [...matrix.children];
            for (let index=0; index<cells.length; index+=3) {
                const row = document.createElement('div');
                row.setAttribute('role','row');
                row.style.display = 'contents';
                cells.slice(index,index+3).forEach((cell,column) => {
                    cell.setAttribute('role',index===0?'columnheader':column===0?'rowheader':'cell');
                    cell.setAttribute('aria-colindex',String(column+1));
                    row.append(cell);
                });
                matrix.append(row);
            }
        });
        let scheduled = false;
        function refresh() {
            scheduled = false;
            // Preserve numeric tokens as one item while their table scrolls locally.
            document.querySelectorAll('main td,main th,#practice-content td,#practice-content th').forEach(cell => {
                cell.classList.toggle('edu-number-cell', /^[+−-]?(?:\d[\d,.]*(?:\s*%|\s*(?:USD|VND|đồng|million|billion))?)$/.test(cell.textContent.trim()));
            });
            document.querySelectorAll('main .flip-card,main .flip-card-local').forEach(card => {
                const flipped = card.classList.contains('flipped') || card.classList.contains('is-flipped');
                card.setAttribute('aria-pressed', String(flipped));
                const inner = card.querySelector('.flip-inner,.flip-inner-local');
                if (!inner) return;
                [...inner.children].forEach((face,i) => {
                    face.setAttribute('aria-hidden', String(i===0?flipped:!flipped));
                    face.inert = i===0?flipped:!flipped;
                });
            });
            const scrollRegions = new Set(document.querySelectorAll('main .scroll-table,main .table-wrap,main .table-scroll,main .timeline,main .emotion-7,main .graph-shell,main .svg-shell,main .chapter-map-flow'));
            document.querySelectorAll('main div,main figure,main section,main pre').forEach(node => {
                if (/auto|scroll/.test(getComputedStyle(node).overflowX) && node.scrollWidth > node.clientWidth + 2) scrollRegions.add(node);
            });
            scrollRegions.forEach(wrap => {
                const wide = wrap.scrollWidth > wrap.clientWidth + 2 && wrap.clientWidth > 0;
                let cue = wrap.previousElementSibling;
                if (!cue?.classList.contains('edu-scroll-cue')) {
                    cue = document.createElement('span'); cue.className = 'edu-scroll-cue';
                    cue.textContent = '↔ Cuộn ngang để xem phần còn lại';
                    wrap.before(cue);
                }
                cue.hidden = !wide;
                if (wide) {
                    wrap.classList.add('edu-scroll-region');
                    wrap.tabIndex = 0;
                    wrap.setAttribute('role','region');
                    wrap.setAttribute('aria-label',wrap.querySelector('caption')?.textContent.trim() || 'Nội dung có thể cuộn ngang');
                } else wrap.removeAttribute('tabindex');
                wrap.querySelectorAll('thead th:not([scope])').forEach(th=>th.scope='col');
            });
        }
        function schedule() { if (!scheduled) { scheduled = true; requestAnimationFrame(refresh); } }
        const observer = new MutationObserver(records => {
            if (records.some(r=>r.type==='childList' && [...r.addedNodes].some(n=>n.nodeType===1 && !n.classList.contains('edu-scroll-cue')) || r.type==='attributes' && r.target.matches('.flip-card,.flip-card-local,.tab-content'))) schedule();
        });
        const main = document.querySelector('main');
        if (main) observer.observe(main,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
        window.addEventListener('resize',schedule);
        window.addEventListener('edu:tabchange',schedule);
        document.fonts?.ready.then(schedule);
        refresh();

        // The existing modal open/close functions remain the public interface.
        const modal = document.getElementById('course-map-modal');
        if (modal && typeof window.openCourseMap==='function') {
            const open = window.openCourseMap;
            const close = window.closeCourseMap;
            let returnFocus;
            window.openCourseMap = () => { returnFocus=document.activeElement; open(); modal.querySelector('button')?.focus(); };
            window.closeCourseMap = () => { close(); returnFocus?.focus(); };
            modal.addEventListener('keydown',event => {
                if (event.key==='Escape') { event.preventDefault(); window.closeCourseMap(); }
                if (event.key!=='Tab') return;
                const focusable=[...modal.querySelectorAll('a[href],button,[tabindex="0"]')].filter(e=>!e.disabled && e.getClientRects().length);
                const first=focusable[0],last=focusable.at(-1);
                if (event.shiftKey && document.activeElement===first) {event.preventDefault();last?.focus();}
                if (!event.shiftKey && document.activeElement===last) {event.preventDefault();first?.focus();}
            });
        }
    }
    if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();
