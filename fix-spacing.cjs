const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      walkDir(p);
    } else if (p.endsWith('.vue')) {
      let c = fs.readFileSync(p, 'utf8');
      let o = c;
      c = c.replace(/"(:[a-zA-Z\-]+=")/g, '" $1');
      if (c !== o) {
        fs.writeFileSync(p, c);
        console.log('Fixed spacing in', p);
      }
    }
  });
}

walkDir('src');
