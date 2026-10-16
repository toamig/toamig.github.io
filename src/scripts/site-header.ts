// Site header behaviour: the solid bar once you scroll, the gliding hover pill,
// the Work menu, the phone sheet, and (on the homepage) marking the section
// you're reading. Shelf links on the homepage filter the grid in place instead
// of reloading; elsewhere they navigate to /?shelf=<id>#work.

const header = document.querySelector<HTMLElement>('[data-site-header]');

if (header) {
  const isHome = header.hasAttribute('data-home');
  const nav = header.querySelector<HTMLElement>('.sh-nav');
  const hover = header.querySelector<HTMLElement>('[data-hover]');
  const toggle = header.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const menu = header.querySelector<HTMLElement>('[data-menu]');
  const sheetToggle = header.querySelector<HTMLButtonElement>('[data-sheet-toggle]');
  const sheet = header.querySelector<HTMLElement>('[data-sheet]');

  // ── Scroll state ───────────────────────────────────────────────────────────
  const hero = isHome ? document.querySelector<HTMLElement>('.front-page') : null;
  const onScroll = () => {
    header.classList.toggle('is-scrolled', scrollY > 24);
    const pastHero = hero ? scrollY > hero.offsetHeight * .55 : true;
    header.classList.toggle('is-past-hero', pastHero);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ── Hover pill ─────────────────────────────────────────────────────────────
  if (nav && hover) {
    const links = Array.from(nav.querySelectorAll<HTMLElement>('.sh-link'));
    const moveTo = (el: HTMLElement) => {
      hover.style.width = `${el.offsetWidth}px`;
      hover.style.transform = `translateX(${el.offsetLeft}px)`;
      hover.style.opacity = '1';
    };
    links.forEach(l => {
      l.addEventListener('pointerenter', () => moveTo(l));
      l.addEventListener('focus', () => moveTo(l));
    });
    nav.addEventListener('pointerleave', () => { hover.style.opacity = '0'; });
    nav.addEventListener('focusout', e => {
      if (!nav.contains(e.relatedTarget as Node)) hover.style.opacity = '0';
    });
  }

  // ── Work menu ──────────────────────────────────────────────────────────────
  let closeTimer: number | undefined;
  const setMenu = (open: boolean) => {
    window.clearTimeout(closeTimer);
    header.classList.toggle('menu-open', open);
    toggle?.setAttribute('aria-expanded', String(open));
    if (menu) menu.inert = !open;
  };
  if (toggle && menu) {
    menu.inert = true;
    const canHover = matchMedia('(hover: hover)').matches;
    // Hover opens it for a mouse; a short grace period lets the pointer travel
    // from the button down into the panel without it snapping shut.
    if (canHover) {
      let openTimer: number | undefined;
      const enter = () => { window.clearTimeout(closeTimer); openTimer = window.setTimeout(() => setMenu(true), 70); };
      const leave = () => { window.clearTimeout(openTimer); closeTimer = window.setTimeout(() => setMenu(false), 180); };
      [toggle, menu].forEach(el => {
        el.addEventListener('pointerenter', enter);
        el.addEventListener('pointerleave', leave);
      });
    }
    // With a mouse the menu is already open from hovering, so a click means
    // "take me to the work". Keyboard and touch toggle the menu instead.
    toggle.addEventListener('click', e => {
      if (canHover && e.detail > 0) {
        setMenu(false);
        if (isHome) document.getElementById('work')?.scrollIntoView();
        else location.href = '/#work';
        return;
      }
      setMenu(!header.classList.contains('menu-open'));
    });
    menu.addEventListener('focusout', e => {
      const to = e.relatedTarget as Node | null;
      if (to && !menu.contains(to) && to !== toggle) setMenu(false);
    });
    document.addEventListener('click', e => {
      const t = e.target as Node;
      if (!menu.contains(t) && !toggle.contains(t)) setMenu(false);
    });
  }

  // ── Phone sheet ────────────────────────────────────────────────────────────
  const setSheet = (open: boolean) => {
    header.classList.toggle('sheet-open', open);
    sheetToggle?.setAttribute('aria-expanded', String(open));
    sheetToggle?.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (sheet) sheet.inert = !open;
    document.documentElement.style.overflow = open ? 'hidden' : '';
  };
  if (sheetToggle && sheet) {
    sheet.inert = true;
    sheetToggle.addEventListener('click', () => setSheet(!header.classList.contains('sheet-open')));
    sheet.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setSheet(false)));
    const workBtn = sheet.querySelector<HTMLButtonElement>('[data-sheet-work]');
    const workSub = sheet.querySelector<HTMLElement>('#sh-sheet-work');
    if (workBtn && workSub) {
      workSub.inert = true;
      workBtn.addEventListener('click', () => {
        const open = !workSub.classList.contains('is-open');
        workSub.classList.toggle('is-open', open);
        workBtn.setAttribute('aria-expanded', String(open));
        workSub.inert = !open;
      });
    }
    // Leaving phone width with the sheet open would strand the scroll lock.
    matchMedia('(min-width: 861px)').addEventListener('change', e => { if (e.matches) setSheet(false); });
  }

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (header.classList.contains('menu-open')) { setMenu(false); toggle?.focus(); }
    if (header.classList.contains('sheet-open')) { setSheet(false); sheetToggle?.focus(); }
  });

  // ── Shelf links filter the grid in place on the homepage ───────────────────
  if (isHome) {
    header.querySelectorAll<HTMLAnchorElement>('a[data-shelf]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        setMenu(false);
        setSheet(false);
        document.dispatchEvent(new CustomEvent('work:shelf', { detail: a.dataset.shelf }));
        document.getElementById('work')?.scrollIntoView();
      });
    });
  }

  // ── Homepage: mark the section being read ──────────────────────────────────
  if (isHome && nav) {
    const sectionLinks = Array.from(nav.querySelectorAll<HTMLElement>('[data-section]'));
    const ids: Record<string, string> = { work: 'work', career: 'career', about: 'profile', contact: 'contact' };
    const watched = sectionLinks
      .map(l => ({ link: l, section: document.getElementById(ids[l.dataset.section ?? ''] ?? '') }))
      .filter((w): w is { link: HTMLElement; section: HTMLElement } => !!w.section);
    const visible = new Set<Element>();
    const spy = new IntersectionObserver(entries => {
      entries.forEach(e => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
      const here = watched.find(w => visible.has(w.section));
      watched.forEach(w => w.link.classList.toggle('is-here', w === here));
    }, { rootMargin: '-40% 0px -59% 0px' });
    watched.forEach(w => spy.observe(w.section));
  }
}
