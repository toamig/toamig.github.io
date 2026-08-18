// Build-time cache for generated OG / social images.
//
// Why this exists:
//   Rendering these PNGs (satori to SVG, then resvg raster) is by far the
//   most expensive part of `astro build`. On CI the OG routes alone account
//   for roughly 75 of the 87 seconds a build takes, while the pages
//   themselves render in milliseconds. Almost every deploy changes none of
//   their inputs: a copy tweak on a plugin page, or a timeline event edited
//   from /admin, has no effect on the LinkedIn banners or the homepage card.
//
//   So each image is keyed on exactly what it is drawn from. If the key is
//   unchanged since the last build, the PNG is read back from `.cache/og`
//   instead of being re-rendered.
//
// Key composition:
//   1. A "design salt" hashing every file under src/pages/og and the fonts.
//      Any change to how the images are drawn busts the whole cache.
//   2. A per-image `name` (the route or variant it belongs to).
//   3. Caller-supplied `inputs`: the data records and image fingerprints the
//      image actually reads. Use `fileFingerprint()` for anything on disk.
//
// The cache directory is gitignored and restored on CI via actions/cache.
// Entries not touched during a build are pruned on exit, so the directory
// tracks the current set of images rather than growing forever.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT      = process.cwd();
const CACHE_DIR = path.join(ROOT, '.cache', 'og');

// Set OG_CACHE=0 to force every image to re-render (useful when debugging
// the generators themselves).
const ENABLED = process.env.OG_CACHE !== '0';

const sha = (input: crypto.BinaryLike) =>
  crypto.createHash('sha256').update(input).digest('hex');

/** Every file under `dir`, recursively, sorted for a stable hash order. */
function walk(dir: string): string[] {
  let out: string[] = [];
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out = out.concat(walk(full));
    else out.push(full);
  }
  return out;
}

/**
 * Hash of everything that controls how the images look: the generator
 * sources, the fonts they embed, and this file. Computed once per process.
 */
let designSalt: string | null = null;
function getDesignSalt(): string {
  if (designSalt) return designSalt;
  const files = [
    ...walk(path.join(ROOT, 'src', 'pages', 'og')),
    ...walk(path.join(ROOT, 'src', 'assets', 'fonts')),
    path.join(ROOT, 'src', 'lib', 'og-cache.ts'),
  ];
  const hash = crypto.createHash('sha256');
  for (const file of files) {
    hash.update(path.relative(ROOT, file).replace(/\\/g, '/'));
    try {
      hash.update(fs.readFileSync(file));
    } catch {
      hash.update('missing');
    }
  }
  designSalt = hash.digest('hex');
  return designSalt;
}

/**
 * Content hash of a file the image embeds, so replacing an asset re-renders
 * the images that use it. `relPath` is relative to the repo root and may be
 * written with or without a leading slash (public/ paths from the JSON data
 * carry one). Missing files hash to a stable sentinel rather than throwing.
 */
const fingerprints = new Map<string, string>();
export function fileFingerprint(relPath: string): string {
  if (!relPath) return 'none';
  const cached = fingerprints.get(relPath);
  if (cached) return cached;

  // Data files reference public assets as "/plugins/foo.png"; on disk those
  // live under public/. Anything else is treated as repo-relative already.
  const clean = relPath.replace(/^\//, '');
  const candidates = [path.join(ROOT, 'public', clean), path.join(ROOT, clean)];

  let result = 'missing';
  for (const candidate of candidates) {
    try {
      result = sha(fs.readFileSync(candidate));
      break;
    } catch {
      /* try the next candidate */
    }
  }
  fingerprints.set(relPath, result);
  return result;
}

// Keys used this build. Anything else in the directory is stale.
const touched = new Set<string>();
let pruneRegistered = false;

function registerPrune() {
  if (pruneRegistered) return;
  pruneRegistered = true;
  process.on('exit', () => {
    try {
      for (const file of fs.readdirSync(CACHE_DIR)) {
        if (!touched.has(file)) fs.unlinkSync(path.join(CACHE_DIR, file));
      }
    } catch {
      /* nothing cached yet, or the directory went away */
    }
  });
}

/**
 * Return the PNG for `name`, rendering it only if its inputs changed.
 *
 * @param name   Identifier for the image, unique per route/variant.
 * @param inputs Everything the image is drawn from. Serialised into the key,
 *               so pass fingerprints for files rather than file paths.
 * @param render Produces the PNG. Only called on a cache miss, so keep the
 *               satori / resvg / sharp work inside it.
 */
export async function ogCached(
  name: string,
  inputs: unknown,
  render: () => Promise<Uint8Array>,
): Promise<Buffer> {
  if (!ENABLED) return Buffer.from(await render());

  const key  = sha(`${getDesignSalt()} ${name} ${JSON.stringify(inputs)}`);
  const file = `${key}.png`;
  const full = path.join(CACHE_DIR, file);

  registerPrune();
  touched.add(file);

  try {
    const hit = fs.readFileSync(full);
    console.log(`[og-cache] hit  ${name}`);
    return hit;
  } catch {
    /* miss: render below */
  }

  const png = Buffer.from(await render());
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(full, png);
  } catch (err) {
    console.warn(`[og-cache] could not write ${name}: ${(err as Error).message}`);
  }
  return png;
}
