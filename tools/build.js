// Joins src/css + src/html + src/js into ONE self-contained HTML file (works by double-click, no server needed).
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), src = path.join(root, 'src');
const read = d => fs.readdirSync(path.join(src, d)).filter(f => !f.startsWith('.')).sort()
  .map(f => fs.readFileSync(path.join(src, d, f), 'utf8')).join('');
const tpl = fs.readFileSync(path.join(src, 'index.template.html'), 'utf8');
const out = tpl.replace('/*@CSS@*/', () => read('css')).replace('<!--@HTML@-->', () => read('html')).replace('/*@JS@*/', () => read('js'));
for (const f of ['dist/ROCKET_RUN.html', 'www/index.html']) {
  fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true });
  fs.writeFileSync(path.join(root, f), out);
}
console.log('Built dist/ROCKET_RUN.html and www/index.html (' + Math.round(out.length / 1024) + ' KB)');
