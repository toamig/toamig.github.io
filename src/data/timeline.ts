// The Timeline as the pages render it: events.json sorted newest first, with
// each moment's tags resolved to names and colours, a readable date, and its
// derived images (public/tiles/, see scripts/prepare-console-art.mjs). Both
// /Timeline/ and /Timeline/<id>/ read from here.
import events       from './events.json';
import timelineTags from './timelineTags.json';

export interface MomentTag { id: string; name: string; color: string; }

export interface Moment {
  id: string;
  /** ISO date as written in events.json: YYYY-MM-DD or YYYY-MM. */
  date: string;
  year: string;
  /** "16 Aug" or "Aug", for the card; the year is the group heading. */
  shortDate: string;
  /** "16 August 2026" or "August 2026", for the moment's page. */
  longDate: string;
  title: string;
  description: string;
  paragraphs: string[];
  tags: MomentTag[];
  /** Original photos, in order. */
  images: string[];
  /** Every photo with its small copy, for the gallery and the photo viewer. */
  photos: { src: string; thumb: string; alt: string }[];
  /** The first photo, cut for the card. */
  thumb?: string;
  /** The first photo at banner size, for the moment's page. */
  banner?: string;
  links: { label: string; url: string }[];
  documents: { label: string; url: string }[];
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];

const tagInfo = (id: string): MomentTag => {
  const def = timelineTags.find(t => t.id === id);
  return def ? { id, name: def.name, color: def.color } : { id, name: id || 'Other', color: '#64748b' };
};
const asset = (u: string) => (/^(https?:|data:|mailto:|\/)/i.test(u) ? u : `/${u}`);
const raster = (u?: string) => !!u && !/\.svg$/i.test(u);

function toMoment(e: (typeof events)[number]): Moment {
  const ev = e as any;
  const [y, m, d] = e.date.split('-');
  const month = MONTHS[Number(m) - 1] ?? '';
  const images: string[] = (ev.images ?? []).filter(Boolean).map(asset);
  const first = (ev.images ?? [])[0] as string | undefined;
  const ext = ev.extendedDescription;
  return {
    id: e.id,
    date: e.date,
    year: y,
    shortDate: d ? `${Number(d)} ${month.slice(0, 3)}` : month.slice(0, 3),
    longDate: [d ? Number(d) : '', month, y].filter(Boolean).join(' '),
    title: e.title,
    description: ev.description ?? '',
    paragraphs: Array.isArray(ext) ? ext.filter(Boolean) : (typeof ext === 'string' && ext.trim() ? [ext] : []),
    tags: (Array.isArray(ev.tags) ? ev.tags : ev.category ? [ev.category] : []).map(tagInfo),
    images,
    // Indexed against the raw list, as the image script names the small copies.
    photos: (ev.images ?? [])
      .map((img: string, n: number) => img && {
        src: asset(img),
        thumb: raster(img) ? `/tiles/moment-${e.id}-${n}.webp` : asset(img),
      })
      .filter(Boolean)
      .map((p: { src: string; thumb: string }, n: number) => ({ ...p, alt: `${e.title}, photo ${n + 1}` })),
    thumb: raster(first) ? `/tiles/moment-${e.id}.webp` : undefined,
    banner: raster(first) ? `/tiles/moment-${e.id}-wide.webp` : undefined,
    links: (ev.links ?? []).filter((l: any) => l?.url)
      .map((l: any) => ({ label: l.text || l.label || l.url, url: l.url })),
    documents: (ev.documents ?? []).filter((x: any) => x?.url)
      .map((x: any) => ({ label: x.text || x.label || x.name || 'View document', url: asset(x.url) })),
  };
}

/** Every moment, newest first. */
export const moments: Moment[] = events.map(toMoment).sort((a, b) => b.date.localeCompare(a.date));

/** The years that have moments, newest first, each with its moments. */
export const years = [...new Set(moments.map(m => m.year))].map(year => ({
  year,
  moments: moments.filter(m => m.year === year),
}));

/** The tags the Timeline filters by, with how many moments carry each. */
export const filterTags = timelineTags
  .filter(t => t.filter)
  .map(t => ({ ...tagInfo(t.id), count: moments.filter(m => m.tags.some(x => x.id === t.id)).length }));
