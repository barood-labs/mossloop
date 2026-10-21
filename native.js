// Thin wrappers over Capacitor native plugins. On the web every call is a safe no-op.
const C = window.Capacitor; export const isNative = !!(C && C.isNativePlatform && C.isNativePlatform());
// registerPlugin comes from bundled @capacitor/core JS (vendor/capacitor.js); a missing plugin must never blank the app.
const P = n => { if (!isNative) return null; try { const r = C.registerPlugin || window.capacitorExports?.registerPlugin; return r ? r(n) : null; } catch (e) { console.warn(e); return null; } };
export const LN = P('LocalNotifications'), IAP = P('NativePurchases'), WG = P('MLWidget');
export async function widgetSet(data) { try { await WG?.setData({ json: JSON.stringify(data) }); } catch { } }
