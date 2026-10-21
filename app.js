import { STR } from './i18n.js'; import { TEMPLATES } from './templates.js'; import { ic, ICON_OF, TYPE_ICON, ILLU_EMPTY, ILLU_CLEAR } from './icons.js'; import { PRO_PRODUCT_ID, PRO_PRICE, FREE_LIMIT } from './config.js';
const $ = s => document.querySelector(s), K = 'rs_data_v1';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DAY = 864e5, today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }, iso = t => new Date(t).toISOString().slice(0, 10);
let S = load(); const q = new URLSearchParams(location.search).get('lang'); if (q) S.lang = q;
if (!S.lang) S.lang = (navigator.language || 'en').startsWith('ar') ? 'ar' : 'en';
const t = (k, v = {}) => (STR[S.lang][k] ?? STR.en[k] ?? k).replace(/\{(\w+)\}/g, (_, x) => v[x]);
function load() { try { return JSON.parse(localStorage.getItem(K)) || { items: [], settings: {} }; } catch { return { items: [], settings: {} }; } }
function save() { localStorage.setItem(K, JSON.stringify(S)); syncWidget(); }
// ---------- photos in IndexedDB ----------
const idb = () => new Promise((res, rej) => { const r = indexedDB.open('rs_photos', 1); r.onupgradeneeded = () => r.result.createObjectStore('p'); r.onsuccess = () => res(r.result); r.onerror = rej; });
const pPut = async (k, v) => { const d = await idb(); return new Promise(r => { const x = d.transaction('p', 'readwrite'); v == null ? x.objectStore('p').delete(k) : x.objectStore('p').put(v, k); x.oncomplete = r; }); };
const pGet = async k => { const d = await idb(); return new Promise(r => { const g = d.transaction('p').objectStore('p').get(k); g.onsuccess = () => r(g.result); g.onerror = () => r(null); }); };
const resize = f => new Promise(res => { const i = new Image(); i.onload = () => { const s = Math.min(1, 640 / Math.max(i.width, i.height)), c = document.createElement('canvas'); c.width = i.width * s; c.height = i.height * s; c.getContext('2d').drawImage(i, 0, 0, c.width, c.height); URL.revokeObjectURL(i.src); res(c.toDataURL('image/jpeg', .8)); }; i.src = URL.createObjectURL(f); });
// ---------- Pro: only enforced when a real store product loaded ----------
const P = { available: false, price: PRO_PRICE };
const isPro = () => !P.available || !!S.settings.pro;
async function initStore() { const NP = window.Capacitor?.Plugins?.NativePurchases; if (!NP) return;
  try { const r = await NP.getProduct({ productIdentifier: PRO_PRODUCT_ID, productType: 'inapp' }); if (r?.product) { P.available = true; P.price = r.product.priceString || PRO_PRICE; P.NP = NP; } } catch { P.available = false; } }
async function buy() { try { await P.NP.purchaseProduct({ productIdentifier: PRO_PRODUCT_ID, productType: 'inapp' }); S.settings.pro = true; save(); toast(t('owned')); render(); } catch {} }
async function restore() { try { const r = await P.NP.restorePurchases(); if (JSON.stringify(r || '').includes(PRO_PRODUCT_ID)) { S.settings.pro = true; save(); toast(t('owned')); render(); } } catch {} }
// ---------- scheduling ----------
const due = it => (it.last ?? it.created) + it.every * DAY;
function urg(it) { const d = Math.round((due(it) - today()) / DAY); return { d, c: d < 0 ? 'red' : d <= Math.max(2, Math.round(it.every * .15)) ? 'amb' : 'grn' }; }
const dueLabel = d => d < 0 ? t('late', { n: -d }) : d === 0 ? t('dueToday') : t('dueIn', { n: d });
function pick3() { const T = today(); return S.items.filter(i => !(i.snooze > T) && i.skip !== iso(T) && urg(i).d <= (i.type === 'upkeep' ? 0 : 1)).sort((a, b) => urg(a).d / a.every - urg(b).d / b.every).slice(0, 3); }
function act(id, a) { const it = S.items.find(i => i.id === id); if (!it) return; const T = today();
  if (a === 'done') { it.last = T; it.snooze = 0; } if (a === 'snooze') it.snooze = T + 3 * DAY; if (a === 'notnow') it.skip = iso(T); save(); toast(t(a === 'done' ? 'done' : a)); render(); }
function addItem(o) { if (!isPro() && S.items.length >= FREE_LIMIT) { location.hash = '#/settings'; toast(t('limit', { n: FREE_LIMIT })); return false; }
  S.items.push({ id: crypto.randomUUID?.() || String(Date.now() + Math.random()), created: today() - (o.type === 'things' ? o.every * DAY : 0), last: null, ...o }); save(); return true; }
