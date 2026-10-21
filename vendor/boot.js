// Loaded first (classic script): surface any startup JS error in the simulator console (CI fails on it).
window.addEventListener('error', function (e) { console.error('STARTUP JS ERROR', e.message, e.filename + ':' + e.lineno); });
window.addEventListener('unhandledrejection', function (e) { console.error('STARTUP JS ERROR (promise)', String(e.reason)); });
// One-line health report for the CI simulator check (no user data: only sizes and counts).
setTimeout(function () { try { var b = document.body, v = document.getElementById('view'); console.log('BOOT_REPORT', JSON.stringify({ text: b.innerText.length, view: v && v.children.length, bg: getComputedStyle(b).backgroundImage.slice(0, 40), op: v && v.firstElementChild && getComputedStyle(v.firstElementChild).opacity, w: innerWidth, h: innerHeight, vis: document.visibilityState, css: document.styleSheets.length })); } catch (e) { console.log('BOOT_REPORT_ERR', e.message); } }, 8000);
