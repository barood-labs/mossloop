import { chromium } from 'playwright-core'; import fs from 'fs';
const U = 'http://localhost:8766/', O = 'store/'; const D = 864e5, T0 = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); })();
const L = {
 en: { items: [['ac_filter','upkeep',30,38,'Clean AC filter'],['call_parents','people',7,9,'Call Mom',{phone:'+15555550100'}],['oil_change','upkeep',90,92,'Oil change',{note:'at 84,000 km'}],['clothes','things',60,40,'Linen jacket'],['smoke_alarm','upkeep',180,170,'Smoke alarm battery'],['water_tank','upkeep',180,60,'Clean water tank'],['car_ins','upkeep',365,350,'Car insurance renewal'],['old_friend','people',90,30,'Message Sam']],
  h: ['Life’s quiet upkeep slips by.\nMossloop brings it back.', 'Ready-made reminders\nyou’d never think to add', 'See what’s overdue\nat a glance', 'Check in with one tap', 'Private by design.\nNo account. No ads.'],
  s: ['3 things a day, before they become problems', '44 templates for home, car, people and things', 'Red, amber and green — calm, not naggy', 'WhatsApp, call or SMS the people you meant to call', 'Everything stays on your iPhone · one-time Pro, no subscription'] },
 ar: { items: [['ac_filter','upkeep',30,38,'تنظيف فلتر المكيّف'],['call_parents','people',7,9,'الاتصال بأمي',{phone:'+15555550100'}],['oil_change','upkeep',90,92,'تغيير زيت السيارة',{note:'عند ٨٤٠٠٠ كم'}],['clothes','things',60,40,'جاكيت الكتان'],['smoke_alarm','upkeep',180,170,'بطارية كاشف الدخان'],['water_tank','upkeep',180,60,'تنظيف خزان الماء'],['car_ins','upkeep',365,350,'تجديد تأمين السيارة'],['old_friend','people',90,30,'مراسلة سامي']],
  h: ['صيانة الحياة الهادئة تُنسى.\nMossloop يعيدها إليك.', 'تذكيرات جاهزة\nلم تكن لتخطر ببالك', 'اعرف المتأخر\nبنظرة واحدة', 'اطمئن على من تحب بلمسة', 'خصوصية في التصميم.\nبلا حساب ولا إعلانات.'],
  s: ['٣ أشياء يوميًا قبل أن تصبح مشكلة', '٤٤ قالبًا للمنزل والسيارة والناس والأغراض', 'أحمر وكهرماني وأخضر — بهدوء ودون إزعاج', 'واتساب أو اتصال أو رسالة لمن نويت التواصل معه', 'كل شيء يبقى على جهازك · Pro بدفعة واحدة بلا اشتراك'] } };
const SIZES = { '6.9': [1320, 2868], '6.5': [1284, 2778], '6.1': [1179, 2556] };
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
for (const lang of ['en', 'ar']) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }); const p = await ctx.newPage();
  const items = L[lang].items.map(([tpl, type, every, ago, title, x], i) => ({ id: 'i' + i, tpl, type, every, title, created: T0 - 400 * D, last: T0 - ago * D, ...(x || {}) }));
  await p.goto(U + '?lang=' + lang); await p.evaluate(s => { localStorage.rs_data_v1 = JSON.stringify(s); }, { items, settings: {}, lang });
  const raw = async (hash, n, fn) => { await p.goto(U + '?lang=' + lang + hash); await p.reload(); await p.waitForTimeout(700); if (fn) await fn(); await p.evaluate(() => document.getElementById('toast').classList.remove('show')); await p.waitForTimeout(400); await p.screenshot({ path: `/tmp/raw_${lang}_${n}.png` }); };
  await raw('#/today', 1); await raw('#/add', 2, () => p.evaluate(() => scrollTo(0, 0))); await raw('#/all', 3); await raw('#/item/i1', 4);
  await p.evaluate(() => { const s = JSON.parse(localStorage.rs_data_v1); s.settings.appearance = 'dark'; localStorage.rs_data_v1 = JSON.stringify(s); }); await raw('#/today', 5);
  await ctx.close();
  for (const [sz, [W, H]] of Object.entries(SIZES)) {
    const c = await b.newContext({ viewport: { width: W / 3, height: H / 3 }, deviceScaleFactor: 3 }); const q = await c.newPage();
    for (let i = 1; i <= 5; i++) {
      const img = 'data:image/png;base64,' + fs.readFileSync(`/tmp/raw_${lang}_${i}.png`).toString('base64'), dark = i === 5;
      await q.setContent(`<html dir="${lang === 'ar' ? 'rtl' : 'ltr'}"><style>@font-face{font-family:Inter;src:url(data:font/woff;base64,${fs.readFileSync('fonts/inter.woff').toString('base64')})}@font-face{font-family:PlexAr;font-weight:700;src:url(data:font/woff;base64,${fs.readFileSync('fonts/plexar-Bold.woff').toString('base64')})}@font-face{font-family:PlexAr;font-weight:400;src:url(data:font/woff;base64,${fs.readFileSync('fonts/plexar-Regular.woff').toString('base64')})}
      body{margin:0;width:100vw;height:100vh;overflow:hidden;font-family:${lang === 'ar' ? 'PlexAr,Inter' : 'Inter,PlexAr'};background:${dark ? 'linear-gradient(170deg,#1d3a2a,#0b1610)' : 'radial-gradient(120% 60% at 50% 0,#e4efdc,#f3efe4 70%)'};color:${dark ? '#eef5ee' : '#14261b'};display:flex;flex-direction:column;align-items:center}
      h1{font-size:${H / W > 2.15 ? 30 : 29}px;line-height:1.18;font-weight:750;letter-spacing:${lang === 'ar' ? 0 : '-.03em'};text-align:center;margin:${H / 3 * .075}px 22px 8px;white-space:pre-line}p{margin:0 26px;font-size:15.5px;text-align:center;opacity:.72;line-height:1.4}
      .ph{margin-top:${H / 3 * .035}px;width:76%;aspect-ratio:390/844;border-radius:42px;padding:9px;background:${dark ? '#000' : '#16231b'};box-shadow:0 30px 60px #0d2a1a40}.ph img{width:100%;height:100%;border-radius:34px;display:block}</style>
      <h1>${L[lang].h[i - 1]}</h1><p>${L[lang].s[i - 1]}</p><div class="ph"><img src="${img}"></div></html>`);
      await q.waitForTimeout(300); await q.screenshot({ path: `${O}${sz}in_${lang}_${i}.png` }); }
    await c.close(); } }
await b.close(); console.log('ok');
