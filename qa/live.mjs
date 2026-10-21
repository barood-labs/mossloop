import { chromium } from 'playwright-core';
const U = process.env.BASE_URL || 'https://barood-labs.github.io/mossloop/'; let pass = 0, fail = [];
const ok = (n, c) => { c ? pass++ : fail.push(n); console.log(c ? 'PASS' : 'FAIL', n); };
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); const p = await ctx.newPage();
for (const f of ['icons/logo.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/icon-1024.png', 'icons/icon-180.png', 'manifest.webmanifest', 'privacy.html', 'fonts/inter.woff', 'fonts/plexar-Regular.woff', 'sw.js'])
  { const r = await ctx.request.get(U + f); ok('200 ' + f, r.status() === 200); }
const m = await (await ctx.request.get(U + 'manifest.webmanifest')).json(); ok('manifest name', m.name === 'Mossloop' && m.icons.length >= 3);
const pr = await p.goto(U + 'privacy.html'); ok('privacy page', pr.status() === 200 && (await p.textContent('body')).includes('Mossloop'));
await p.goto(U + '?lang=en'); await p.waitForSelector('#browse'); ok('EN loads', (await p.textContent('h1')) === 'Mossloop');
await p.evaluate(() => navigator.serviceWorker.ready); await p.reload(); await p.waitForSelector('#browse');
ok('SW controls page', await p.evaluate(() => !!navigator.serviceWorker.controller));
await p.click('#browse'); await p.click('.tpl[data-t=ac_filter]');
await ctx.setOffline(true); await p.goto(U + '?lang=ar'); await p.waitForSelector('#rediscover, .row, #browse');
ok('offline AR loads', (await p.getAttribute('html', 'dir')) === 'rtl'); ok('offline fonts', await p.evaluate(async () => { await document.fonts.ready; return document.fonts.check('16px PlexAr'); }));
ok('offline data kept', await p.evaluate(() => JSON.parse(localStorage.rs_data_v1).items.length === 1));
const r2 = await p.goto(U + 'privacy.html').catch(() => null); ok('offline privacy', !!r2 && (await p.textContent('body')).includes('Mossloop'));
await p.screenshot({ path: 'qa/live_offline_ar.png' }); await ctx.setOffline(false);
await b.close(); console.log(`\n${pass} passed, ${fail.length} failed`); if (fail.length) process.exit(1);
