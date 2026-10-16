// Toa Radar prints every issue on a new paper with two new inks and a headline
// face, and publishes them in /radar/latest.json. This applies that day's
// theme to an element as --rd-* custom properties, so anything on this site
// that shows a piece of Radar looks like that morning's issue.

export interface RadarTheme {
  paper: string; text: string; inkA: string; inkB: string; displayA: string;
  night: { paper: string; text: string };
  font: string;
}
export interface RadarIssue {
  number: number; date: string; title: string; dek: string;
  tldr: string[]; url: string; card?: string;
}
export interface RadarFeed { issue: RadarIssue | null; theme?: RadarTheme; }

// The headline faces Radar picks from, with the settings that make each read
// at the same optical size.
const FACES: Record<string, {
  family: string; css: string; weight: number; stretch: string;
  upper: boolean; track: string; scale: number;
}> = {
  'Big Shoulders': {
    family: "'Big Shoulders Display', 'Arial Narrow', sans-serif",
    css: 'Big+Shoulders+Display:wght@800',
    weight: 800, stretch: '100%', upper: true, track: '-.01em', scale: 1,
  },
  'Anybody Expanded': {
    family: "'Anybody', 'Arial Black', sans-serif",
    css: 'Anybody:wdth,wght@50..150,100..900',
    weight: 760, stretch: '135%', upper: false, track: '-.03em', scale: .72,
  },
  'Bricolage Grotesque': {
    family: "'Bricolage Grotesque', 'Inter', sans-serif",
    css: '',
    weight: 700, stretch: '100%', upper: false, track: '-.035em', scale: .9,
  },
  'Anybody Condensed': {
    family: "'Anybody', 'Arial Narrow', sans-serif",
    css: 'Anybody:wdth,wght@50..150,100..900',
    weight: 820, stretch: '62%', upper: true, track: '-.01em', scale: 1,
  },
};

const isHex = (s: unknown): s is string => typeof s === 'string' && /^#[0-9a-f]{6}$/i.test(s);

const loadFace = (css: string) => {
  if (!css || document.querySelector(`link[data-radar-face="${css}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${css}&display=swap`;
  link.dataset.radarFace = css;
  document.head.appendChild(link);
};

/** Sets the day's paper, inks and headline face on `el`. False if the theme is malformed. */
export function applyRadarTheme(el: HTMLElement, theme: RadarTheme): boolean {
  if (![theme.paper, theme.text, theme.inkA, theme.inkB, theme.displayA].every(isHex)) return false;
  const set = (k: string, v: string) => el.style.setProperty(k, v);
  set('--rd-paper', theme.paper);
  set('--rd-text', theme.text);
  set('--rd-a', theme.inkA);
  set('--rd-b', theme.inkB);
  set('--rd-display', theme.displayA);
  const face = FACES[theme.font];
  if (face) {
    loadFace(face.css);
    set('--rd-font', face.family);
    set('--rd-weight', String(face.weight));
    set('--rd-stretch', face.stretch);
    set('--rd-case', face.upper ? 'uppercase' : 'none');
    set('--rd-track', face.track);
    set('--rd-scale', String(face.scale));
  }
  return true;
}

/** Today in Lisbon, where the routine runs, so a late reader elsewhere still sees "today". */
export const lisbonToday = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon' }).format(new Date());

/** "Fri 16 Oct", from an ISO date. */
export function issueDate(iso: string): string {
  const when = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(when.getTime())) return iso;
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short',
  }).format(when);
}
