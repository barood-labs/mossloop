// Rename the app in ONE place: edit "name" in brand.json, then run `npm run brand`.
import fs from 'fs';
const b = JSON.parse(fs.readFileSync('brand.json', 'utf8')); if (b.name === b.applied) { console.log('brand up to date:', b.name); process.exit(0); }
const files = ['index.html', 'privacy.html', 'manifest.webmanifest', 'capacitor.config.json', 'i18n.js', 'app.js', 'sw.js', 'widget/MossloopWidget.swift', 'README.md', 'qa/qa.mjs', 'icons/logo.svg'];
let n = 0; for (const f of files) { if (!fs.existsSync(f)) continue; const s = fs.readFileSync(f, 'utf8'), r = s.split(b.applied).join(b.name); if (r !== s) { fs.writeFileSync(f, r); n++; console.log('updated', f); } }
b.applied = b.name; fs.writeFileSync('brand.json', JSON.stringify(b, null, 1) + '\n'); console.log(`renamed in ${n} files`);
