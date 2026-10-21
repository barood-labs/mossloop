const C='mossloop-v4',F=['./','native.js','vendor/boot.js','vendor/capacitor.js','icons.js','fonts/inter.woff','fonts/plexar-Regular.woff','fonts/plexar-SemiBold.woff','fonts/plexar-Bold.woff','index.html','style.css','app.js','i18n.js','templates.js','config.js','manifest.webmanifest','privacy.html','icons/logo.svg','icons/icon-192.png','icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request)))});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.openWindow('./#/today'))});
