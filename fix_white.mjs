import fs from 'fs';
import path from 'path';

function fixFile(file, replaces) {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;
  for (const r of replaces) {
    newContent = newContent.replace(r.from, r.to);
  }
  if (newContent !== content) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Fixed ${file}`);
  }
}

fixFile('src/components/OdpMap.tsx', [
  { from: /bg-white hover:bg-slate-700 text-white/g, to: 'bg-slate-800 hover:bg-slate-700 text-white' },
  { from: /hover:bg-cyan-700 text-white/g, to: 'hover:bg-blue-700 text-white' }
]);

fixFile('src/components/BillingTable.tsx', [
  { from: /bg-white hover:bg-white text-white/g, to: 'bg-slate-800 hover:bg-slate-700 text-white' }
]);

fixFile('src/components/ChatWidget.tsx', [
  { from: /bg-white text-slate-800/g, to: 'bg-slate-200 text-slate-800' }
]);

const filesDir = fs.readdirSync('src/components');
for (const file of filesDir) {
  if (file.endsWith('.tsx')) {
    fixFile(`src/components/${file}`, [
      { from: /hover:text-white/g, to: 'hover:text-slate-900' }
    ]);
  }
}

fixFile('src/App.tsx', [
  { from: /hover:text-white/g, to: 'hover:text-slate-900' },
  { from: /peer-checked:after:border-white/g, to: 'peer-checked:after:border-slate-800' },
  { from: /peer-checked:after:bg-white/g, to: 'peer-checked:after:bg-slate-800' }
]);

