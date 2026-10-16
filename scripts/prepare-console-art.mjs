import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

/**
 * Derives the console artwork (backgrounds, covers, journal photographs, studio marks, portrait)
 * from the site's source images. An output is left alone while its source bytes and its recipe
 * are the ones it was made from, so a repeated dev start or build costs nothing.
 *
 * Freshness is decided by content, not file dates: a CI checkout stamps every source with the
 * checkout time, so a date check would rebuild everything the deploy workflow restored from its
 * cache. The manifest records what each output was made from, and the workflow caches it with
 * the images.
 */
const MANIFEST = '.cache/console-art.json';
const read = async name => JSON.parse(await fs.readFile(`src/data/${name}.json`, 'utf8'));
const [projects, plugins, events, experience, ventures] = await Promise.all([read('projects'), read('plugins'), read('events'), read('experience'), read('ventures')]);
// Mirrors the ordering in src/data/console.ts: the whole timeline, newest first.
const journal = events.slice().sort((a, b) => b.date.localeCompare(a.date));
const exists = async file => { try { await fs.access(file); return true; } catch { return false; } };
const previous = await fs.readFile(MANIFEST, 'utf8').then(JSON.parse).catch(() => ({}));
const manifest = {};
const jobs = [];
let written = 0;
const missing = [];

/** Queues one output; the work happens below, several at a time. */
function derive(source, output, build, orient = true) {
  jobs.push({ source, output, build, orient });
}

async function run({ source, output, build, orient }) {
  let bytes;
  try { bytes = await fs.readFile(source); } catch { missing.push(source); return; }
  // The recipe is part of the fingerprint, so changing a size or quality below redoes those outputs.
  const fingerprint = createHash('sha1').update(bytes).update(String(orient)).update(build.toString()).digest('hex');
  manifest[output] = fingerprint;
  if (previous[output] === fingerprint && await exists(output)) return;
  await fs.mkdir(path.dirname(output), { recursive: true });
  await build(orient ? sharp(bytes).rotate() : sharp(bytes)).toFile(output);
  written++;
}

const artwork = [
  ...projects.map((p, i) => ({ id: `game-${i}`, source: `public${p.image}` })),
  ...plugins.filter(p => !p.hidden).map((p, i) => ({ id: `plugin-${i}`, source: `public${p.cover}` })),
  ...journal.flatMap((e, i) => (e.images || []).length ? [{ id: `journal-${i}`, source: `public/${e.images[0]}` }] : []),
];
for (const { id, source } of artwork) {
  derive(source, `public/console/art/${id}.webp`, image => image.resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }));
  derive(source, `public/console/covers/${id}.webp`, image => image.resize({ width: 480, withoutEnlargement: true }).webp({ quality: 84 }));
}
for (const [i, entry] of journal.entries()) {
  for (const [j, image] of (entry.images || []).slice(0, 4).entries()) {
    derive(`public/${image}`, `public/console/journal/${i}-${j}.webp`, photo => photo.resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 83 }));
  }
}
for (const [i, studio] of experience.entries()) {
  if (studio.logo) derive(`public${studio.logo}`, `public/console/studios/${i}.webp`, logo => logo.resize({ width: 420, withoutEnlargement: true }).webp({ quality: 88 }), false);
}
// The ventures carry their own artwork, so none of them falls back to a generic symbol. Mirrors
// ventureArt() in src/data/console.ts: the key art, then the mark as the rail cover, or a cover cut
// from the key art when there is no mark.
for (const v of ventures.filter(v => !v.hidden)) {
  if (v.image) derive(`public${v.image}`, `public/console/ventures/${v.id}.webp`, art => art.resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 84 }), false);
  if (v.mark) derive(`public${v.mark}`, `public/console/ventures/${v.id}-mark.webp`, mark => mark.resize({ width: 480, withoutEnlargement: true }).webp({ quality: 88 }), false);
  else if (v.image) derive(`public${v.image}`, `public/console/ventures/${v.id}-cover.webp`, art => art.resize({ width: 480, withoutEnlargement: true }).webp({ quality: 84 }), false);
}
derive('public/me/IMG_7.JPEG', 'public/console/miguel.webp', portrait => portrait.resize(500, 500).webp({ quality: 84 }));

// One worker per core. The outputs are independent, and one image at a time leaves most of a
// CI runner idle on a cold cache.
let next = 0;
const worker = async () => { while (next < jobs.length) await run(jobs[next++]); };
await Promise.all(Array.from({ length: Math.min(jobs.length, os.availableParallelism()) }, worker));
await fs.mkdir(path.dirname(MANIFEST), { recursive: true });
await fs.writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
const total = jobs.length;

if (missing.length) console.warn(`Missing ${missing.length} source image(s): ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? ', …' : ''}`);
console.log(written ? `Prepared ${written} of ${total} console images.` : `Console artwork is up to date (${total} images).`);
