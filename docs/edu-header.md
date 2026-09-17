# Edu Connect subject header

Theory pages render the shared brand, authentication controls, online count, and
chapter navigation through `/edu-header.js`. A new page supplies one mount point
and one page-specific configuration object; it does not copy header markup or tab
switching code.

```html
<link rel="stylesheet" href="/shared.css">

<script defer src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
<script defer src="https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"></script>
<script defer src="https://www.gstatic.com/firebasejs/10.8.0/firebase-database-compat.js"></script>
<script>
window.EDU_PAGE_CONFIG = {
    subject: "Culture & Ethics in International Business",
    shortName: "Culture & Ethics",
    icon: "🤝",
    route: "/VHDDTKD",
    defaultTab: "ch1",
    chapters: [
        {
            id: "ch1",
            shortLabel: "Ch.1: Culture",
            mobileLabel: "Chapter 1: Culture & Cross-Cultural Management"
        }
    ]
};
</script>
<script defer src="/edu-header.js"></script>
<script defer src="/auth.js"></script>
```

Place `<div id="edu-header"></div>` where the sticky header belongs. Every
chapter `id` must identify one `.tab-content` section. IDs must be unique,
`defaultTab` must be one of them, and all labels must be non-empty.

The load order is:

1. Tailwind and `/shared.css`.
2. Firebase compat SDKs with `defer`.
3. The inline `window.EDU_PAGE_CONFIG` assignment.
4. `/edu-header.js` with `defer`.
5. `/auth.js` with `defer`.
6. Subject-specific scripts.

This order lets the shared component create the stable auth DOM IDs before
`auth.js` registers its single authentication listener. The shared component
exposes `window.EduHeader.switchTab(tabId)` and the backwards-compatible
`window.attemptSwitchTab(tabId)` function for chapter links in existing content.

A page with chart or tool work after a tab change can define a generic hook:

```js
window.onEduTabChanged = tabId => {
    if (tabId === 'ch5') chapterFiveChart.resize();
};
```

The hook stays in the subject page. `/edu-header.js` contains no subject-specific
conditions and remains independent of Firebase authentication state.
