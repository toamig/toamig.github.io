// Photo viewer behaviour (components/PhotoViewer.astro). Opening grows the
// photo out of the picture that was clicked, and closing shrinks it back into
// the current photo's picture on the page, using a same-document view
// transition; without one, or with reduced motion, it simply appears. Photos
// show their small copy at once and the original as soon as it has decoded.

const dialog = document.querySelector<HTMLDialogElement>('[data-pv]');

if (dialog) {
  type Photo = { src: string; thumb: string; alt: string };
  const photos: Photo[] = JSON.parse(dialog.querySelector('[data-pv-data]')?.textContent || '[]');
  const img = dialog.querySelector<HTMLImageElement>('[data-pv-img]')!;
  const stage = dialog.querySelector<HTMLElement>('[data-pv-stage]');
  const indexEl = dialog.querySelector<HTMLElement>('[data-pv-index]');
  const original = dialog.querySelector<HTMLAnchorElement>('[data-pv-original]');
  const thumbs = Array.from(dialog.querySelectorAll<HTMLButtonElement>('[data-pv-go]'));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canMorph = 'startViewTransition' in document && !reduced;
  const NAME = 'pv-photo';
  let index = 0;
  let token = 0;

  const decoded = new Set<string>();
  const warm = (src: string) => {
    if (decoded.has(src)) return;
    const pre = new Image();
    pre.decoding = 'async';
    pre.src = src;
    pre.decode().then(() => decoded.add(src)).catch(() => {});
  };

  // Show photo i: the small copy straight away, the original once decoded.
  const show = async (i: number) => {
    index = (i + photos.length) % photos.length;
    const p = photos[index];
    const mine = ++token;
    img.alt = p.alt;
    img.src = decoded.has(p.src) ? p.src : p.thumb;
    await img.decode().catch(() => {});
    if (!decoded.has(p.src)) {
      const full = new Image();
      full.decoding = 'async';
      full.src = p.src;
      full.decode()
        .then(() => { decoded.add(p.src); if (mine === token) img.src = p.src; })
        .catch(() => {});
    }
    if (indexEl) indexEl.textContent = String(index + 1);
    if (original) original.href = p.src;
    thumbs.forEach((t, n) => (n === index ? t.setAttribute('aria-current', 'true') : t.removeAttribute('aria-current')));
    thumbs[index]?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduced ? 'auto' : 'smooth' });
    if (photos.length > 1) {
      warm(photos[(index + 1) % photos.length].src);
      warm(photos[(index - 1 + photos.length) % photos.length].src);
    }
  };

  // The page's own picture of photo i, if it is on screen to morph from or to.
  // A page in the background skips its transitions, so it never morphs.
  const sourceOf = (i: number) => {
    if (document.hidden) return null;
    const el = document.querySelector<HTMLElement>(`[data-pv-source="${i}"]`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < innerHeight && r.width > 0 ? el : null;
  };

  // One morph between the page and the viewer. The photo is the only named
  // layer while it runs (html.pv-morphing switches the page's others off, see
  // photo-viewer.css) and the "photo" type gives it its own timing. A
  // transition waits for a frame to capture the page; if none comes (a
  // throttled page), it is skipped, which runs the change straight away.
  const morph = (update: () => unknown) => {
    const root = document.documentElement;
    root.classList.add('pv-morphing');
    let stall = 0;
    const run = async () => { window.clearTimeout(stall); await update(); };
    let vt: any;
    try { vt = (document as any).startViewTransition({ update: run, types: ['photo'] }); }
    catch { vt = (document as any).startViewTransition(run); }
    stall = window.setTimeout(() => vt.skipTransition(), 400);
    // Skipping (above, or a hidden tab) rejects these with an AbortError; the
    // viewer has already changed state by then, so there is nothing to do.
    vt.ready.catch(() => {});
    vt.updateCallbackDone.catch(() => {});
    const done = () => root.classList.remove('pv-morphing');
    return vt.finished.then(done, done);
  };

  const open = async (i: number) => {
    if (dialog.open) return;
    const source = canMorph ? sourceOf(i) : null;
    if (!source) {
      // No picture on screen to grow from: fade the viewer in, once.
      await show(i);
      dialog.showModal();
      if (!reduced) dialog.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
      return;
    }
    source.style.viewTransitionName = NAME;
    await morph(async () => {
      source.style.viewTransitionName = '';
      dialog.showModal();
      await show(i);
      img.style.viewTransitionName = NAME;
    });
    img.style.viewTransitionName = '';
  };

  const close = async () => {
    if (!dialog.open) return;
    const source = canMorph ? sourceOf(index) : null;
    if (!source) {
      // The current photo's picture is off screen: fade out rather than morph.
      if (!reduced) {
        await dialog.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: 'ease-in', fill: 'forwards' })
          .finished.catch(() => {});
      }
      dialog.close();
      dialog.getAnimations().forEach(a => a.cancel());
      return;
    }
    img.style.viewTransitionName = NAME;
    await morph(() => {
      img.style.viewTransitionName = '';
      dialog.close();
      source.style.viewTransitionName = NAME;
    });
    source.style.viewTransitionName = '';
  };

  // Moving between photos slides the current one out and the next one in,
  // in the direction you went.
  const step = async (d: number) => {
    if (photos.length < 2) return;
    if (!reduced) {
      await img.animate(
        [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-d * 36}px)` }],
        { duration: 130, easing: 'ease-in' },
      ).finished.catch(() => {});
    }
    await show(index + d);
    if (!reduced) {
      img.animate(
        [{ opacity: 0, transform: `translateX(${d * 36}px)` }, { opacity: 1, transform: 'none' }],
        { duration: 240, easing: 'cubic-bezier(.2,.7,.2,1)' },
      );
    }
  };

  // Anything marked data-pv-open opens the viewer. A modified click keeps the
  // link's own behaviour (the original in a new tab).
  document.addEventListener('click', e => {
    const trigger = (e.target as Element | null)?.closest<HTMLElement>('[data-pv-open]');
    if (!trigger || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    void open(Number(trigger.dataset.pvOpen) || 0);
  });

  dialog.querySelector('[data-pv-close]')?.addEventListener('click', () => void close());
  dialog.querySelectorAll<HTMLButtonElement>('[data-pv-step]').forEach(b =>
    b.addEventListener('click', () => void step(Number(b.dataset.pvStep))));
  thumbs.forEach(t => t.addEventListener('click', () => {
    const n = Number(t.dataset.pvGo);
    if (n !== index) void step(n - index);
  }));

  // Escape closes with the same motion as the button, and a click on the
  // empty space around the photo closes too.
  dialog.addEventListener('cancel', e => { e.preventDefault(); void close(); });
  dialog.addEventListener('click', e => { if (e.target === dialog || e.target === stage) void close(); });
  dialog.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); void step(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); void step(-1); }
  });

  // Swipe on touch screens.
  let startX = 0;
  let startY = 0;
  stage?.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') { startX = e.clientX; startY = e.clientY; } });
  stage?.addEventListener('pointerup', e => {
    if (e.pointerType === 'mouse') return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(e.clientY - startY)) void step(dx < 0 ? 1 : -1);
  });
}
