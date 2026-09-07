import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

/**
 * Derives the console artwork (backgrounds, covers, journal photographs, studio marks, portrait)
 * from the site's source images. An output that is newer than its source is left alone, so a
 * repeated dev start or build costs nothing.
 */
const read = async name => JSON.parse(await fs.readFile(`src/data/${name}.json`, 'utf8'));
const [projects, plugins, events, experience] = await Promise.all([read('projects'), read('plugins'), read('events'), read('experience')]);
// Mirrors the ordering in src/data/console.ts: the whole timeline, newest first.
const journal = events.slice().sort((a, b) => b.date.localeCompare(a.date));
const modified = async file => { try { return (await fs.stat(file)).mtimeMs; } catch { return -1; } };
let written = 0;
let total = 0;
const missing = [];

async function derive(source, output, build, orient = true) {
  total++;
  if ((await modified(output)) > (await modified(source))) return;
  try {
    await fs.access(source);
  } catch { missing.push(source); return; }
  await fs.mkdir(path.dirname(output), { recursive: true });
  await build(orient ? sharp(source).rotate() : sharp(source)).toFile(output);
  written++;
}

const artwork = [
  ...projects.map((p, i) => ({ id: `game-${i}`, source: `public${p.image}` })),
  ...plugins.filter(p => !p.hidden).map((p, i) => ({ id: `plugin-${i}`, source: `public${p.cover}` })),
  ...journal.flatMap((e, i) => (e.images || []).length ? [{ id: `journal-${i}`, source: `public/${e.images[0]}` }] : []),
];
for (const { id, source } of artwork) {
  await derive(source, `public/console/art/${id}.webp`, image => image.resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }));
  await derive(source, `public/console/covers/${id}.webp`, image => image.resize({ width: 480, withoutEnlargement: true }).webp({ quality: 84 }));
}
for (const [i, entry] of journal.entries()) {
  for (const [j, image] of (entry.images || []).slice(0, 4).entries()) {
    await derive(`public/${image}`, `public/console/journal/${i}-${j}.webp`, photo => photo.resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 83 }));
  }
}
for (const [i, studio] of experience.entries()) {
  if (studio.logo) await derive(`public${studio.logo}`, `public/console/studios/${i}.webp`, logo => logo.resize({ width: 420, withoutEnlargement: true }).webp({ quality: 88 }), false);
}
// The ventures carry their own artwork, so none of them falls back to a generic symbol.
await derive('public/ventures/polyglyph/hero.png', 'public/console/ventures/polyglyph.webp', hero => hero.resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 84 }), false);
await derive('public/ventures/polyglyph/mark.png', 'public/console/ventures/polyglyph-mark.webp', mark => mark.resize({ width: 480, withoutEnlargement: true }).webp({ quality: 88 }), false);
await derive('public/me/IMG_7.JPEG', 'public/console/miguel.webp', portrait => portrait.resize(500, 500).webp({ quality: 84 }));

if (missing.length) console.warn(`Missing ${missing.length} source image(s): ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? ', …' : ''}`);
console.log(written ? `Prepared ${written} of ${total} console images.` : `Console artwork is up to date (${total} images).`);
