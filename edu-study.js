/* Progressive enhancement for short classification activities.
 * Existing select values and page-owned checking/reset logic remain authoritative.
 */
(function enhanceStudyChoices() {
    'use strict';
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

    // Existing reset/check buttons may assign select.value without emitting change.
    // Run after their handlers, including keyboard-activated clicks and form resets.
    const syncAfterAction = () => queueMicrotask(() => groups.forEach(sync => sync()));
    document.addEventListener('click', syncAfterAction);
    document.addEventListener('reset', syncAfterAction);

    document.querySelectorAll('.quiz-list, .quiz-grid, .matching, .match-list').forEach(list => {
        const rows = [...list.children].filter(row => row.matches('.quiz-row, .match-row'));
        if (rows.length > 1 && rows.every(row => row.classList.contains('edu-choice-row'))) {
            list.classList.add('edu-compact-activity');
        }
    });
})();
