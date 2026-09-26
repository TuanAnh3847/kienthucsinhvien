/* Progressive enhancement for short classification activities.
 * Existing select values and page-owned checking/reset logic remain authoritative.
 */
(function enhanceStudyChoices() {
    const practiceRoutes = {
        '/NLKT': '/NguyenLyKeToan-LuyenDe',
        '/TCCN': '/TCCN-LuyenDe',
        '/KTQT': '/KTQT-LuyenDe',
        '/NMLH': '/NhapMonLuatHoc-LuyenDe'
    };
    const practiceRoute = practiceRoutes[window.EDU_PAGE_CONFIG?.route];
    const intro = document.getElementById('course-intro') || document.querySelector('main > div.text-center');
    if (practiceRoute && intro) {
        const link = document.createElement('a');
        link.href = practiceRoute;
        link.className = 'study-practice-link';
        link.textContent = 'Luyện đề và tự kiểm tra →';
        intro.appendChild(link);
    }
    const groups = [];
    document.querySelectorAll('main .quiz-row, main .match-row').forEach((row, index) => {
        const selects = row.querySelectorAll('select');
        if (selects.length !== 1) return;
        const select = selects[0];
        const options = [...select.options].filter(option => option.value !== '');
        if (select.multiple || options.length < 2 || options.length > 4 ||
            options.some(option => option.textContent.trim().length > 30) ||
            options.reduce((length, option) => length + option.textContent.trim().length, 0) > 85) return;

        const group = document.createElement('fieldset');
        group.className = 'edu-choice-group';
        const legend = document.createElement('legend');
        legend.className = 'edu-visually-hidden';
        legend.textContent = select.getAttribute('aria-label') ||
            row.querySelector('.quiz-prompt, p, strong')?.textContent || 'Chọn nhóm phù hợp';
        group.appendChild(legend);

        options.forEach(option => {
            const label = document.createElement('label');
            label.className = 'edu-choice';
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = `edu-choice-${index}`;
            radio.value = option.value;
            const text = document.createElement('span');
            text.textContent = option.textContent;
            label.append(radio, text);
            group.appendChild(label);
            radio.addEventListener('change', () => {
                if (!radio.checked) return;
                select.value = radio.value;
                select.dispatchEvent(new Event('input', { bubbles: true }));
                select.dispatchEvent(new Event('change', { bubbles: true }));
            });
        });
        const sync = () => {
            group.querySelectorAll('input').forEach(radio => {
                radio.checked = radio.value === select.value;
                radio.disabled = select.disabled || options.find(option => option.value === radio.value).disabled;
            });
        };
        select.addEventListener('change', sync);
        select.after(group);
        select.classList.add('edu-choice-source');
        select.hidden = true;
        row.classList.add('edu-choice-row');
        groups.push(sync);
        sync();
    });

    // Page-owned reset/check handlers run on buttons before the event bubbles
    // here. Do not synchronize label clicks before native radio activation.
    document.addEventListener('click', event => {
        if (event.target.closest('button')) groups.forEach(sync => sync());
    });
    document.addEventListener('reset', () => setTimeout(() => groups.forEach(sync => sync()), 0));

    document.querySelectorAll('.quiz-list, .quiz-grid, .matching, .match-list').forEach(list => {
        const rows = [...list.children].filter(row => row.matches('.quiz-row, .match-row'));
        if (rows.length > 1 && rows.every(row => row.classList.contains('edu-choice-row'))) {
            list.classList.add('edu-compact-activity');
        }
    });
})();
