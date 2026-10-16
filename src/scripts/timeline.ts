// Timeline behaviour: filter by tag, flip between newest and oldest first, a
// rail that fills as you read down, and the year shortcuts marking the year in
// view. The moments themselves are server-rendered (src/pages/Timeline.astro);
// this only shows, hides and reorders them. Reduced motion keeps every change
// and drops the movement.
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { afterTransition } from './after-transition';

gsap.registerPlugin(Flip, ScrollTrigger);

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const list = document.querySelector<HTMLElement>('[data-tl-list]');
const track = document.querySelector<HTMLElement>('[data-tl-track]');
const chips = Array.from(document.querySelectorAll<HTMLButtonElement>('.tl-chip'));
const sortBtn = document.querySelector<HTMLButtonElement>('[data-sort]');
const sortLabel = document.querySelector<HTMLElement>('[data-sort-label]');
const empty = document.querySelector<HTMLElement>('[data-tl-empty]');
const yearLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-year-link]'));

if (list && track) {
  const years = () => Array.from(list.querySelectorAll<HTMLElement>('.tl-year'));
  const items = Array.from(list.querySelectorAll<HTMLElement>('.tl-item'));
  let tag = 'all';
  let newestFirst = true;

  // Every change is the same move: record where things are, change the DOM,
  // and let Flip carry them to their new places.
  const change = (mutate: () => void) => {
    const state = reduced ? null : Flip.getState([...items, ...years()]);
    mutate();
    if (state) {
      Flip.from(state, {
        duration: .6,
        ease: 'power3.inOut',
        nested: true,
        onEnter: els => gsap.fromTo(els, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .45, delay: .15, ease: 'power2.out' }),
      });
    }
    ScrollTrigger.refresh();
  };

  const applyFilter = () => {
    items.forEach(it => {
      const show = tag === 'all' || (it.dataset.tags ?? '').split(' ').includes(tag);
      it.style.display = show ? '' : 'none';
    });
    let visibleYears = 0;
    years().forEach(y => {
      const any = Array.from(y.querySelectorAll<HTMLElement>('.tl-item')).some(it => it.style.display !== 'none');
      y.style.display = any ? '' : 'none';
      yearLinks.find(a => a.dataset.yearLink === y.dataset.year)?.toggleAttribute('hidden', !any);
      if (any) visibleYears++;
    });
    if (empty) empty.hidden = visibleYears > 0;
  };

  chips.forEach(c => c.addEventListener('click', () => {
    const next = c.dataset.tag ?? 'all';
    if (next === tag) return;
    tag = next;
    chips.forEach(x => x.setAttribute('aria-pressed', String(x === c)));
    change(applyFilter);
  }));

  sortBtn?.addEventListener('click', () => {
    newestFirst = !newestFirst;
    if (sortLabel) sortLabel.textContent = newestFirst ? 'Newest first' : 'Oldest first';
    change(() => {
      years().reverse().forEach(y => {
        list.appendChild(y);
        const ol = y.querySelector('.tl-list');
        if (ol) Array.from(ol.children).reverse().forEach(li => ol.appendChild(li));
      });
      const nav = yearLinks[0]?.parentElement;
      if (nav) yearLinks.slice().reverse().forEach(a => nav.appendChild(a));
      yearLinks.reverse();
    });
  });

  // The rail fills as you read down; its range depends on the list's height,
  // which the filters change, so change() refreshes it.
  const fill = track.querySelector<HTMLElement>('[data-tl-rail]');
  if (fill) {
    if (reduced) gsap.set(fill, { scaleY: 1 });
    else afterTransition().then(() => gsap.to(fill, {
      scaleY: 1,
      ease: 'none',
      scrollTrigger: { trigger: track, start: 'top 70%', end: 'bottom 60%', scrub: .5 },
    }));
  }

  // The year shortcuts mark the year whose moments cross the middle of the view.
  const visible = new Set<Element>();
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
    const here = years().find(y => visible.has(y))?.dataset.year;
    yearLinks.forEach(a => a.classList.toggle('is-here', a.dataset.yearLink === here));
  }, { rootMargin: '-45% 0px -54% 0px' });
  years().forEach(y => spy.observe(y));
}

// Smooth scrolling for the year shortcuts, switched on once the page has
// landed so arriving on /Timeline/#t-<id> jumps straight to the card.
{
  const smooth = () => window.setTimeout(() => document.documentElement.classList.add('is-smooth'), 300);
  if (document.readyState === 'complete') smooth();
  else addEventListener('load', smooth, { once: true });
}