// ---------- notifications & widget ----------
function syncWidget() { const w = { title: t('rediscover'), items: pick3().map(i => i.title), theme: S.settings.theme || 'leaf' }; localStorage.setItem('rs_widget', JSON.stringify(w));
  window.Capacitor?.Plugins?.WidgetBridge?.set?.({ json: JSON.stringify(w) }).catch?.(() => {}); }
async function enableNotif() { const LN = window.Capacitor?.Plugins?.LocalNotifications;
  if (LN) { const p = await LN.requestPermissions(); if (p.display !== 'granted') return; await LN.schedule({ notifications: [{ id: 1, title: t('rediscover'), body: t('rediscoverSub'), schedule: { on: { hour: 9, minute: 0 }, repeats: true } }] }); }
  else if ('Notification' in window) { if (await Notification.requestPermission() !== 'granted') return; } else return toast(t('notifNo'));
  S.settings.notif = true; save(); render(); }
function webNudge() { if (!S.settings.notif || window.Capacitor || !('Notification' in window) || Notification.permission !== 'granted') return; const d = iso(today()), n = pick3();
  if (S.settings.nudged === d || !n.length) return; S.settings.nudged = d; save(); navigator.serviceWorker?.ready.then(r => r.showNotification(t('rediscover'), { body: n.map(i => i.title).join(' · '), icon: 'icons/icon-192.png' })).catch(() => {}); }
