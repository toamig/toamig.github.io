import projects from './projects.json';
import plugins from './plugins.json';
import ventures from './ventures.json';
import profile from './profile.json';
import experience from './experience.json';
import events from './events.json';

export const categories = [
  { id: 'games', name: 'Games', icon: 'controller', description: 'Worlds I’ve helped bring to life' },
  { id: 'plugins', name: 'Plugins', icon: 'tools', description: 'Built for the people who build games' },
  { id: 'creations', name: 'Creations', icon: 'spark', description: 'Ideas that became something real' },
  { id: 'profile', name: 'Profile', icon: 'user', description: 'The developer behind the worlds' },
  { id: 'journal', name: 'Journal', icon: 'camera', description: 'A life beyond the screen' },
];

export interface ConsoleItem {
  id: string; category: string; name: string; subtitle: string; description: string;
  image: string; thumbnail: string; href: string; action: string;
  meta: string[]; bullets: string[]; studio?: string; studioLogo?: string; gallery?: string[];
}

const studioForProject: Record<string, number> = { 'Dakar Desert Rally': 3, 'Timefront': 1, 'Road Kings': 3, 'AutoRocket': 5 };
const contributionForProject: Record<string, number[]> = { 'Dakar Desert Rally': [0], 'Timefront': [0, 1, 2, 3, 4], 'Road Kings': [1, 2], 'AutoRocket': [0, 1, 2] };
export const journalEntries = ['evt-2025-Greece', 'evt-2025-Drone', 'evt-2025-Paris', 'evt-2024-Asturias', 'evt-2023-netherlands'].map(id => events.find(e => e.id === id)!);

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
  ...ventures.filter(v => !v.hidden && v.id !== 'plugins').map(v => ({
    id: v.id, category: 'creations', name: v.name, subtitle: v.role, description: v.desc,
    image: '', thumbnail: '', href: v.href, action: v.cta, meta: [v.kicker, v.state].filter(Boolean), bullets: v.tags,
  })),
  ...[
    { id: 'overview', name: 'Meet the developer', subtitle: 'Miguel Vieira', description: profile.shortVersion.lead },
    { id: 'career', name: 'Career', subtitle: 'The teams. The games. The journey.', description: 'From multiplayer programming to engineering leadership. Meet the studios and teams I’ve worked with along the way.' },
    { id: 'toolkit', name: 'Toolkit', subtitle: 'What I build with', description: 'The engines, languages, and tools behind my day-to-day work.' },
    { id: 'education', name: 'Education', subtitle: 'Always a student', description: 'Software engineering at the University of Porto, and a continuing interest in learning and sharing what I know.' },
  ].map(p => ({ ...p, category: 'profile', image: '', thumbnail: p.id === 'overview' ? '/console/miguel.webp' : '', href: '/cv', action: 'View CV', meta: ['Game engineer', 'Tech lead', 'Portugal'], bullets: [] })),
  ...journalEntries.map((e, i) => ({
    id: `journal-${i}`, category: 'journal', name: e.title, subtitle: e.date.slice(0, 4), description: e.description,
    image: `/console/art/journal-${i}.webp`, thumbnail: `/console/covers/journal-${i}.webp`, href: `/Timeline/${e.id}`, action: 'Read timeline entry',
    meta: [e.date.slice(0, 4), 'Personal journal'], bullets: [], gallery: e.images.slice(0, 4).map((_, j) => `/console/journal/${i}-${j}.webp`),
  })),
];
