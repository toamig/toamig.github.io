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
const journal = ['evt-2025-Greece', 'evt-2025-Drone', 'evt-2025-Paris', 'evt-2024-Asturias', 'evt-2023-netherlands'].map(id => events.find(e => e.id === id));
const modified = async file => { try { return (await fs.stat(file)).mtimeMs; } catch { return -1; } };
let written = 0;
let total = 0;

async function derive(source, output, build, orient = true) {
  total++;
  if ((await modified(output)) > (await modified(source))) return;
  await fs.mkdir(path.dirname(output), { recursive: true });
  await build(orient ? sharp(source).rotate() : sharp(source)).toFile(output);
  written++;
}

const artwork = [
  ...projects.map((p, i) => ({ id: `game-${i}`, source: `public${p.image}` })),
  ...plugins.filter(p => !p.hidden).map((p, i) => ({ id: `plugin-${i}`, source: `public${p.cover}` })),
  ...journal.map((e, i) => ({ id: `journal-${i}`, source: `public/${e.images[0]}` })),
];
for (const { id, source } of artwork) {
  await derive(source, `public/console/art/${id}.webp`, image => image.resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }));
  await derive(source, `public/console/covers/${id}.webp`, image => image.resize({ width: 480, withoutEnlargement: true }).webp({ quality: 84 }));
}
for (const [i, entry] of journal.entries()) {
  for (const [j, image] of entry.images.slice(0, 4).entries()) {
    await derive(`public/${image}`, `public/console/journal/${i}-${j}.webp`, photo => photo.resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 83 }));
  }
}
for (const [i, studio] of experience.entries()) {
  if (studio.logo) await derive(`public${studio.logo}`, `public/console/studios/${i}.webp`, logo => logo.resize({ width: 420, withoutEnlargement: true }).webp({ quality: 88 }), false);
}
await derive('public/me/IMG_7.JPEG', 'public/console/miguel.webp', portrait => portrait.resize(500, 500).webp({ quality: 84 }));
console.log(written ? `Prepared ${written} of ${total} console images.` : `Console artwork is up to date (${total} images).`);