// ---------- backup ----------
async function exportJSON() { const photos = {}; if (isPro()) for (const i of S.items) if (i.photo) photos[i.id] = await pGet(i.id);
  const b = new Blob([JSON.stringify({ app: 'resurface', v: 1, exported: new Date().toISOString(), items: S.items, settings: { ...S.settings, pro: undefined }, photos })], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `resurface-backup-${iso(Date.now())}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
async function importJSON(f) { try { const j = JSON.parse(await f.text()); if (j.app !== 'resurface' || !Array.isArray(j.items)) throw 0;
  S.items = j.items.filter(i => i && i.id && i.title && ['upkeep', 'people', 'things'].includes(i.type) && i.every > 0); S.settings = { ...S.settings, ...j.settings, pro: S.settings.pro };
  for (const [k, v] of Object.entries(j.photos || {})) if (typeof v === 'string' && v.startsWith('data:image/')) await pPut(k, v); save(); toast(t('imported')); location.hash = '#/today'; render(); } catch { toast(t('badFile')); } }
// ---------- UI ----------
const toast = m => { const e = $('#toast'); e.textContent = m; e.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(() => e.classList.remove('show'), 1800); };
const icon = i => ic(ICON_OF[i.tpl] || TYPE_ICON[i.type]);
function row(i) { const u = urg(i); return `<a class="row u-${u.c}-b" href="#/item/${esc(i.id)}"><span class="em t-${i.type}" data-ph="${i.photo ? esc(i.id) : ''}">${icon(i)}</span><span class="tx"><b>${esc(i.title)}</b><small>${t(i.type)} · ${t('every')} ${i.every} ${t('days')}</small></span><span class="pill u-${u.c}">${dueLabel(u.d)}</span><span class="chev">›</span></a>`; }
function contactBtns(i) { if (i.type !== 'people' || !i.phone) return ''; const n = i.phone.replace(/[^\d+]/g, ''), w = n.replace(/^\+/, '');
  return `<a class="btn ghost" href="https://wa.me/${w}" target="_blank" rel="noopener">${ic('wa')}${t('whatsapp')}</a><a class="btn ghost" href="tel:${n}">${ic('call')}${t('call')}</a><a class="btn ghost" href="sms:${n}">${ic('sms')}${t('sms')}</a>`; }
const V = {
 today() { const p = pick3(); if (!S.items.length) return `<div class="card empty rise">${ILLU_EMPTY}<h2>${t('emptyTitle')}</h2><p class="mut">${t('emptySub')}</p><a class="btn" id="browse" href="#/add">${t('browse')}</a></div>`;
  const soon = S.items.filter(i => !p.includes(i)).sort((a, b) => due(a) - due(b)).slice(0, 5);
  return `<section class="card hero rise" id="rediscover"><div class="hhead"><div><div class="date">${new Date().toLocaleDateString(S.lang === 'ar' ? 'ar' : 'en', { weekday: 'long', month: 'long', day: 'numeric' })}</div><h2>${t('rediscover')}</h2><div class="sub">${t('rediscoverSub')}</div></div><span class="count">${p.length}</span></div>${p.length ? p.map(i => `<div class="ri" data-id="${esc(i.id)}"><span class="em">${icon(i)}</span><span class="tx"><b>${esc(i.title)}</b><small>${dueLabel(urg(i).d)}${i.note ? ' · ' + esc(i.note) : ''}</small></span><div class="acts"><button class="gold" data-a="done">${ic('check')}${t('done')}</button><button class="ghost" data-a="snooze">${ic('clock')}${t('snooze')}</button><button class="ghost" data-a="notnow">${ic('skip')}${t('notnow')}</button></div>${contactBtns(i) ? `<div class="acts contacts">${contactBtns(i)}</div>` : ''}</div>`).join('') : `<div class="ri clear" id="clear">${ILLU_CLEAR}<span class="tx"><b>${t('allClear')}</b><small>${t('allClearSub')}</small></span></div>`}</section>
  <h2 class="sec">${t('upnext')}</h2>${soon.map(row).join('')}`; },
 all() { const f = S.ui_f || 'any', L = S.items.filter(i => f === 'any' || i.type === f).sort((a, b) => urg(a).d - urg(b).d), g = c => L.filter(i => urg(i).c === c);
  return `<div class="seg" id="filt">${['any', 'upkeep', 'people', 'things'].map(x => `<button data-f="${x}" class="${x === f ? 'on' : ''}">${t(x)}</button>`).join('')}</div><p class="mut">${t('items', { n: S.items.length })}</p>
  ${[['red', 'overdue'], ['amb', 'soon'], ['grn', 'ok']].map(([c, k]) => g(c).length ? `<h2><span class="pill u-${c}">${t(k)}</span></h2>${g(c).map(row).join('')}` : '').join('')}`; },
 add() { const have = new Set(S.items.map(i => i.tpl)); return `<h2>${t('templates')}</h2>${['upkeep', 'people', 'things'].map(ty => `<h2 class="sec">${t(ty)}</h2><div class="grid">${TEMPLATES.filter(x => x[1] === ty).map(x => `<button class="tpl ${have.has(x[0]) ? 'added' : ''}" data-t="${x[0]}"><span class="em t-${ty}">${ic(ICON_OF[x[0]])}</span><span>${esc(S.lang === 'ar' ? x[5] : x[4])}</span><span class="plus">+</span></button>`).join('')}</div>`).join('')}
  <h2>${t('custom')}</h2><div class="card">${form({ type: 'upkeep', every: 30 })}</div>`; },
 item(id) { const i = S.items.find(x => x.id === id); if (!i) return V.all(); const u = urg(i);
  return `<div class="card"><div class="flex"><span class="pill u-${u.c}">${dueLabel(u.d)}</span><span class="mut">${t('lastDone')}: ${i.last ? iso(i.last) : t('never')}</span></div><div id="ph"></div><div class="flex" style="margin-top:10px"><button id="mdone">${ic('check')}${t('markDone')}</button>${contactBtns(i).replaceAll('ghost', 'light')}</div></div><div class="card">${form(i)}<button class="warn" id="del" style="margin-top:10px">${t('delete')}</button></div>`; },
 settings() { const th = S.settings.theme || 'leaf', w = pick3();
  return `<div class="card"><label>${t('language')}</label><select id="lang"><option value="en">English</option><option value="ar" ${S.lang === 'ar' ? 'selected' : ''}>العربية</option></select>
  <label>${t('appearance')}</label><div class="seg" id="appear">${['system', 'light', 'dark'].map(x => `<button data-ap="${x}" class="${(S.settings.appearance || 'system') === x ? 'on' : ''}">${t(x)}</button>`).join('')}</div><label>${t('notif')}</label>${S.settings.notif ? `<p>✅ ${t('notifOnDone')}</p>` : `<button id="notif" class="light">${ic('bell')}${t('notifOn')}</button>`}</div>
  ${P.available && !S.settings.pro ? `<div class="card" id="procard"><h2>${ic('sparkle')} ${t('pro')}</h2><p>${t('proLine', { p: esc(P.price) })}</p><div class="flex"><button class="gold" id="buy">${t('buy')} · ${esc(P.price)}</button><button class="light" id="restore">${t('restore')}</button></div></div>` : ''}
  <div class="card"><h2>${t('widgetTheme')}</h2><div class="seg" id="themes">${['leaf', 'sand', 'night'].map(x => `<button data-th="${x}" class="${x === th ? 'on' : ''}" ${!isPro() && x !== 'leaf' ? 'disabled' : ''}>${t(x)}</button>`).join('')}</div><p class="mut">${t('widgetPrev')}</p><div class="wid th-${th}"><b>${ic('leaf')} ${t('rediscover')}</b>${(w.length ? w : [{ title: t('allClear') }]).map(i => `<div>• ${esc(i.title)}</div>`).join('')}</div></div>
  <div class="card"><h2>${t('backup')}</h2><div class="flex"><button id="exp" class="light">${ic('down')}${t('export')}</button><label class="btn light" style="margin:0;color:var(--pri)">${ic('up')}${t('import')}<input type="file" id="imp" accept="application/json,.json" hidden></label></div></div>
  <div class="card"><h2>${ic('lock')} ${t('privacy')}</h2><p>${t('privacyLine')}</p><a href="privacy.html">${t('privacy')} →</a></div>`; } };
function form(i) { return `<form id="f" data-id="${esc(i.id || '')}"><label>${t('title')}</label><input id="ft" required maxlength="80" value="${esc(i.title || '')}">
 <label>${t('type')}</label><select id="fy">${['upkeep', 'people', 'things'].map(x => `<option value="${x}" ${x === i.type ? 'selected' : ''}>${t(x)}</option>`).join('')}</select>
 <label>${t('interval')}</label><input id="fe" type="number" min="1" max="3650" inputmode="numeric" value="${i.every}">
 <label>${t('note')}</label><input id="fn" maxlength="120" value="${esc(i.note || '')}"><label>${t('phone')}</label><input id="fp" type="tel" dir="ltr" maxlength="20" value="${esc(i.phone || '')}">
 <label>${t('photo')}</label><input id="fph" type="file" accept="image/*"><div class="flex" style="margin-top:12px"><button type="submit">${t('save')}</button></div></form>`; }
const TABS = [['today', 'sun'], ['all', 'list'], ['add', 'plus'], ['settings', 'gear']];
async function render() { const [r, id] = location.hash.replace('#/', '').split('/'), route = V[r] ? r : 'today';
  document.documentElement.lang = S.lang; document.documentElement.dir = S.lang === 'ar' ? 'rtl' : 'ltr'; document.documentElement.dataset.theme = S.settings.appearance || 'system'; $('#tag').textContent = t('tagline'); document.title = t('brand');
  $('#tabs').innerHTML = TABS.map(([k, e]) => `<a href="#/${k}" data-tab="${k}" class="${(route === 'item' ? 'all' : route) === k ? 'on' : ''}">${ic(e)}<span>${t(k)}</span></a>`).join('');
  $('#view').innerHTML = V[route](id); scrollTo(0, 0);
  for (const s of document.querySelectorAll('[data-ph]')) if (s.dataset.ph) pGet(s.dataset.ph).then(u => { if (u) s.outerHTML = `<img class="em ph" alt="" src="${u}">`; });
  if (route === 'item') { const it = S.items.find(x => x.id === id); if (it?.photo) pGet(it.id).then(u => { if (u) $('#ph').innerHTML = `<img class="photo" alt="" src="${u}">`; }); } }
document.addEventListener('click', e => { const b = e.target.closest('button,[data-t]'); if (!b) return;
  const ri = b.closest('.ri'); if (ri && b.dataset.a) { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return act(ri.dataset.id, b.dataset.a); ri.classList.add('leaving', b.dataset.a); return setTimeout(() => act(ri.dataset.id, b.dataset.a), 260); }
  if (b.dataset.ap) { S.settings.appearance = b.dataset.ap; save(); return render(); }
  if (b.dataset.f) { S.ui_f = b.dataset.f; return render(); }
  if (b.dataset.t) { const x = TEMPLATES.find(y => y[0] === b.dataset.t); if (addItem({ tpl: x[0], type: x[1], every: x[2], em: x[3], title: S.lang === 'ar' ? x[5] : x[4] })) { toast(t('added')); render(); } return; }
  if (b.dataset.th) { S.settings.theme = b.dataset.th; save(); return render(); }
  const id = location.hash.split('/')[2];
  ({ mdone: () => act(id, 'done'), del: () => { if (confirm(t('confirmDel'))) { S.items = S.items.filter(i => i.id !== id); pPut(id, null); save(); location.hash = '#/all'; } },
     notif: enableNotif, exp: exportJSON, buy, restore })[b.id]?.(); });
document.addEventListener('submit', async e => { e.preventDefault(); const f = e.target, o = { title: $('#ft').value.trim(), type: $('#fy').value, every: Math.max(1, Math.min(3650, +$('#fe').value || 30)), note: $('#fn').value.trim(), phone: $('#fp').value.trim() };
  if (!o.title) return; const file = $('#fph').files[0]; let it = S.items.find(i => i.id === f.dataset.id);
  if (it) Object.assign(it, o); else { if (!addItem(o)) return; it = S.items.at(-1); }
  if (file) { await pPut(it.id, await resize(file)); it.photo = true; } save(); toast(t('added')); location.hash = '#/item/' + it.id; render(); });
document.addEventListener('change', e => { if (e.target.id === 'lang') { S.lang = e.target.value; save(); history.replaceState(null, '', location.pathname + location.hash); render(); } if (e.target.id === 'imp' && e.target.files[0]) importJSON(e.target.files[0]); });
addEventListener('hashchange', render);
if ('serviceWorker' in navigator && !window.Capacitor) navigator.serviceWorker.register('sw.js').catch(() => {});
initStore().finally(() => { render(); syncWidget(); webNudge(); });
