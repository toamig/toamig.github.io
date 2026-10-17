// One list of everything Miguel has made, for the homepage Work grid and the
// /work/<id>/ detail pages. Built from the existing JSON (ventures, projects,
// experience, plugins) so nothing is written twice: the CV and the console keep
// reading those files directly, and anything added there shows up here too.
import ventures   from './ventures.json';
import projects   from './projects.json';
import experience from './experience.json';
import plugins    from './plugins.json';

/** The shelves the Work grid filters by. */
export type WorkShelf = 'studio' | 'games' | 'products';

/** How much of the bento grid a tile takes: 2x2, 2x1 or 1x1. */
export type WorkSize = 'xl' | 'wide' | 'sm';

export interface WorkLink { href: string; label: string; external: boolean; }

export interface WorkItem {
  id: string;
  name: string;
  shelf: WorkShelf;
  size: WorkSize;
  /** Short context for the tile: a role, a studio, or what the thing is. */
  label: string;
  /** Where it stands right now, when that is worth saying (public beta, demo). */
  state?: string;
  /** One line that says what it is. */
  line: string;
  desc: string;
  bullets: string[];
  tags: string[];
  image?: string;
  imageAlt: string;
  focus?: string;
  /** The art at tile size (public/tiles/, see scripts/prepare-console-art.mjs). */
  tile?: string;
  /** A small square for menus: the product's mark, or the art cropped. */
  thumb?: string;
  role?: string;
  studio?: { name: string; period: string; href?: string; bullets: string[] };
  /** Where the tile goes: the detail page, or the thing's own page on this site. */
  href: string;
  hasDetail: boolean;
  /** The outbound link a detail page offers (store page, demo, product site). */
  link?: WorkLink;
  /** Shown instead of a link when there is nothing public to open yet. */
  note?: string;
  palette?: { bg: string; ink: string; accent: string; glow: string };
}

export const SHELVES: { id: WorkShelf; label: string }[] = [
  { id: 'studio',   label: 'Studio games' },
  { id: 'games',    label: 'My games' },
  { id: 'products', label: 'Products' },
];

// The grid's composition when every shelf is showing. Anything not listed
// still appears, as a small tile at the end, so a new project never goes
// missing just because nobody placed it.
//
// The grid is four columns, so the spans below (xl 4, wide 2, sm 1) should add
// up to a multiple of four or the last row is left short. Today: 4 + 8 x 2 +
// 4 x 1 = 24, six full rows. Adding a project means choosing which tile
// changes size to keep that true.
const LAYOUT: [string, WorkSize][] = [
  ['polyglyph',          'xl'],
  ['timefront',          'wide'],
  ['synthform',          'wide'],
  ['counting-sheep',     'wide'],
  ['sesqui',             'wide'],
  ['radar',              'wide'],
  ['dakar-desert-rally', 'wide'],
  ['road-kings',         'wide'],
  ['plugins',            'wide'],
  ['autorocket',         'sm'],
  ['consulting',         'sm'],
  ['totally-basketball', 'sm'],
  ['aotearoa-explorers', 'sm'],
];

