import { chromium } from 'playwright-core'; import fs from 'fs';
const U = process.env.BASE_URL || 'http://localhost:8766/', O = 'qa/shots/'; fs.mkdirSync(O, { recursive: true });
const D = 864e5, T0 = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); })();
const mk = (id, type, every, ago, title, x = {}) => ({ id, type, every, title, created: T0 - 400 * D, last: T0 - ago * D, ...x });
const sample = { app: 'resurface', v: 1, items: [mk('a', 'upkeep', 30, 45, 'Clean AC filter', { tpl: 'ac_filter', em: '🌀' }), mk('b', 'people', 7, 9, 'Call Mom', { tpl: 'call_parents', phone: '+1 801 555 0100', em: '👪' }), mk('c', 'things', 60, 61, 'Blue linen shirt', { tpl: 'clothes', em: '👕' }),
  mk('d', 'upkeep', 90, 85, 'Oil change', { tpl: 'oil_change', note: 'at 84,000 km', em: '🛢' }), mk('e', 'upkeep', 180, 10, 'Smoke alarm battery', { tpl: 'smoke_alarm', em: '🚨' }), mk('f', 'upkeep', 365, 400, 'Car registration <b>x</b>', { tpl: 'car_reg', em: '📄' })], settings: {},
  photos: { c: 'data:image/png;base64,' + fs.readFileSync('icons/icon-192.png').toString('base64') } };
