import { cp, mkdir, readFile, rm, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const wordpress = path.join(root, 'public', 'wordpress');
const out = path.join(import.meta.dirname, 'public');
const siteUrl = process.env.LOCAL_SITE_URL || 'http://127.0.0.1:8097/';

async function copyIfPresent(source, destination) {
  if (!existsSync(source)) return;
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination, { recursive: true });
}

function localPath(url) {
  const parsed = new URL(url, siteUrl);
  return decodeURIComponent(parsed.pathname);
}

async function main() {
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  const response = await fetch(siteUrl);
  if (!response.ok) throw new Error(`Local preview returned ${response.status}`);
  let html = await response.text();

  // A static Vercel build has no WordPress endpoints, nonce or PHP handler.
  html = html
    .replaceAll(siteUrl.replace(/\/$/, ''), '')
    .replace(/<link[^>]+wp-json[^>]*>\s*/gi, '')
    .replace(/<link[^>]+xmlrpc[^>]*>\s*/gi, '')
    .replace(/<input[^>]+name=["'](?:mr_nonce|_wp_http_referer|return_to)["'][^>]*>\s*/gi, '')
    .replace(/action=["'][^"']*wp-admin\/admin-post\.php["']/i, 'action="/api/lead" data-static-contact')
    .replace(/<\/body>/i, '  <script src="/static-contact.js"></script>\n</body>');
  await writeFile(path.join(out, 'index.html'), html, 'utf8');

  const theme = path.join(wordpress, 'wp-content', 'themes', 'divers');
  await copyIfPresent(path.join(theme, 'src'), path.join(out, 'wp-content', 'themes', 'divers', 'src'));
  await copyIfPresent(path.join(theme, 'art-icons'), path.join(out, 'wp-content', 'themes', 'divers', 'art-icons'));
  await copyIfPresent(path.join(theme, 'atelier-assets'), path.join(out, 'wp-content', 'themes', 'divers', 'atelier-assets'));
  await copyIfPresent(path.join(wordpress, 'wp-includes', 'js', 'jquery'), path.join(out, 'wp-includes', 'js', 'jquery'));
  await copyIfPresent(path.join(import.meta.dirname, 'static-contact.js'), path.join(out, 'static-contact.js'));

  const uploadPaths = [...html.matchAll(/(\/wp-content\/uploads\/[^"'?#\s)]+)/gi)]
    .map((match) => match[1])
    .filter((value, index, values) => values.indexOf(value) === index);
  for (const urlPath of uploadPaths) {
    const source = path.join(wordpress, ...urlPath.split('/').filter(Boolean));
    const destination = path.join(out, ...urlPath.split('/').filter(Boolean));
    await copyIfPresent(source, destination);
  }

  const summary = {
    page: 'public/index.html',
    uploadAssets: uploadPaths.length,
    generatedAt: new Date().toISOString(),
  };
  await writeFile(path.join(import.meta.dirname, 'build-summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
