/* Builds the whole site into one self-contained page: dist/index.html
   usage: node tools/build.js [--no-dedupe] */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { expand, ROOT } = require('./load');

if (!process.argv.includes('--no-dedupe')) execFileSync(process.execPath, [path.join(__dirname, 'dedupe.js')], { stdio: 'inherit' });

const order = require('./order.json');
const files = [].concat.apply([], order.map(expand)).filter(f => fs.existsSync(f));
const js = files.map(f => `/* ---- ${path.relative(ROOT, f)} ---- */\n` + fs.readFileSync(f, 'utf8')).join('\n');
const css = fs.readFileSync(path.join(ROOT, 'src/style.css'), 'utf8') + '\n' + fs.readFileSync(path.join(ROOT, 'src/ui/extra.css'), 'utf8');
const html = `<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Selective Exam Practice</title>
<meta name="description" content="100 full practice exams for the NSW Selective High School Placement Test: Reading, Thinking Skills, Mathematical Reasoning and Writing, at three levels, with explanations and a mistakes notebook.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;600&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap">
<style>
${css}
</style>
</head>
<body>
<div id="app"><p style="padding:24px;font-family:sans-serif">Loading…</p></div>
<noscript><p style="padding:24px">This site needs JavaScript turned on.</p></noscript>
<script>
${js}
</script>
</body>
</html>
`;
fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'dist/index.html'), html);
console.log(`dist/index.html written: ${(html.length / 1024).toFixed(0)} KB from ${files.length} source files`);