// Which studio each shipped game was made at, so its page can say what the job
// was. Only the pairings the CV itself states; the rest stay unattributed.
const STUDIO_OF: Record<string, string> = {
  'dakar-desert-rally': 'Saber Interactive Porto',
  'road-kings':         'Saber Interactive Porto',
  'timefront':          'Flama Craftworks',
  'autorocket':         'Dive Studios (FEUP / Visionarium)',
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const isExternal = (u?: string) => !!u && /^https?:/i.test(u);
// Tile-sized art and menu thumbnails are derived before dev and build; vector
// marks are already small, so they are used as they are.
const isRaster = (u?: string) => !!u && !/.svg$/i.test(u);
const tileOf = (id: string, source?: string) => (isRaster(source) ? `/tiles/${id}.webp` : undefined);
const thumbOf = (id: string) => `/tiles/${id}-thumb.webp`;
const firstSentence = (s: string) => (s.match(/^.*?[.!?](\s|$)/)?.[0] ?? s).trim();

// Names the store a project link points at, so the button says where it goes.
function storeLabel(href: string): string {
  if (/steampowered\.com/.test(href)) return 'View on Steam';
  if (/itch\.io/.test(href))          return 'Open on itch.io';
  if (/meta\.com/.test(href))         return 'View on Meta Quest';
  return 'Visit the project';
}

const visiblePlugins = plugins.filter(p => !p.hidden);
const livePlugins = visiblePlugins.filter(p => p.status === 'live').length;

/** Covers for the plugins tile, which cycles through them. */
export const pluginCovers = visiblePlugins.map(p => ({ name: p.name, cover: `/tiles/plugin-${slug(p.name)}.webp` }));

function fromVenture(v: (typeof ventures)[number]): WorkItem {
  const own = !isExternal(v.href) && !!v.href;          // has a page on this site
  const onSite = own || v.id === 'radar';               // Radar's absolute URL is still this site
  const isGame = (v as any).kind === 'game';
  const image = (v as any).image as string | undefined;
  const label =
    v.id === 'plugins' ? `${visiblePlugins.length} plugins, ${livePlugins} live on Fab` :
    v.id === 'radar'   ? 'Daily briefing' :
    isGame             ? 'My game' :
                         v.kicker;
  return {
    id: v.id,
    name: v.name,
    shelf: isGame ? 'games' : 'products',
    size: 'sm',
    label,
    state: v.state || undefined,
    line: (v as any).tagline ?? firstSentence(v.desc),
    desc: v.desc,
    bullets: (v as any).bullets ?? [],
    tags: v.tags ?? [],
    image,
    imageAlt: (v as any).imageAlt ?? '',
    focus: (v as any).focus,
    tile: tileOf(v.id, image),
    thumb: (v as any).mark && !isRaster((v as any).mark) ? (v as any).mark
      : (v as any).mark || isRaster(image) || v.id === 'plugins' ? thumbOf(v.id) : undefined,
    role: v.role,
    href: onSite ? (v.id === 'radar' ? '/radar/' : v.href) : `/work/${v.id}/`,
    hasDetail: !onSite,
    link: isExternal(v.href) && !onSite ? { href: v.href, label: v.cta, external: true } : undefined,
    note: (v as any).note,
    palette: (v as any).palette,
  };
}

function fromProject(p: (typeof projects)[number]): WorkItem {
  const id = slug(p.name);
  const company = STUDIO_OF[id];
  const job = company ? experience.find(e => e.name === company) : undefined;
  return {
    id,
    name: p.name,
    shelf: 'studio',
    size: 'sm',
    label: p.role || 'Studio game',
    line: p.desc,
    desc: p.desc,
    bullets: [],
    tags: [],
    image: p.image,
    imageAlt: `${p.name} key art`,
    tile: tileOf(id, p.image),
    thumb: thumbOf(id),
    role: p.role || undefined,
    studio: job ? {
      name: job.name,
      period: job.period,
      href: isExternal(job.href) ? job.href : undefined,
      bullets: job.bullets ?? [],
    } : undefined,
    href: `/work/${id}/`,
    hasDetail: true,
    link: { href: p.href, label: storeLabel(p.href), external: true },
  };
}

const all: WorkItem[] = [
  ...ventures.filter(v => !v.hidden).map(fromVenture),
  ...projects.map(fromProject),
];

const placed = LAYOUT
  .map(([id, size]) => {
    const item = all.find(w => w.id === id);
    return item ? { ...item, size } : undefined;
  })
  .filter((w): w is WorkItem => !!w);

/** Everything, in grid order. */
export const work: WorkItem[] = [
  ...placed,
  ...all.filter(w => !placed.some(p => p.id === w.id)),
];

/** The items that get a /work/<id>/ page. */
export const workWithDetail = work.filter(w => w.hasDetail);

/** How many items sit on each shelf, for the filter counts. */
export const shelfCount = (shelf: WorkShelf) => work.filter(w => w.shelf === shelf).length;
