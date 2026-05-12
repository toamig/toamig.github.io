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

import puppeteer from 'puppeteer';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const distDir    = path.resolve(__dirname, '..', 'dist');

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

  const outPath = path.join(distDir, 'cv', `miguel-vieira-cv-${variant}.pdf`);
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

async function main() {
  // Sanity check: was the site built?
  try {
    await fs.access(path.join(distDir, 'cv', 'neutral', 'index.html'));
  } catch {
    console.error('[cv-pdfs] dist/cv/neutral/index.html not found — run `astro build` first.');
    process.exit(1);
  }

  const server = await startServer();
  console.log(`[cv-pdfs] serving dist/ on http://${HOST}:${PORT}`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    for (const variant of ['neutral', 'editorial']) {
      const out = await generatePdf(browser, variant);
      const rel = path.relative(distDir, out).replace(/\\/g, '/');
      console.log(`[cv-pdfs] wrote ${rel}`);
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
