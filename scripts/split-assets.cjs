const { mkdirSync, readFileSync, writeFileSync } = require('node:fs');

const archive = readFileSync('site-assets.zip');
const chunkSize = 1024 * 1024;
mkdirSync('assets', { recursive: true });
for (let offset = 0, index = 1; offset < archive.length; offset += chunkSize, index += 1) {
  const name = `assets/site-assets.zip.part${String(index).padStart(3, '0')}`;
  writeFileSync(name, archive.subarray(offset, offset + chunkSize));
}
console.log(JSON.stringify({ bytes: archive.length, parts: Math.ceil(archive.length / chunkSize) }));
