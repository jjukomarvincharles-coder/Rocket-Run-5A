// Copies Three.js into www/vendor so the APK works fully OFFLINE, and points index.html at the local copy.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const src = path.join(root, 'node_modules', 'three');
const dst = path.join(root, 'www', 'vendor', 'three');
if (!fs.existsSync(src)) { console.error('three not installed — run "npm install" first'); process.exit(1); }
fs.rmSync(dst, { recursive: true, force: true });
fs.mkdirSync(path.join(dst, 'build'), { recursive: true });
fs.copyFileSync(path.join(src, 'build', 'three.module.js'), path.join(dst, 'build', 'three.module.js'));
fs.cpSync(path.join(src, 'examples', 'jsm'), path.join(dst, 'examples', 'jsm'), { recursive: true });
const idx = path.join(root, 'www', 'index.html');
let html = fs.readFileSync(idx, 'utf8');
const a = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
const b = 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/';
if (!html.includes(a) || !html.includes(b)) { console.error('importmap URLs not found in www/index.html'); process.exit(1); }
html = html.replace(a, './vendor/three/build/three.module.js').replace(b, './vendor/three/examples/jsm/');
fs.writeFileSync(idx, html);
console.log('Three.js vendored; importmap now points to local files.');
