// The root package.json has "type": "module" (for Vite/Tailwind configs), but the Electron
// main/preload code is compiled to CommonJS. This marks dist/electron as CommonJS so Node/Electron
// load those .js files correctly.
const fs = require('node:fs');
const path = require('node:path');

const target = path.join(__dirname, '..', 'dist', 'electron', 'package.json');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, JSON.stringify({ type: 'commonjs' }, null, 2) + '\n');