sample.items[2].photo = true; fs.writeFileSync('/tmp/rs_sample.json', JSON.stringify(sample)); fs.writeFileSync('/tmp/rs_bad.json', '{"nope":1}');
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] }); let pass = 0, fail = [];
const ok = (n, c) => { c ? pass++ : fail.push(n); console.log(c ? 'PASS' : 'FAIL', n); };
for (const lang of (process.env.LANGS||'en,ar').split(',')) for (const vp of (process.env.VPS||'mobile,desktop').split(',')) {
  const ctx = await b.newContext(vp === 'mobile' ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, acceptDownloads: true } : { viewport: { width: 1280, height: 860 }, acceptDownloads: true });
  const p = await ctx.newPage(), errs = [], net = [], tag = lang + '_' + vp; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  p.on('request', r => { if (!r.url().startsWith(U) && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) net.push(r.url()); });
  const shot = async n => { await p.waitForTimeout(250); await p.screenshot({ path: `${O}${tag}_${n}.png`, fullPage: true });
    ok(`${tag} ${n} no h-overflow`, await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)); };
  try {
    const r = await p.goto(`${U}?lang=${lang}`); ok(tag + ' 200', r.status() === 200); await p.waitForSelector('#browse');
    ok(tag + ' dir', (await p.getAttribute('html', 'dir')) === (lang === 'en' ? 'ltr' : 'rtl')); await shot('1_empty');
    await p.click('#browse'); await p.waitForSelector('.tpl'); ok(tag + ' 40+ templates', (await p.$$('.tpl')).length >= 40);
    await p.click('.tpl[data-t=ac_filter]'); await p.click('.tpl[data-t=call_parents]'); await p.waitForSelector('.tpl.added'); ok(tag + ' no purchase UI on web', !(await p.$('#buy'))); await shot('2_add');
    await p.fill('#ft', 'Water heater check'); await p.fill('#fe', '120'); await p.click('#f button[type=submit]'); await p.waitForSelector('#mdone'); await shot('3_item_new');
    // add 31+ items -> no limit on web (everything free)
    await p.evaluate(() => { const s = JSON.parse(localStorage.rs_data_v1); for (let i = 0; i < 31; i++) s.items.push({ id: 'z' + i, type: 'upkeep', every: 30, title: 'x' + i, created: Date.now(), last: null }); localStorage.rs_data_v1 = JSON.stringify(s); });
    await p.goto(`${U}?lang=${lang}#/add`); await p.reload(); await p.waitForSelector('.tpl'); await p.click('.tpl[data-t=oil_change]'); await p.waitForTimeout(200);
    const cnt = await p.evaluate(() => JSON.parse(localStorage.rs_data_v1).items.length); console.log('count', cnt); ok(tag + ' >30 items allowed when no store', cnt === 35);
    await p.click('[data-tab=settings]'); await p.waitForSelector('#imp', { state: 'attached' });
    await p.setInputFiles('#imp', '/tmp/rs_bad.json'); await p.waitForTimeout(300); ok(tag + ' bad import rejected', (await p.evaluate(() => JSON.parse(localStorage.rs_data_v1).items.length)) === cnt);
    await p.setInputFiles('#imp', '/tmp/rs_sample.json'); await p.waitForSelector('#rediscover .ri[data-id]');
    ok(tag + ' rediscover shows 3', (await p.$$('#rediscover .ri[data-id]')).length === 3); ok(tag + ' wa link', !!(await p.$('a[href="https://wa.me/18015550100"]'))); await shot('4_today');
    const first = await p.getAttribute('#rediscover .ri[data-id]', 'data-id'); await p.click(`.ri[data-id="${first}"] [data-a=done]`); await p.waitForSelector(`.ri[data-id="${first}"]`, { state: 'detached' }).catch(() => {});
    ok(tag + ' done removes from card', !(await p.$(`.ri[data-id="${first}"]`)));
    const sec = await p.getAttribute('#rediscover .ri[data-id]', 'data-id'); await p.click(`.ri[data-id="${sec}"] [data-a=snooze]`); await p.waitForSelector(`.ri[data-id="${sec}"]`, { state: 'detached' }).catch(() => {}); ok(tag + ' snooze', !(await p.$(`.ri[data-id="${sec}"]`)));
    const th = await p.getAttribute('#rediscover .ri[data-id]', 'data-id'); await p.click(`.ri[data-id="${th}"] [data-a=notnow]`); await p.waitForSelector(`.ri[data-id="${th}"]`, { state: 'detached' }).catch(() => {}); ok(tag + ' not now', !(await p.$(`.ri[data-id="${th}"]`))); await shot('5_today_after');
    await p.click('[data-tab=all]'); await p.waitForSelector('.row'); ok(tag + ' urgency colors', (await p.$$('.row.u-red-b')).length >= 1 && (await p.$$('.row.u-grn-b')).length >= 1);
    ok(tag + ' html escaped', (await p.content()).includes('&lt;b&gt;x')); ok(tag + ' photo thumb', !!(await p.waitForSelector('img.em', { timeout: 3000 }).catch(() => null))); await shot('6_all');
    await p.click('#filt [data-f=people]'); await p.waitForTimeout(150); ok(tag + ' filter people', (await p.$$('.row')).length === 1);
    await p.click('.row'); await p.waitForSelector('#mdone'); await shot('7_item_person');
    await p.goto(`${U}?lang=${lang}#/item/c`); await p.waitForSelector('.photo'); await shot('8_item_thing');
    await p.click('[data-tab=settings]'); await p.waitForSelector('#themes'); await p.click('[data-th=night]'); await p.waitForSelector('.wid.th-night'); ok(tag + ' themes free on web', true);
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#exp')]); const j = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
    ok(tag + ' export has items+photo', j.items.length === 6 && j.photos.c?.startsWith('data:image')); await shot('9_settings');
    await p.click('[data-ap=dark]'); await p.waitForSelector('html[data-theme=dark]'); await p.click('[data-tab=today]'); await p.waitForSelector('#rediscover'); await shot('11_today_dark'); await p.click('[data-tab=all]'); await p.waitForSelector('.row'); await shot('12_all_dark');
    ok(tag + ' fonts loaded', await p.evaluate(() => document.fonts.check(document.documentElement.dir === 'rtl' ? '16px PlexAr' : '16px Inter')));
    await p.goto(`${U}privacy.html`); await shot('10_privacy'); await p.goto(`${U}?lang=${lang}`);
    ok(tag + ' no page errors', errs.length === 0 || (console.log(errs), false)); ok(tag + ' no external network', net.length === 0 || (console.log(net), false));
  } catch (e) { ok(tag + ' crashed: ' + e.message.split('\n')[0], false); await p.screenshot({ path: `${O}${tag}_CRASH.png` }); }
  await ctx.close(); }
await b.close(); console.log(`\n${pass} passed, ${fail.length} failed`); if (fail.length) { console.log(fail.join('\n')); process.exit(1); }
