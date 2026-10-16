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

// The homepage Work grid and the header's Work menu (src/data/work.ts). Tiles are at most about
// 560px wide, so 1120px covers a 2x screen; the full-size sources were up to 3840px, and decoding
// a dozen of them at once stalled the page transition back to the grid. Thumbnails are for the
// menu's 36px squares. Same ids as work.ts: a project's slugged name, a venture's id.
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const raster = p => !!p && !/\.svg$/i.test(p);
const tile = art => art.resize({ width: 1120, withoutEnlargement: true }).webp({ quality: 80 });
const thumb = art => art.resize(112, 112, { fit: 'cover' }).webp({ quality: 80 });
const markThumb = mark => mark.resize(112, 112, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality: 88 });
for (const p of projects) {
  derive(`public${p.image}`, `public/tiles/${slug(p.name)}.webp`, tile);
  derive(`public${p.image}`, `public/tiles/${slug(p.name)}-thumb.webp`, thumb);
}
const shownPlugins = plugins.filter(p => !p.hidden);
for (const p of shownPlugins) derive(`public${p.cover}`, `public/tiles/plugin-${slug(p.name)}.webp`, tile);
if (shownPlugins[0]) derive(`public${shownPlugins[0].logo}`, 'public/tiles/plugins-thumb.webp', markThumb, false);
// Timeline moments (src/data/timeline.ts): a card thumbnail and a banner for the moment's page,
// both from its first photo. Phone photos run to 4000px, and the cards show them about 200px wide.
for (const e of events) {
  const first = (e.images || [])[0];
  if (!raster(first)) continue;
  const source = `public/${first.replace(/^\//, '')}`;
  derive(source, `public/tiles/moment-${e.id}.webp`, art => art.resize(560, 400, { fit: 'cover' }).webp({ quality: 80 }));
  derive(source, `public/tiles/moment-${e.id}-wide.webp`, art => art.resize({ width: 1800, withoutEnlargement: true }).webp({ quality: 80 }));
}
// Every photo of a moment, small, for its page's gallery and the photo viewer's strip. The viewer
// itself shows the originals; this copy is also what it shows while an original loads.
for (const e of events) {
  for (const [n, image] of (e.images || []).entries()) {
    if (!raster(image)) continue;
    derive(`public/${image.replace(/^\//, '')}`, `public/tiles/moment-${e.id}-${n}.webp`, photo => photo.resize({ width: 480, withoutEnlargement: true }).webp({ quality: 78 }));
  }
}
for (const v of ventures.filter(v => !v.hidden)) {
  if (raster(v.image)) derive(`public${v.image}`, `public/tiles/${v.id}.webp`, tile, false);
  if (raster(v.mark)) derive(`public${v.mark}`, `public/tiles/${v.id}-thumb.webp`, markThumb, false);
  else if (!v.mark && raster(v.image)) derive(`public${v.image}`, `public/tiles/${v.id}-thumb.webp`, thumb, false);
}

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
