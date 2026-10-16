// Homepage behaviour: the Work grid's filters and entrance, the live tiles
// (Polyglyph's translation, the plugin covers, today's Radar issue), the career
// rows and their rail, and the copy-email button. Motion
// answers the reader (a filter, a row opening, a scroll position); the one
// unprompted moment is the grid's entrance. Reduced motion keeps every state
// change and drops the movement.
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { applyRadarTheme, issueDate, lisbonToday, type RadarFeed } from './radar-theme';
import { afterTransition } from './after-transition';

gsap.registerPlugin(Flip, ScrollTrigger);

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE = 'power3.inOut';

// ── Work: filters and entrance ───────────────────────────────────────────────
(() => {
  const grid = document.querySelector<HTMLElement>('[data-work-grid]');
  if (!grid) return;
  const tiles = Array.from(grid.querySelectorAll<HTMLElement>('.wk-tile'));
  const chips = Array.from(document.querySelectorAll<HTMLButtonElement>('.wk-chip'));
  let flip: gsap.core.Timeline | null = null;
  let resize: gsap.core.Tween | null = null;

  const apply = (filter: string) => {
    if (grid.dataset.filter === filter) return;
    chips.forEach(c => c.setAttribute('aria-pressed', String(c.dataset.filter === filter)));

    // Read the height first: if a flip is still running, getState() records
    // where every tile is mid-flight and then finishes that flip (which lets go
    // of the held height), so the new flip starts from what's on screen.
    const before = grid.offsetHeight;
    const state = reduced ? null : Flip.getState(tiles);

    grid.dataset.filter = filter;
    tiles.forEach(t => {
      t.style.display = filter === 'all' || t.dataset.shelf === filter ? '' : 'none';
    });
    if (!state) return;

    // Every tile is absolutely positioned until the last one lands, which
    // leaves the grid with no height of its own. Hold it, ease it to the new
    // height over the whole flip, and let go only when the flip is done;
    // letting go any earlier collapses the grid and the section below jumps up.
    const after = grid.offsetHeight;
    grid.style.height = `${before}px`;
    const release = () => {
      resize?.kill();
      resize = null;
      grid.style.height = '';
    };

    flip = Flip.from(state, {
      duration: .7,
      ease: EASE,
      absolute: true,
      stagger: .015,
      onComplete: release,
      onEnter: els => gsap.fromTo(els,
        { opacity: 0, scale: .9 },
        { opacity: 1, scale: 1, duration: .5, delay: .18, ease: 'power2.out' }),
      onLeave: els => gsap.to(els, { opacity: 0, scale: .9, duration: .28, ease: 'power2.in' }),
    });
    resize = gsap.to(grid, { height: after, duration: flip.duration(), ease: EASE });
  };

  chips.forEach(c => c.addEventListener('click', () => apply(c.dataset.filter ?? 'all')));

  // The header's Work menu links straight to a shelf: in place on this page
  // (an event from site-header.ts), or as /?shelf=<id>#work from another page.
  const known = new Set(['all', ...chips.map(c => c.dataset.filter ?? '')]);
  document.addEventListener('work:shelf', e => {
    const shelf = (e as CustomEvent<string>).detail;
    if (known.has(shelf)) apply(shelf);
  });
  const arriving = new URLSearchParams(location.search).get('shelf');
  if (arriving && known.has(arriving)) {
    // Arriving on a shelf: show it as it is, without a flight.
    chips.forEach(c => c.setAttribute('aria-pressed', String(c.dataset.filter === arriving)));
    grid.dataset.filter = arriving;
    tiles.forEach(t => {
      t.style.display = arriving === 'all' || t.dataset.shelf === arriving ? '' : 'none';
    });
  }

  // The entrance is for a first look. Coming back from a project, or landing
  // on the grid through a link, the tiles are already the destination of a
  // page transition, and fading them in again on top of it reads as a flicker.
  const from = (window as any).navigation?.activation?.from?.url as string | undefined;
  const returning = !!from && new URL(from).pathname.startsWith('/work/');
  const landedOnGrid = !!location.hash || grid.getBoundingClientRect().top < innerHeight;
  if (!reduced && !returning && !landedOnGrid) {
    gsap.from(tiles, {
      y: 36,
      opacity: 0,
      duration: .8,
      ease: 'power3.out',
      stagger: { each: .05, grid: 'auto', from: 'start' },
      clearProps: 'transform,opacity',
      scrollTrigger: { trigger: grid, start: 'top 85%', once: true },
    });
  }
})();

// ── Polyglyph: cycle the target locale ───────────────────────────────────────
// Each translation resolves into place word by word, the way the product hero
// does. Characters rather than words for scripts that do not space them, so ja
// and ko settle at a sensible rhythm instead of arriving as one block.
(() => {
  const data = document.getElementById('pg-targets');
  const line = document.querySelector<HTMLElement>('[data-pg-line]');
  const code = document.querySelector<HTMLElement>('[data-pg-code]');
  const status = document.querySelector<HTMLElement>('[data-pg-status]');
  if (!data?.textContent || !line || !code || !status) return;

  const targets = JSON.parse(data.textContent) as { code: string; text: string; status: string }[];
  if (!targets.length) return;

  const paint = (i: number) => {
    const t = targets[i];
    code.textContent = t.code;
    status.textContent = t.status === 'approved' ? 'approved' : 'in review';
    status.className = 'pg-status ' + (t.status === 'approved' ? 'is-approved' : 'is-review');

    line.lang = t.code;
    line.textContent = '';
    const spaced = t.text.includes(' ');
    const parts = spaced ? t.text.split(' ') : [...t.text];
    parts.forEach((part, n) => {
      const span = document.createElement('span');
      span.className = 'pg-word';
      span.textContent = part;
      span.style.animationDelay = (n * (spaced ? 78 : 40)) + 'ms';
      line.appendChild(span);
      if (spaced && n < parts.length - 1) line.appendChild(document.createTextNode(' '));
    });
  };

  paint(0);
  // The cycle is decoration, not information, so it stays put when the
  // visitor has asked for less motion.
  if (reduced) return;
  let i = 0;
  afterTransition().then(() => {
    setInterval(() => { i = (i + 1) % targets.length; paint(i); }, 2600);
  });
})();

