const fs = require('fs');
const path = require('path');

const directories = [
  path.join(__dirname, 'src/components/landing'),
  path.join(__dirname, 'src/components/layout'),
  path.join(__dirname, 'src/pages')
];

const cssFile = path.join(__dirname, 'src/style.css');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Remove dark mode classes
  content = content.replace(/dark:[a-zA-Z0-9\-\/\.\[\]]+ ?/g, '');
  // Clean up any double spaces left behind
  content = content.replace(/  +/g, ' ');

  // Remove blur classes
  content = content.replace(/backdrop-blur-[a-zA-Z0-9\-]+ ?/g, '');

  // Simplify translucent backgrounds to solid backgrounds
  content = content.replace(/bg-white\/[0-9]+/g, 'bg-white');
  content = content.replace(/bg-slate-50\/[0-9]+/g, 'bg-slate-50');
  content = content.replace(/bg-slate-100\/[0-9]+/g, 'bg-slate-100');
  content = content.replace(/bg-slate-900\/[0-9]+/g, 'bg-slate-900');
  content = content.replace(/bg-slate-950\/[0-9]+/g, 'bg-slate-950');
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.vue')) {
      processFile(fullPath);
    }
  }
}

directories.forEach(walkDir);

// Process style.css manually
if (fs.existsSync(cssFile)) {
  let cssContent = fs.readFileSync(cssFile, 'utf8');
  
  // Remove dark mode blocks in CSS
  cssContent = cssContent.replace(/html\.dark [^{]+\{[^}]+\}/g, '');
  // Remove glass-panel and soft-grid classes completely if needed, or just their dark mode
  
  fs.writeFileSync(cssFile, cssContent, 'utf8');
  console.log(`Updated CSS: ${cssFile}`);
}

console.log("Cleanup completed.");
