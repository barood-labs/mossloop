// Loaded first (classic script): surface any startup JS error in the simulator console (CI fails on it).
window.addEventListener('error', function (e) { console.error('STARTUP JS ERROR', e.message, e.filename + ':' + e.lineno); });
window.addEventListener('unhandledrejection', function (e) { console.error('STARTUP JS ERROR (promise)', String(e.reason)); });