// ── Plugins: take turns showing each cover, only while the tile is on screen ─
// Only the first cover ships with a src. The rest are large images, so they
// load once the page has settled rather than decode during a transition.
(async () => {
  const cycle = document.querySelector<HTMLElement>('[data-cycle]');
  if (!cycle || reduced) return;
  const imgs = Array.from(cycle.querySelectorAll('img'));
  if (imgs.length < 2) return;
  await afterTransition();
  imgs.forEach(img => { if (img.dataset.src) img.src = img.dataset.src; });
  let i = 0;
  let timer: number | undefined;
  const step = () => {
    imgs[i].classList.remove('is-on');
    i = (i + 1) % imgs.length;
    imgs[i].classList.add('is-on');
  };
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) timer ??= window.setInterval(step, 2800);
    else { window.clearInterval(timer); timer = undefined; }
  }).observe(cycle);
})();

// ── Toa Radar: today's front page on the tile, and the issue in the now strip ─
// The tile reprints itself in the day's paper, inks and headline face, takes
// the headline, and slides the issue's lead image in once the card loads. Any
// failure leaves the server-rendered print as it is.
(() => {
  const tile = document.querySelector<HTMLAnchorElement>('[data-radar-tile]');
  const feed = tile?.dataset.radarTile;
  if (!tile || !feed) return;
  const set = (sel: string, text: string) => tile.querySelector(sel)?.replaceChildren(text);
  // Restyling the tile and loading a font and an image are all visible
  // changes; make them after an incoming transition, not during it.
  afterTransition().then(() => fetch(feed, { cache: 'no-cache' }))
    .then(r => (r.ok ? r.json() : null))
    .then((data: RadarFeed | null) => {
      const issue = data?.issue;
      if (!issue?.title) return;
      if (data?.theme) applyRadarTheme(tile, data.theme);

      const today = issue.date === lisbonToday();
      set('[data-wr-no]', `No. ${issue.number}`);
      set('[data-wr-date]', issueDate(issue.date));
      set('[data-wr-title]', issue.title);
      set('[data-wr-state]', today ? 'Out today' : 'Latest issue');
      document.querySelector('[data-radar-now]')
        ?.replaceChildren(today ? `Issue ${issue.number} out today` : `Issue ${issue.number}`);
      if (/^https?:\/\//.test(issue.url) || issue.url.startsWith('/')) tile.href = issue.url;

      const img = tile.querySelector<HTMLImageElement>('[data-wr-card]');
      const page = tile.querySelector<HTMLElement>('[data-radar-page]');
      if (img && page && issue.card && /^(https:\/\/|\/)/.test(issue.card)) {
        img.addEventListener('load', () => page.classList.add('has-shot'), { once: true });
        img.src = issue.card;
      }
    })
    .catch(() => {});
})();

// ── Career: rows that open, and a rail that fills as you read down ───────────
(() => {
  const track = document.querySelector<HTMLElement>('[data-career]');
  if (!track) return;
  const rows = Array.from(track.querySelectorAll<HTMLElement>('.cr-row'));
  rows.forEach(row => {
    const btn = row.querySelector<HTMLButtonElement>('.cr-head');
    const more = row.querySelector<HTMLElement>('.cr-more');
    if (!btn || !more) return;
    more.inert = true;
    btn.addEventListener('click', () => {
      const open = !row.classList.contains('is-open');
      row.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      more.inert = !open;
      // The rail's scroll range depends on the list's height.
      window.setTimeout(() => ScrollTrigger.refresh(), 480);
    });
  });

  const fill = track.querySelector<HTMLElement>('[data-career-rail]');
  if (!fill) return;
  if (reduced) { gsap.set(fill, { scaleY: 1 }); return; }
  afterTransition().then(() => gsap.to(fill, {
    scaleY: 1,
    ease: 'none',
    scrollTrigger: { trigger: track, start: 'top 75%', end: 'bottom 60%', scrub: .5 },
  }));
})();

// ── Smooth in-page scrolling, once the page has landed ───────────────────────
// Not before: arriving on /#w-<id> must jump straight to the tile so the page
// transition from a project lands on it, rather than glide there afterwards.
{
  const smooth = () => window.setTimeout(() => document.documentElement.classList.add('is-smooth'), 300);
  if (document.readyState === 'complete') smooth();
  else addEventListener('load', smooth, { once: true });
}

// ── Contact: copy the address, and say so ────────────────────────────────────
document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach(btn => {
  const label = btn.querySelector<HTMLElement>('[data-copy-label]');
  let reset: number | undefined;
  btn.addEventListener('click', async () => {
    const text = btn.dataset.copy ?? '';
    window.clearTimeout(reset);
    try {
      await navigator.clipboard.writeText(text);
      btn.classList.add('is-done');
      if (label) label.textContent = 'Copied';
    } catch {
      if (label) label.textContent = 'Select the address to copy';
    }
    reset = window.setTimeout(() => {
      btn.classList.remove('is-done');
      if (label) label.textContent = 'Copy address';
    }, 2200);
  });
});
