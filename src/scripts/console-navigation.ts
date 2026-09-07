export type Direction = 'left' | 'right' | 'up' | 'down';
const selector = 'a[href], button:not(:disabled), input:not(:disabled)';
const visible = (el: HTMLElement) => el.getClientRects().length > 0 && !el.closest('[hidden], [inert]');
const smoothness = (): ScrollBehavior => document.body.classList.contains('motion-off') ? 'instant' : 'smooth';

export function installNavigation(actions: {
  direction: (direction: Direction) => boolean; confirm: () => void; back: () => void; moved: () => void; options: () => void;
  shoulder: (step: number) => void; unlock: () => void; boot: () => boolean;
  suspended?: () => boolean;
}) {
  function spatial(direction: Direction) {
    const active = document.activeElement as HTMLElement;
    const horizontal = direction === 'left' || direction === 'right';
    const sign = direction === 'left' || direction === 'up' ? -1 : 1;
    const scope = document.querySelector<HTMLElement>('#os-shell')!;
    const candidates = Array.from(scope.querySelectorAll<HTMLElement>(selector)).filter(visible);
    if (!candidates.length) return;
    if (!scope.contains(active)) { candidates[0].focus(); actions.moved(); return; }
    const row = active.closest<HTMLElement>('[data-nav-row]');
    if (horizontal && row) {
      const options = Array.from(row.querySelectorAll<HTMLElement>(selector)).filter(visible);
      const next = options[Math.max(0, Math.min(options.length - 1, options.indexOf(active) + sign))];
      if (next && next !== active) { next.focus(); actions.moved(); }
      return;
    }
    const origin = active.getBoundingClientRect();
    const centerX = origin.left + origin.width / 2;
    const centerY = origin.top + origin.height / 2;
    const scored = candidates.filter(el => el !== active && (horizontal || !row || el.closest('[data-nav-row]') !== row)).map(el => {
      const rect = el.getBoundingClientRect();
      const dx = rect.left + rect.width / 2 - centerX;
      const dy = rect.top + rect.height / 2 - centerY;
      const distance = (horizontal ? dx : dy) * sign;
      const offset = Math.abs(horizontal ? dy : dx);
      return {el, rect, score: distance > 8 && (!horizontal || offset < 80) ? distance + offset * 1.4 : Infinity};
    }).sort((a,b) => a.score - b.score);
    const next = scored[0];
    const screen = active.closest<HTMLElement>('.app-screen');
    if (screen && !horizontal && screen.scrollHeight > screen.clientHeight + 2) {
      const bounds = screen.getBoundingClientRect();
      if (!next || next.score === Infinity || next.rect.top > bounds.bottom - 40 || next.rect.bottom < bounds.top + 30) {
        const room = sign > 0 ? screen.scrollHeight - screen.clientHeight - screen.scrollTop : screen.scrollTop;
        if (room > 1) { screen.scrollBy({top: sign * Math.min(170, room), behavior: smoothness()}); actions.moved(); return; }
      }
    }
    if (next?.score < Infinity) { next.el.focus({preventScroll:true}); next.el.scrollIntoView({block:'nearest', inline:'nearest', behavior:smoothness()}); actions.moved(); }
    else if (!horizontal) (screen || document.documentElement).scrollBy({top: sign * 160, behavior:smoothness()});
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
