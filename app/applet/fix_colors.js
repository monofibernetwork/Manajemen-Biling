const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    content = content.replace(/bg-slate-950/g, 'bg-slate-50');
    content = content.replace(/bg-slate-800/g, 'bg-slate-100');

    // Make blue texts inside blue-tinted boxes readable by converting to full blue box with white text
    content = content.replace(/bg-blue-600\/10 text-blue-600/g, 'bg-blue-600 text-white');
    content = content.replace(/text-blue-600 bg-blue-600\/10/g, 'text-white bg-blue-600');
    content = content.replace(/bg-blue-600\/20 text-blue-600/g, 'bg-blue-600 text-white');
    content = content.replace(/text-blue-600 bg-blue-600\/20/g, 'text-white bg-blue-600');

    // For StatCard in App.tsx
    if (filePath.endsWith('App.tsx')) {
        content = content.replace(/newColorBg = 'bg-blue-600\/10'; newIconColor = 'text-blue-600'/g, "newColorBg = 'bg-blue-600'; newIconColor = 'text-white'");
    }

    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log('Fixed ' + filePath);
    }
  }
});
