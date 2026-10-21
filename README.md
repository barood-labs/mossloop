# Resurface (working name) — MVP
Offline-first PWA: Upkeep / People / Things, 44 bilingual templates (EN+AR, full RTL), daily Rediscover card (Done/Snooze/Not now), urgency view, local notifications, JSON backup, Pro gate (only when a store product loads; otherwise everything free, no purchase UI).
No account, no network calls, no analytics. Data: localStorage (items) + IndexedDB (photos).
- Rename: edit brand.json `name`, run `npm run brand`.
- QA: serve folder on :8766, `npm run qa` (headless Chrome, EN/AR × mobile/desktop, screenshots in qa/shots/).
- Native (later): Capacitor (capacitor.config.json, appId com.baroodlabs.resurface), widget in widget/ResurfaceWidget.swift (keychain-shared JSON, same as Virabloom).
NOT deployed. Needs user approval before any public launch.
