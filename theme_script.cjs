const fs = require('fs');
const path = require('path');

const replacements = [
  { from: /bg-\[#121826\]/g, to: 'bg-slate-50' },
  { from: /bg-slate-900/g, to: 'bg-white' },
  { from: /bg-slate-800/g, to: 'bg-white' },
  { from: /border-slate-800/g, to: 'border-slate-200' },
  { from: /border-slate-700/g, to: 'border-slate-300' },
  { from: /text-slate-100/g, to: 'text-slate-900' },
  { from: /text-slate-200/g, to: 'text-slate-800' },
  { from: /text-slate-300/g, to: 'text-slate-700' },
  { from: /text-slate-400/g, to: 'text-slate-600' },
  { from: /text-slate-500/g, to: 'text-slate-500' },
  { from: /text-slate-600/g, to: 'text-slate-400' },
  { from: /bg-cyan-500/g, to: 'bg-blue-600' },
  { from: /bg-cyan-600/g, to: 'bg-blue-600' },
  { from: /text-cyan-400/g, to: 'text-blue-600' },
  { from: /text-cyan-500/g, to: 'text-blue-600' },
  { from: /border-cyan-500/g, to: 'border-blue-600' },
  { from: /ring-cyan-500/g, to: 'ring-blue-600' },
  { from: /text-emerald-400/g, to: 'text-emerald-600' },
  { from: /text-rose-400/g, to: 'text-rose-600' },
  { from: /text-amber-400/g, to: 'text-amber-600' },
];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');

let count = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  replacements.forEach(r => {
    content = content.replace(r.from, r.to);
  });
  
  // Custom manual tweaks
  content = content.replace(/hover:bg-slate-800\/60/g, 'hover:bg-slate-50');
  content = content.replace(/hover:bg-slate-800\/50/g, 'hover:bg-slate-50');
  content = content.replace(/hover:bg-slate-800/g, 'hover:bg-slate-100');
  content = content.replace(/bg-slate-800\/30/g, 'bg-white');
  content = content.replace(/bg-slate-800\/50/g, 'bg-slate-100');
  content = content.replace(/bg-cyan-500\/10/g, 'bg-blue-50');
  content = content.replace(/bg-cyan-500\/20/g, 'bg-blue-100');
  content = content.replace(/bg-cyan-500\/5/g, 'bg-blue-50');
  content = content.replace(/border-cyan-500\/20/g, 'border-blue-200');
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    count++;
  }
});

console.log(`Updated ${count} files.`);
