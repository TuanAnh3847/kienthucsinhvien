/* Progressive reading tools. Existing course and practice handlers own state. */
(function enhanceReading() {
    'use strict';
    function start() {
        const config = window.EDU_PAGE_CONFIG;
        if (config?.route) document.body.classList.add('edu-route-' + config.route.slice(1));
        const header = document.getElementById('edu-header');
        const updateOffset = () => document.documentElement.style.setProperty('--edu-visible-header', `${Math.max(0,header?.getBoundingClientRect().bottom || 0)}px`);
        window.addEventListener('scroll', updateOffset, {passive:true});
        window.addEventListener('resize', updateOffset);
        updateOffset();

        if (document.body.classList.contains('edu-study-page')) {
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
                    link.href = '#' + heading.id;
                    link.textContent = heading.textContent.trim();
                    link.addEventListener('click', event => {
                        event.preventDefault();
                        updateOffset();
                        heading.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
                        heading.tabIndex = -1;
                        heading.focus({preventScroll:true});
                        history.replaceState(null,'','#'+heading.id);
                    });
                    li.append(link); list.append(li);
                });
                toc.append(summary,list);
                const opening = section.querySelector(':scope > .chapter-opening,:scope > h2,:scope > header');
                if (opening) opening.after(toc); else section.prepend(toc);
            });
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
