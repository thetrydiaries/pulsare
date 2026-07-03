#!/usr/bin/env node
// Injects PWA meta tags and copies static assets into the dist/ output.
// Runs as a post-export step via `npm run export:web`.

const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
const ASSETS = path.join(__dirname, '..', 'assets');
const WEB = path.join(__dirname, '..', 'web');

// Expo's static rendering already emits some of these (theme-color, manifest
// link) with data-rh attributes. We only inject what's missing, and — most
// importantly — always inject the service-worker registration, which Expo
// never emits and which web push depends on entirely.
const PWA_META = [
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />',
  '<meta name="apple-mobile-web-app-title" content="Pulsare" />',
  '<link rel="apple-touch-icon" href="/pwa-icon-192.png" />',
];

const SW_REGISTER =
  '<script>if("serviceWorker"in navigator)window.addEventListener("load",function(){navigator.serviceWorker.register("/sw.js")});</script>';

function injectIntoHtml(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const additions = [];

  // Only add meta/link tags Expo hasn't already rendered.
  for (const tag of PWA_META) {
    const marker = tag.match(/(?:name|rel)="([^"]+)"/)[1];
    if (!html.includes(`"${marker}"`)) additions.push(tag);
  }
  if (!html.includes('rel="manifest"')) {
    additions.push('<link rel="manifest" href="/manifest.json" />');
  }
  // Always ensure the service worker registers (idempotent on re-run).
  if (!html.includes('serviceWorker.register')) {
    additions.push(SW_REGISTER);
  }

  if (additions.length === 0) return;
  const updated = html.replace('</head>', `    ${additions.join('\n    ')}\n  </head>`);
  fs.writeFileSync(filePath, updated);
}

function findHtmlFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findHtmlFiles(full));
    } else if (entry.name.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

// Inject into all pre-rendered HTML files
const htmlFiles = findHtmlFiles(DIST);
for (const file of htmlFiles) {
  injectIntoHtml(file);
}
console.log(`[pwa] injected tags into ${htmlFiles.length} HTML files`);

// Copy static PWA assets to dist root
fs.copyFileSync(path.join(WEB, 'manifest.json'), path.join(DIST, 'manifest.json'));
fs.copyFileSync(path.join(WEB, 'sw.js'), path.join(DIST, 'sw.js'));
fs.copyFileSync(path.join(ASSETS, 'pwa-icon-192.png'), path.join(DIST, 'pwa-icon-192.png'));
fs.copyFileSync(path.join(ASSETS, 'pwa-icon-512.png'), path.join(DIST, 'pwa-icon-512.png'));
console.log('[pwa] copied manifest.json, sw.js, pwa-icon-192.png, pwa-icon-512.png');
