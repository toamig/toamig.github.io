import projects from './projects.json';
import plugins from './plugins.json';
import ventures from './ventures.json';
import profile from './profile.json';
import experience from './experience.json';
import events from './events.json';
import timelineTags from './timelineTags.json';

// Profile leads: the person comes before the work.
export const categories = [
  { id: 'profile', name: 'Profile', icon: 'user', description: 'The developer behind the worlds' },
  { id: 'games', name: 'Games', icon: 'controller', description: 'Worlds I’ve helped bring to life' },
  { id: 'plugins', name: 'Plugins', icon: 'tools', description: 'Built for the people who build games' },
  { id: 'creations', name: 'Creations', icon: 'spark', description: 'Ideas that became something real' },
  { id: 'journal', name: 'Journal', icon: 'camera', description: 'A life beyond the screen' },
];

export interface ConsoleItem {
  id: string; category: string; name: string; subtitle: string; description: string;
  image: string; thumbnail: string; icon?: string; href: string; action: string;
  meta: string[]; bullets: string[]; studio?: string; studioLogo?: string; gallery?: string[];
}

const studioForProject: Record<string, number> = { 'Dakar Desert Rally': 3, 'Timefront': 1, 'Road Kings': 3, 'AutoRocket': 5 };
const contributionForProject: Record<string, number[]> = { 'Dakar Desert Rally': [0], 'Timefront': [0, 1, 2, 3, 4], 'Road Kings': [1, 2], 'AutoRocket': [0, 1, 2] };

/** Real artwork for the ventures, so none of them falls back to a generic symbol. */
const ventureArt: Record<string, { image: string; thumbnail: string }> = {
  polyglyph: { image: '/console/ventures/polyglyph.webp', thumbnail: '/console/ventures/polyglyph-mark.webp' },
  consulting: { image: '/og/ai-setup-consulting.png', thumbnail: '/og/ai-setup-consulting.png' },
  plugins: { image: '/console/art/plugin-1.webp', thumbnail: '/console/covers/plugin-1.webp' },
};

const tagName = Object.fromEntries(timelineTags.map(t => [t.id, t.name]));
const iconForTag: Record<string, string> = { studies: 'book', professional: 'briefcase', travels: 'location', personal: 'spark', hobbies: 'spark', work: 'briefcase' };

interface TimelineEvent { id: string; date: string; title: string; description?: string; category?: string; tags?: string[]; images?: string[]; }

/** A readable month and year, so an entry reads as a moment rather than a row in a table. */
function whenOf(date: string) {
  const [year, month] = date.split('-');
  if (!month) return year;
  const name = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][Number(month) - 1];
  return name ? `${name} ${year}` : year;
}

/** The whole timeline, newest first, rather than a hand-picked handful. */
export const journalEntries = (events as TimelineEvent[])
  .slice()
  .sort((a, b) => b.date.localeCompare(a.date))
  .map((event, index) => {
    const photos = (event.images || []).slice(0, 4);
    const tag = event.category || event.tags?.[0] || '';
    return {
      event, index, photos, tag,
      // Entries the timeline has no photograph for keep the ambient scene and a category mark,
      // rather than borrowing an unrelated picture.
      image: photos.length ? `/console/art/journal-${index}.webp` : '',
      thumbnail: photos.length ? `/console/covers/journal-${index}.webp` : '',
      icon: iconForTag[tag] || 'camera',
    };
  });

export const consoleItems: ConsoleItem[] = [
  ...projects.map((p, i) => {
    const studio = experience[studioForProject[p.name]];
    return {
      id: `game-${i}`, category: 'games', name: p.name, subtitle: p.role || 'Game development', description: p.desc,
      image: `/console/art/game-${i}.webp`, thumbnail: `/console/covers/game-${i}.webp`, href: p.href, action: 'Visit game',
      meta: [p.role || 'Game development', studio?.name || 'Game project'],
      bullets: (contributionForProject[p.name] || []).map(index => studio.bullets[index]),
      studio: studio?.name, studioLogo: studio?.logo,
    };
  }),
  ...plugins.filter(p => !p.hidden).map((p, i) => ({
    id: `plugin-${i}`, category: 'plugins', name: p.name, subtitle: `${p.domain} / Unreal Engine`, description: p.tagline,
    image: `/console/art/plugin-${i}.webp`, thumbnail: `/console/covers/plugin-${i}.webp`, href: p.docsUrl, action: 'Open documentation',
    meta: ['Unreal Engine', p.domain, p.status === 'live' ? 'Available on Fab' : 'In development'], bullets: p.tags,
  })),
  ...ventures.filter(v => !v.hidden).map(v => ({
    id: v.id, category: 'creations', name: v.name, subtitle: v.role, description: v.desc,
    image: ventureArt[v.id]?.image || '', thumbnail: ventureArt[v.id]?.thumbnail || '',
    href: v.href, action: v.cta, meta: [v.kicker, v.state].filter(Boolean), bullets: v.tags,
  })),
  ...[
    { id: 'overview', name: 'Meet the developer', subtitle: 'Miguel Vieira', description: profile.shortVersion.lead },
    { id: 'career', name: 'Career', subtitle: 'The teams. The games. The journey.', description: 'From multiplayer programming to engineering leadership. Meet the studios and teams I’ve worked with along the way.' },
    { id: 'toolkit', name: 'Toolkit', subtitle: 'What I build with', description: 'The engines, languages, and tools behind my day-to-day work.' },
    { id: 'education', name: 'Education', subtitle: 'Always a student', description: 'Software engineering at the University of Porto, and a continuing interest in learning and sharing what I know.' },
  ].map(p => ({ ...p, category: 'profile', image: '', thumbnail: p.id === 'overview' ? '/console/miguel.webp' : '', href: '/cv', action: 'View CV', meta: ['Game engineer', 'Tech lead', 'Portugal'], bullets: [] })),
  ...journalEntries.map(({ event, index, photos, tag, image, thumbnail, icon }) => ({
    id: `journal-${index}`, category: 'journal', name: event.title, subtitle: whenOf(event.date),
    description: event.description || '', image, thumbnail, icon,
    href: `/Timeline/${event.id}`, action: 'Read timeline entry',
    meta: [whenOf(event.date), tagName[tag] || 'Personal journal'], bullets: [],
    gallery: photos.map((_, j) => `/console/journal/${index}-${j}.webp`),
  })),
];
