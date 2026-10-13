const { existsSync, readdirSync, readFileSync, writeFileSync } = require('node:fs');
const { execFileSync } = require('node:child_process');

const chunks = readdirSync('assets').filter((file) => /^site-assets\.zip\.part\d+$/.test(file)).sort();
if (!chunks.length) throw new Error('Archive chunks are missing.');
const archive = 'site-assets.zip';
writeFileSync(archive, Buffer.concat(chunks.map((file) => readFileSync(`assets/${file}`))));
execFileSync('unzip', ['-q', '-o', archive], { stdio: 'inherit' });
if (!existsSync('public/index.html')) throw new Error('Static site was not unpacked.');
