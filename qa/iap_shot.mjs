import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true }); const p = await c.newPage();
await p.route('**/vendor/capacitor.js', r => r.fulfill({ body: '', contentType: 'text/javascript' }));
await p.addInitScript(() => { const noop = new Proxy({}, { get: () => async () => ({}) });
  window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'ios', registerPlugin: n => n === 'NativePurchases' ? { getProducts: async () => ({ products: [{ priceString: '$4.99' }] }) } : noop }; });
await p.goto('http://localhost:8766/?lang=en#/settings'); await p.waitForSelector('#procard'); await p.evaluate(() => document.getElementById('procard').scrollIntoView({ block: 'center' })); await p.waitForTimeout(500);
await p.screenshot({ path: 'store/iap_review.png' }); await b.close(); console.log('ok');
