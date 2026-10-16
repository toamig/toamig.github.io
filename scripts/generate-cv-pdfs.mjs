// Build-time CV PDF generator.
//
// Why this exists:
//   `window.print()` from the browser produces different output on every
//   device — iOS Safari injects its own URL/date headers and ignores
//   `@page { margin: 0 }`, Chrome's page-break behaviour drifts between
//   versions, and viewport-unit math during print is unreliable. By
//   generating the PDFs once at build time in a known-good Chromium and
//   shipping them as static assets, every visitor gets the same A4
//   document regardless of their browser.
//
// Flow:
//   1. Spin up a tiny Node http server pointing at `dist/` (the static
//      output Astro just produced).
//   2. Launch headless Chromium via Puppeteer, navigate to each CV
//      variant, wait for fonts and layout to settle.
//   3. Emit `cv/miguel-vieira-cv-{variant}.pdf` next to the HTML pages.
//
// Output paths line up with what the "Download PDF" buttons link to.
//
// A PDF is a pure function of its page: the HTML, the local files it pulls in
// (stylesheets, the logo, anything their url()s name), this script and the
// Chromium that prints it. Each rendered PDF is kept in .cache/cv-pdfs with a
// fingerprint of those inputs, and a build whose fingerprint matches copies
// the kept PDF instead of starting Chromium. The deploy workflow caches that
// folder between runs.

import puppeteer from 'puppeteer';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const distDir    = path.resolve(__dirname, '..', 'dist');

const cacheDir   = path.resolve(__dirname, '..', '.cache', 'cv-pdfs');
const VARIANTS   = ['neutral', 'editorial'];

const PORT = 4567;
const HOST = '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif':  'image/gif',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.otf':  'font/otf',
  '.pdf':  'application/pdf',
};

// Resolve a request path under dist/. Falls back to <path>/index.html for
// pretty-URL routes like /cv/neutral. Returns null if the file is outside
// distDir (defence in depth) or doesn't exist.
async function resolveFile(reqPath) {
  const decoded = decodeURIComponent(reqPath.split('?')[0]);
  let candidate = path.join(distDir, decoded);
  // Prevent path traversal.
  if (!candidate.startsWith(distDir)) return null;

  try {
    const stat = await fs.stat(candidate);
    if (stat.isDirectory()) candidate = path.join(candidate, 'index.html');
  } catch {
    // Maybe it's a pretty URL without a trailing slash — try as a dir.
    try {
      const stat = await fs.stat(candidate);
      if (stat.isDirectory()) candidate = path.join(candidate, 'index.html');
    } catch {}
  }

  try {
    await fs.access(candidate);
    return candidate;
  } catch {
    return null;
  }
}

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const file = await resolveFile(req.url);
      if (!file) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
        return;
      }
      const ext = path.extname(file).toLowerCase();
      const mime = MIME[ext] || 'application/octet-stream';
      const data = await fs.readFile(file);
      res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-store' });
      res.end(data);
    });
    server.listen(PORT, HOST, () => resolve(server));
    server.on('error', reject);
  });
}

async function generatePdf(browser, variant) {
  const page = await browser.newPage();
  // Force a desktop viewport so the mobile transform-scale CSS doesn't
  // fire — we want the unscaled A4 layout for the PDF.
  await page.setViewport({ width: 1280, height: 1600, deviceScaleFactor: 1 });

  const url = `http://${HOST}:${PORT}/cv/${variant}/`;
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60_000 });
  // Belt and suspenders: wait until web fonts (Inter / Bricolage Grotesque)
  // have fully loaded before rendering — Puppeteer's networkidle does not
  // always catch CSS-driven font fetches.
  await page.evaluate(() => document.fonts.ready);

  const outPath = pdfPath(variant);
  await page.pdf({
    path: outPath,
    format: 'A4',
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false,
  });
  await page.close();
  return outPath;
}

// Local files a page or stylesheet references, resolved under dist/. Links to
// other pages and to the PDFs themselves have no extension worth hashing.
const ASSET = /\.(css|js|mjs|svg|png|jpe?g|webp|gif|woff2?|ttf|otf)$/i;
function localRefs(text) {
  const refs = [...text.matchAll(/(?:src|href)="(\/[^"#?]+)"|url\(\s*['"]?(\/[^'")?#]+)/g)]
    .map(m => m[1] || m[2]);
  return [...new Set(refs)].filter(r => ASSET.test(r));
}

async function fingerprint(variant) {
  const hash = createHash('sha1');
  hash.update(await fs.readFile(__filename));
  hash.update(puppeteer.defaultBrowserRevision ?? '');
  const html = await fs.readFile(path.join(distDir, 'cv', variant, 'index.html'), 'utf8');
  hash.update(html);
  const seen = new Set();
  const visit = async (ref) => {
    if (seen.has(ref)) return;
    seen.add(ref);
    const bytes = await fs.readFile(path.join(distDir, ref)).catch(() => null);
    hash.update(ref);
    if (!bytes) return;
    hash.update(bytes);
    if (ref.endsWith('.css')) for (const inner of localRefs(bytes.toString('utf8'))) await visit(inner);
  };
  for (const ref of localRefs(html).sort()) await visit(ref);
  return hash.digest('hex');
}

const pdfPath = variant => path.join(distDir, 'cv', `miguel-vieira-cv-${variant}.pdf`);

async function main() {
  // Sanity check: was the site built?
  try {
    await fs.access(path.join(distDir, 'cv', 'neutral', 'index.html'));
  } catch {
    console.error('[cv-pdfs] dist/cv/neutral/index.html not found — run `astro build` first.');
    process.exit(1);
  }

  // Reuse every PDF whose page has not changed since it was last printed.
  await fs.mkdir(cacheDir, { recursive: true });
  const todo = [];
  for (const variant of VARIANTS) {
    const print = await fingerprint(variant);
    const kept = path.join(cacheDir, `${variant}.pdf`);
    const keptPrint = await fs.readFile(path.join(cacheDir, `${variant}.sha1`), 'utf8').catch(() => '');
    if (keptPrint === print && await fs.access(kept).then(() => true, () => false)) {
      await fs.copyFile(kept, pdfPath(variant));
      console.log(`[cv-pdfs] reused cv/miguel-vieira-cv-${variant}.pdf (page unchanged)`);
    } else {
      todo.push({ variant, print, kept });
    }
  }
  if (!todo.length) return;

  // CI installs dependencies without Puppeteer's browser download, so fetch
  // Chromium here, only on the builds that actually print something.
  let executable = '';
  try { executable = puppeteer.executablePath(); } catch {}
  if (!executable || !(await fs.access(executable).then(() => true, () => false))) {
    console.log('[cv-pdfs] installing Chromium for Puppeteer');
    execSync('npx puppeteer browsers install chrome', { stdio: 'inherit' });
  }

  const server = await startServer();
  console.log(`[cv-pdfs] serving dist/ on http://${HOST}:${PORT}`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    for (const { variant, print, kept } of todo) {
      const out = await generatePdf(browser, variant);
      const rel = path.relative(distDir, out).replace(/\\/g, '/');
      console.log(`[cv-pdfs] wrote ${rel}`);
      await fs.copyFile(out, kept);
      await fs.writeFile(path.join(cacheDir, `${variant}.sha1`), print);
    }
  } finally {
    if (browser) await browser.close();
    server.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
