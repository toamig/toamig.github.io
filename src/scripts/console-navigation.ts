export type Direction = 'left' | 'right' | 'up' | 'down';
const selector = 'a[href], button:not(:disabled), input:not(:disabled)';
const visible = (el: HTMLElement) => el.getClientRects().length > 0 && !el.closest('[hidden], [inert]');
const smoothness = (): ScrollBehavior => document.body.classList.contains('motion-off') ? 'instant' : 'smooth';

export function installNavigation(actions: {
  direction: (direction: Direction) => boolean; confirm: () => void; back: () => void; moved: () => void; options: () => void;
  shoulder: (step: number) => void; unlock: () => void; boot: () => boolean;
  suspended?: () => boolean;
}) {
  /** The screen reads top to bottom as a stack of bands. Moving past the edge of one band
   *  steps into the next, so the header, the breadcrumb, the content and the control bar are
   *  always connected rather than islands the pad cannot cross. */
  const bands = () => Array.from(document.querySelectorAll<HTMLElement>('.system-header, .screen-topbar, #library-screen, .app-screen, .control-bar')).filter(visible);
  const controlsIn = (band: HTMLElement) => Array.from(band.querySelectorAll<HTMLElement>(selector)).filter(visible);

  function spatial(direction: Direction) {
    const active = document.activeElement as HTMLElement;
    const horizontal = direction === 'left' || direction === 'right';
    const sign = direction === 'left' || direction === 'up' ? -1 : 1;
    const scope = document.querySelector<HTMLElement>('#os-shell')!;
    if (!scope.contains(active)) {
      const first = Array.from(scope.querySelectorAll<HTMLElement>(selector)).filter(visible)[0];
      if (first) { first.focus(); actions.moved(); }
      return;
    }
    const reach = (el: HTMLElement) => { el.focus({preventScroll:true}); el.scrollIntoView({block:'nearest', inline:'nearest', behavior:smoothness()}); actions.moved(); };

    // A row is a single line of controls: left and right walk it and stop at its ends.
    const row = active.closest<HTMLElement>('[data-nav-row]');
    if (horizontal && row) {
      const options = controlsIn(row);
      const next = options[options.indexOf(active) + sign];
      if (next) reach(next);
      return;
    }

    const list = bands();
    const index = list.findIndex(band => band.contains(active));
    const band = list[index];
    if (!band) return;
    const origin = active.getBoundingClientRect();
    const centreX = origin.left + origin.width / 2;
    const centreY = origin.top + origin.height / 2;

    // Within the band, the nearest control in the direction travelled, penalising sideways drift.
    const scored = controlsIn(band)
      .filter(el => el !== active && (horizontal || !row || el.closest('[data-nav-row]') !== row))
      .map(el => {
        const rect = el.getBoundingClientRect();
        const along = ((horizontal ? rect.left + rect.width / 2 - centreX : rect.top + rect.height / 2 - centreY)) * sign;
        const drift = Math.abs(horizontal ? rect.top + rect.height / 2 - centreY : rect.left + rect.width / 2 - centreX);
        return { el, score: along > 8 && (!horizontal || drift < 80) ? along + drift * 1.4 : Infinity };
      })
      .sort((a, b) => a.score - b.score);
    if (scored[0] && scored[0].score < Infinity) {
      let winner = scored[0].el;
      // Dropping into a grid lands on the start of the row, not on whichever cell happens to
      // sit under the middle of a full-width control above it.
      const grid = winner.closest<HTMLElement>('[data-nav-grid]');
      if (grid && !horizontal && !active.closest('[data-nav-grid]')) {
        const edge = winner.getBoundingClientRect().top;
        const first = controlsIn(grid)
          .filter(el => Math.abs(el.getBoundingClientRect().top - edge) < 20)
          .sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left)[0];
        if (first) winner = first;
      }
      reach(winner);
      return;
    }

    // Nothing left in this band. Read on if it still scrolls, otherwise cross into the next one.
    if (!horizontal) {
      const room = sign > 0 ? band.scrollHeight - band.clientHeight - band.scrollTop : band.scrollTop;
      if (band.scrollHeight > band.clientHeight + 2 && room > 1) {
        band.scrollBy({ top: sign * Math.min(200, room), behavior: smoothness() });
        actions.moved();
        return;
      }
      for (let next = index + sign; next >= 0 && next < list.length; next += sign) {
        const pool = controlsIn(list[next]);
        if (!pool.length) continue;
        // Enter on the edge nearest the one just left, at the closest column.
        const edge = pool.reduce((best, el) => {
          const rect = el.getBoundingClientRect();
          const value = sign > 0 ? rect.top : -rect.bottom;
          return value < best ? value : best;
        }, Infinity);
        const entry = pool
          .filter(el => { const rect = el.getBoundingClientRect(); return Math.abs((sign > 0 ? rect.top : -rect.bottom) - edge) < 40; })
          .sort((a, b) => Math.abs(a.getBoundingClientRect().left + a.getBoundingClientRect().width / 2 - centreX) - Math.abs(b.getBoundingClientRect().left + b.getBoundingClientRect().width / 2 - centreX))[0];
        if (entry) { reach(entry); return; }
      }
    }
  }
  const move = (direction: Direction) => { if (!actions.direction(direction)) spatial(direction); };
  let keyRepeatAt = 0;
  document.addEventListener('keydown', event => {
    if(actions.suspended?.())return;
    if (event.altKey || event.metaKey || event.ctrlKey) return;
    document.body.dataset.inputMode = 'keyboard';
    actions.unlock();
    // Match a held key to the controller cadence without slowing discrete presses.
    if (event.repeat && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter','Escape'].includes(event.key)) {
      if (['Enter','Escape'].includes(event.key) || performance.now() < keyRepeatAt) { event.preventDefault(); return; }
    }
    const active = document.activeElement as HTMLElement;
    if (event.key === 'Escape') { event.preventDefault(); actions.back(); return; }
    if (actions.boot()) {
      if (event.key === 'Enter') { event.preventDefault(); if (active.id === 'boot-sound') active.click(); else actions.confirm(); }
      return;
    }
    if (active instanceof HTMLInputElement && !['checkbox', 'range'].includes(active.type) && !['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    if (active instanceof HTMLInputElement && active.type === 'range' && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const directions: Record<string, Direction> = { ArrowLeft:'left', ArrowRight:'right', ArrowUp:'up', ArrowDown:'down' };
    if (directions[event.key]) { event.preventDefault(); move(directions[event.key]); keyRepeatAt=performance.now()+(event.repeat ? 110 : 280); }
    if (event.key === 'Enter' && active.matches('[data-item], [data-category], input[type="checkbox"]')) { event.preventDefault(); actions.confirm(); }
    if ((event.key === 'Home' || event.key === 'End') && active.matches('[data-item]')) {
      event.preventDefault();
      const entries = Array.from(document.querySelectorAll<HTMLElement>('[data-item]')).filter(visible);
      (event.key === 'Home' ? entries[0] : entries.at(-1))?.focus({preventScroll:true});
    }
  });
  document.addEventListener('pointerdown', () => { document.body.dataset.inputMode = 'pointer'; actions.unlock(); }, {capture:true});
  const sidebar=document.querySelector<HTMLElement>('.library-sidebar')!;
  let wheelDelta=0,wheelAt=0,wheelMoveAt=0;
  sidebar.addEventListener('wheel',event=>{
    if (event.ctrlKey || actions.boot()) return;
    event.preventDefault();
    const now=performance.now();
    if (now-wheelAt>160 || Math.sign(wheelDelta)!==Math.sign(event.deltaY)) wheelDelta=0;
    wheelAt=now;wheelDelta+=event.deltaY*(event.deltaMode===1?18:event.deltaMode===2?innerHeight:1);
    if (Math.abs(wheelDelta)<35 || now-wheelMoveAt<150) return;
    document.body.dataset.inputMode='pointer';
    if (!sidebar.contains(document.activeElement)) sidebar.querySelector<HTMLElement>('[data-item][aria-selected="true"]')?.focus({preventScroll:true});
    actions.direction(wheelDelta>0?'down':'up');wheelDelta=0;wheelMoveAt=now;
  },{passive:false});

  const rail=document.getElementById('item-rail')!;
  let touch: {id:number;y:number}|null=null,swipedUntil=0;
  rail.addEventListener('pointerdown',event=>{
    if (event.pointerType==='touch') touch={id:event.pointerId,y:event.clientY};
  });
  rail.addEventListener('pointermove',event=>{
    if (!touch || touch.id!==event.pointerId) return;
    const distance=event.clientY-touch.y;
    if (Math.abs(distance)<38) return;
    if (!rail.hasPointerCapture(event.pointerId)) rail.setPointerCapture(event.pointerId);
    if (!rail.contains(document.activeElement)) rail.querySelector<HTMLElement>('[aria-selected="true"]')?.focus({preventScroll:true});
    actions.direction(distance<0?'down':'up');touch.y=event.clientY;swipedUntil=performance.now()+350;
  });
  const endTouch=()=>{touch=null;};
  rail.addEventListener('pointerup',endTouch);rail.addEventListener('pointercancel',endTouch);
  rail.addEventListener('click',event=>{if(performance.now()<swipedUntil){event.preventDefault();event.stopPropagation();}},{capture:true});
  let frame = 0, held = '', repeatAt = 0, connected = false, pollTimer = 0;
  let previousButtons: boolean[] = [];
  function poll(now: number) {
    if(actions.suspended?.()) {previousButtons=[];held='';pollTimer=window.setTimeout(()=>{frame=requestAnimationFrame(poll);},300);return;}
    const pad = Array.from(navigator.getGamepads?.() || []).find(p => p?.connected && p.mapping === 'standard');
    const status = document.querySelector<HTMLElement>('#controller-status span')!;
    if (!!pad !== connected) { connected = !!pad; status.textContent = connected ? 'Controller connected' : 'Keyboard ready'; }
    if (pad) {
      const pressed = (i: number) => !!pad.buttons[i]?.pressed;
      const fresh = (i: number) => pressed(i) && !previousButtons[i];
      const dx = pad.axes[0] || 0, dy = pad.axes[1] || 0;
      const direction = pressed(14) || dx < -.55 ? 'left' : pressed(15) || dx > .55 ? 'right' : pressed(12) || dy < -.55 ? 'up' : pressed(13) || dy > .55 ? 'down' : '';
      if (direction || pad.buttons.some(b => b.pressed)) { document.body.dataset.inputMode = 'controller'; actions.unlock(); }
      if (direction && (held !== direction || now >= repeatAt)) { move(direction); repeatAt = now + (held === direction ? 130 : 300); }
      if (fresh(0)) actions.confirm();
      if (fresh(1)) actions.back();
      if (fresh(4)) actions.shoulder(-1);
      if (fresh(5)) actions.shoulder(1);
      if (fresh(9)) actions.options();
      previousButtons = pad.buttons.map(b => b.pressed);
      held = direction;
    } else { previousButtons = []; held = ''; }
    frame = requestAnimationFrame(poll);
  }
  document.addEventListener('visibilitychange', () => { cancelAnimationFrame(frame);clearTimeout(pollTimer); if (!document.hidden) frame = requestAnimationFrame(poll); });
  frame = requestAnimationFrame(poll);
}
