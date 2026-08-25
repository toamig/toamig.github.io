// Downscale and recompress oversized images under public/.
//
// Why this exists:
//   public/ is copied to dist verbatim, so anything dropped in there ships at
//   whatever resolution it was uploaded at. Timeline photos came straight off
//   a phone and a drone, which put dist at 250 MB (89% of it public/events).
//   That is a page-weight problem for visitors first and a CI cost second.
//
// What it does:
//   Rewrites images in place, preserving the exact filename, extension, and
//   encoded format, so no JSON data or markup reference has to change. Only
//   writes when the re-encode is actually smaller, and skips anything already
//   within budget.
//
// Usage:
//   node scripts/optimize-images.mjs --dry     report only, touches nothing
//   node scripts/optimize-images.mjs           rewrite in place

import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');
const TARGET    = path.join(ROOT, 'public');

const DRY = process.argv.includes('--dry');

// Long-edge cap. Nothing on the site is displayed anywhere near this wide;
// it leaves headroom for high-DPI screens and full-bleed timeline photos.
const MAX_EDGE = 1920;

// Files under this never justify the rewrite.
const MIN_BYTES = 120 * 1024;

// Keep a rewrite only if it saves at least this much, so we don't churn files
// (and git history) for a rounding-error gain.
const MIN_SAVING = 0.10;

const JPEG_QUALITY = 82;

const JPEG_EXT = new Set(['.jpg', '.jpeg']);
const PNG_EXT  = new Set(['.png']);

async function walk(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else out.push(full);
  }
  return out;
}

const mb = bytes => (bytes / 1024 / 1024).toFixed(2);

async function process(file) {
  const ext  = path.extname(file).toLowerCase();
  const isJpeg = JPEG_EXT.has(ext);
  const isPng  = PNG_EXT.has(ext);
  if (!isJpeg && !isPng) return null;

  const before = (await fs.stat(file)).size;
  if (before < MIN_BYTES) return null;

  const image = sharp(file, { failOn: 'none' });
  const meta  = await image.metadata();
  const long  = Math.max(meta.width ?? 0, meta.height ?? 0);

  // `.rotate()` with no argument bakes in EXIF orientation. Without it, a
  // phone photo that relied on the orientation tag would come out sideways
  // once the tag is dropped by the re-encode.
  let pipeline = image.rotate();
  if (long > MAX_EDGE) {
    pipeline = pipeline.resize({
      width:  meta.width  >= meta.height ? MAX_EDGE : undefined,
      height: meta.height >  meta.width  ? MAX_EDGE : undefined,
      withoutEnlargement: true,
    });
  }

  pipeline = isJpeg
    ? pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    // Lossless for PNG: these include plugin logos and cover art, where
    // palette quantisation risks visible banding on brand assets.
    : pipeline.png({ compressionLevel: 9, effort: 10 });

  const buf   = await pipeline.toBuffer();
  const after = buf.length;
  const saved = (before - after) / before;

  if (saved < MIN_SAVING) return { file, before, after: before, skipped: true };

  if (!DRY) await fs.writeFile(file, buf);
  return { file, before, after, dims: [meta.width, meta.height], long, skipped: false };
}

async function main() {
  const files = await walk(TARGET);
  const results = [];

  for (const file of files) {
    try {
      const r = await process(file);
      if (r) results.push(r);
    } catch (err) {
      console.warn(`[images] skipped ${path.relative(ROOT, file)}: ${err.message}`);
    }
  }

  const changed = results.filter(r => !r.skipped);
  changed.sort((a, b) => (b.before - b.after) - (a.before - a.after));

  for (const r of changed.slice(0, 15)) {
    const rel = path.relative(TARGET, r.file).replace(/\\/g, '/');
    console.log(
      `  ${mb(r.before).padStart(7)} MB -> ${mb(r.after).padStart(7)} MB  ` +
      `(${String(r.dims[0])}x${String(r.dims[1])})  ${rel}`,
    );
  }
  if (changed.length > 15) console.log(`  ... and ${changed.length - 15} more`);

  const before = results.reduce((n, r) => n + r.before, 0);
  const after  = results.reduce((n, r) => n + r.after, 0);
  console.log('');
  console.log(`[images] ${DRY ? 'DRY RUN, nothing written' : 'rewrote files in place'}`);
  console.log(`[images] ${changed.length} of ${results.length} candidates changed`);
  console.log(`[images] ${mb(before)} MB -> ${mb(after)} MB (saved ${mb(before - after)} MB, ${((1 - after / before) * 100).toFixed(1)}%)`);
}

main().catch(err => { console.error(err); process.exit(1); });
