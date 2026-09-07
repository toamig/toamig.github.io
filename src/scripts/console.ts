import type { ConsoleItem } from '../data/console';
import { createScene } from './console-scene';
import { createBootScene } from './console-boot';
import { createRailMotion, installArtworkDepth } from './console-motion';
import { createConsoleAudio } from './console-audio';
import { installNavigation, type Direction } from './console-navigation';
import type { ConsolePortalApi } from './console-portal-bridge';

type View = 'library' | 'profile' | 'project' | 'journal' | 'contact' | 'settings' | 'search';
interface State { console: true; view: View; category: string; item: string; profileTab: string; company: number; photo: number; query: string; parent: boolean; focus?: string; }
const { items, categories }: {items: ConsoleItem[]; categories: {id: string; name: string; description: string}[]} = JSON.parse(document.getElementById('library-data')!.textContent!);
const get = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const all = <T extends HTMLElement = HTMLElement>(selector: string) => Array.from(document.querySelectorAll<T>(selector));
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const save = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* Preferences are optional. */ } };
const firstCategory = categories[0].id;
const firstItem = items.find(i => i.category === firstCategory)!.id;
const defaultState: State = {console:true, view:'library', category:firstCategory, item:firstItem, profileTab:'overview', company:0, photo:0, query:'', parent:false};
let state = {...defaultState};
const embedded = window.parent !== window && new URLSearchParams(location.search).has('embedded');
let portalDormant = embedded, portalStarted = false;
const embeddedHistory: State[] = [];
const remembered = Object.fromEntries(categories.map(c => [c.id, items.find(i => i.category === c.id)!.id]));
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const bootSeenKey = 'toamig-os-intro-v4';
let motion = !reducedMotion.matches && read('toamig-motion') !== 'off';
const volumeValue = Number(read('toamig-os-volume') ?? '45');
const volume = Number.isFinite(volumeValue) ? Math.max(0, Math.min(100, volumeValue)) : 45;
const audio = createConsoleAudio(read('toamig-os-sound') !== 'off', volume / 100);
const ambient = createScene(get<HTMLCanvasElement>('ambient-canvas'));
const boot = get('boot');
const bootScene = createBootScene(get<HTMLCanvasElement>('boot-canvas'), timeline => {
  get('boot-mark').style.opacity = String(timeline.mark); get('boot-note').style.opacity = String(timeline.note); boot.style.opacity = String(timeline.overlay);
  get('boot-mark').style.setProperty('--mark-scale', String(timeline.markScale));
  get('boot-mark').style.setProperty('--arrival', String(timeline.arrival));
  if (timeline.overlay < 1 && motion && !document.hidden) ambient.start();
  if (timeline.done) finishBoot(true);
});
const shell = get('os-shell');
let bootPhase: 'waiting' | 'playing' | 'leaving' | 'closed' = 'closed';
let bootTimer: ReturnType<typeof setTimeout>;
let bootGeneration = 0;
let artToken = 0, artSlot = 0, artSource = '';
let rendering = false;
let audioUnlock: Promise<boolean> | null = null;
let railCategory = '';
const railMotion = createRailMotion(get('rail-track'), () => motion);
const artworkDepth = installArtworkDepth(() => motion && bootPhase === 'closed' && state.view === 'library');

all('button, a[href], input').forEach((el, i) => { if (!el.id) el.id = `os-control-${i}`; });
const currentItem = () => items.find(i => i.id === state.item)!;
const groupItems = () => items.filter(i => i.category === state.category);
function hashFor(s: State) { return s.view === 'library' ? `#library/${s.category}/${s.item}` : s.view === 'profile' ? `#profile/${s.profileTab}` : ['project','journal'].includes(s.view) ? `#${s.view}/${s.item}` : `#${s.view}`; }

function parseHash(): State {
  let hash = '';
  try { hash = decodeURIComponent(location.hash.slice(1)); } catch { return {...defaultState}; }
  const [view, part, entry] = hash.split('/');
  const next = {...defaultState};
  const legacy: Record<string, string> = {welcome:'overview', about:'overview', 'about-2':'overview', experience:'career', education:'education', technologies:'toolkit'};
  if (legacy[view]) return {...next, view:'profile', profileTab:legacy[view]};
  if (view === 'building') return {...next, category:'plugins', item:'plugin-0'};
  if (view === 'profile') return {...next, view:'profile', profileTab:['overview','career','toolkit','education'].includes(part) ? part : 'overview'};
  if (['contact','settings','search'].includes(view)) return {...next, view:view as View};
  const item = items.find(i => i.id === (view === 'library' ? entry : ['project','journal'].includes(view) ? part : view));
  if (item) return {...next, item:item.id, category:item.category, view: view === 'project' || view === 'journal' ? view : 'library'};
  return next;
}

function setArtwork(source: string) {
  if (source === artSource) return;
  artSource = source;
  const token = ++artToken;
  if (!source) { all('.world-art').forEach(el => el.classList.remove('is-visible')); document.body.classList.remove('has-art'); return; }
  const image = new Image();
  image.onload = () => {
    if (token !== artToken) return;
    const incoming = get(artSlot === 0 ? 'world-art-a' : 'world-art-b');
    const outgoing = get(artSlot === 0 ? 'world-art-b' : 'world-art-a');
    incoming.style.backgroundImage = `url("${source}")`;
    incoming.classList.add('is-visible'); outgoing.classList.remove('is-visible');
    document.body.classList.add('has-art'); artSlot = 1 - artSlot;
  };
  image.onerror = () => { if (token === artToken) { artSource = ''; document.body.classList.remove('has-art'); all('.world-art').forEach(el => el.classList.remove('is-visible')); } };
  image.src = source;
}

/** Keeps the selected rail entry at a fixed anchor and slides the list beneath it, the way a cross media bar moves the icons rather than a cursor. */
function renderRail(jump = false) {
  const rail = get('item-rail'); const selected = get(`item-${state.item}`);
  if (!rail.clientHeight || !selected || selected.hidden) return;
  const anchor = Math.round(Math.min(selected.offsetHeight + 3, rail.clientHeight * .28));
  railMotion.to(anchor - selected.offsetTop, jump);
}

/** Screens never show a scrollbar; a fade and a bobbing chevron say that more follows. */
function updateScrollCues() {
  const screen = all('.app-screen').find(s => !s.hidden);
  const hint = get('scroll-hint');
  if (!screen) { hint.hidden = true; return; }
  const below = screen.scrollHeight - screen.clientHeight - screen.scrollTop > 6;
  screen.classList.toggle('more-below', below); screen.classList.toggle('more-above', screen.scrollTop > 6);
  hint.hidden = !below;
}

function renderLibrary() {
  const item = currentItem();
  const category = categories.find(c => c.id === state.category)!;
  const entries = groupItems();
  all('button[data-category]').forEach(button => {
    const active = button.dataset.category === state.category;
    button.classList.toggle('is-active', active); button.setAttribute('aria-selected', String(active)); button.tabIndex = active ? 0 : -1;
  });
  all('[data-item]').forEach(button => {
    const active = button.dataset.item === item.id;
    button.hidden = button.dataset.group !== state.category;
    button.classList.toggle('is-selected', active); button.setAttribute('aria-selected', String(active)); button.tabIndex = active ? 0 : -1;
  });
  all('[data-feature]').forEach(panel => { const active = panel.dataset.feature === item.id; panel.hidden = !active; panel.classList.toggle('is-selected', active); });
  get('category-content').setAttribute('aria-labelledby', `category-${state.category}`);
  get('item-rail').setAttribute('aria-label', category.name);
  get('category-description').textContent = state.category === 'games' ? 'Games I’ve worked on' : category.name;
  get('library-position').textContent = `${entries.indexOf(item) + 1} / ${entries.length}`;
  get('category-count').textContent = `${entries.length} ${state.category === 'profile' ? 'chapters' : state.category === 'journal' ? 'stories' : state.category} in this collection`;
  renderRail(railCategory !== state.category); railCategory = state.category;
}

function renderProfile() {
  all('[data-profile-tab]').forEach(button => { const active = button.dataset.profileTab === state.profileTab; button.setAttribute('aria-selected', String(active)); button.tabIndex = active ? 0 : -1; });
  all('[data-profile-pane]').forEach(panel => { panel.hidden = panel.dataset.profilePane !== state.profileTab; });
  all('[data-career]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.career) === state.company)));
  all('[data-career-panel]').forEach(panel => { panel.hidden = Number(panel.dataset.careerPanel) !== state.company; });
}

function renderProject() {
  const item = currentItem();
  get('project-eyeline').textContent = categories.find(c => c.id === item.category)!.name;
  get('project-title').textContent = item.name; get('project-role').textContent = item.subtitle;
  get('project-description').textContent = item.description;
  const image = get<HTMLImageElement>('project-image');
  image.hidden = !item.image; if (item.image) { image.src = item.image; image.alt = item.name; }
  get('project-symbol').hidden = !!item.image;
  get('project-caption').textContent = item.meta.join(' / ');
  const link = get<HTMLAnchorElement>('project-link');
  link.href = item.href; link.target = item.href.startsWith('https://') ? '_blank' : embedded ? '_top' : '_self'; link.rel = 'noopener noreferrer'; link.childNodes[0].textContent = `${item.action} `;
  const studio = get<HTMLImageElement>('project-studio'); studio.hidden = !item.studioLogo;
  if (item.studioLogo) { studio.src = item.studioLogo; studio.alt = item.studio || ''; }
  get('contribution-eyeline').textContent = item.category === 'games' ? 'My contribution' : 'Project focus';
  get('contribution-title').textContent = item.category === 'games' ? 'Behind the experience.' : 'Built with a purpose.';
  const list = get('project-bullets'); list.replaceChildren();
  const bullets = item.bullets.length ? item.bullets : item.meta;
  bullets.forEach(text => { const li = document.createElement('li'); li.textContent = text; list.append(li); });
}

function renderJournal() {
  const item = currentItem();
  get('journal-title').textContent = item.name; get('journal-date').textContent = item.subtitle; get('journal-description').textContent = item.description;
  const gallery = (item.gallery?.length ? item.gallery : item.image ? [item.image] : []);
  get('journal-figure').hidden = !gallery.length;
  get('journal-plain').hidden = gallery.length > 0;
  get('photo-previous').hidden = gallery.length < 2; get('photo-next').hidden = gallery.length < 2; get('photo-position').hidden = !gallery.length;
  if (gallery.length) {
    state.photo = Math.max(0, Math.min(state.photo, gallery.length - 1));
    const image = get<HTMLImageElement>('journal-image'); image.src = gallery[state.photo]; get<HTMLImageElement>('journal-backdrop').src = gallery[state.photo]; image.alt = `${item.name}, photograph ${state.photo + 1}`;
    get('photo-position').textContent = `${state.photo + 1} / ${gallery.length}`;
  } else state.photo = 0;
  get<HTMLAnchorElement>('journal-link').href = item.href; if(embedded)get<HTMLAnchorElement>('journal-link').target='_top';

}

function filterSearch() {
  state.query = get<HTMLInputElement>('library-search').value;
  const query = state.query.trim().toLowerCase(); let count = 0;
  all('[data-search-item]').forEach(result => { result.hidden = !result.dataset.searchText!.includes(query); if (!result.hidden) count++; });
  get('search-count').textContent = `${count} ${count === 1 ? 'destination' : 'destinations'}`;
  get('search-empty').hidden = count > 0;
  history.replaceState(state, '', hashFor(state));
}

function render(focus = true) {
  rendering = true;
  document.body.dataset.view = state.view; document.body.dataset.category = state.category;
  all('[data-screen]').forEach(screen => { screen.hidden = screen.dataset.screen !== state.view; });
  get('screen-topbar').hidden = state.view === 'library';
  const crumbs: Record<View,string> = {library:'', profile:'Player profile', project:`${categories.find(c => c.id === state.category)!.name} / ${currentItem().name}`, journal:`Journal / ${currentItem().name}`, contact:'Get in touch', settings:'System settings', search:'Search'};
  get('screen-breadcrumb').textContent = crumbs[state.view];
  renderLibrary();
  if (state.view === 'profile') renderProfile();
  if (state.view === 'project') renderProject();
  if (state.view === 'journal') renderJournal();
  if (state.view === 'search') { get<HTMLInputElement>('library-search').value = state.query; filterSearch(); }
  setArtwork(state.view === 'profile' ? '' : currentItem().image);
  get('category-hint').innerHTML = state.view === 'library' ? '<kbd>← →</kbd> Categories' : '<kbd>← →</kbd> Navigate';
  get('item-hint').innerHTML = state.view === 'library' ? '<kbd>↑ ↓</kbd> Explore' : '<kbd>↑ ↓</kbd> Navigate';
  if (focus && bootPhase === 'closed') {
    const target = state.focus && get(state.focus);
    const landing: Record<View, string> = {library:`item-${state.item}`, search:'library-search', profile:`profile-tab-${state.profileTab}`, project:'project-link', journal:(currentItem().gallery?.length || 0) > 1 ? 'photo-next' : 'journal-link', contact:'email-link', settings:'sound-setting'};
    const fallback = get(landing[state.view]) || get('screen-back');
    (target && target.getClientRects().length ? target : fallback).focus({preventScroll:true});
  }
  updateScrollCues(); setTimeout(updateScrollCues, 150);
  rendering = false;
}

function navigate(next: Partial<State>, push = true) {
  state.focus = (document.activeElement as HTMLElement)?.id;
  history.replaceState(state, '', hashFor(state));
  if(embedded && push)embeddedHistory.push({...state});
  state = {...state, ...next, console:true, focus:undefined, parent: push ? true : state.parent};
  if (push && !embedded) history.pushState(state, '', hashFor(state)); else history.replaceState(state, '', hashFor(state));
  render();
  get(`screen-${state.view}`)?.scrollTo(0, 0);
  if (innerWidth <= 760) window.scrollTo({top:0, behavior:'instant'});
  audio.cue('confirm');
}

function selectItem(id: string, focus = true, cue = true) {
  const item = items.find(i => i.id === id); if (!item) return;
  const changed = state.item !== id; const switched = state.category !== item.category;
  if (switched) get('item-rail').style.setProperty('--rail-from', categories.findIndex(c => c.id === item.category) > categories.findIndex(c => c.id === state.category) ? '22px' : '-22px');
  state = {...state, view:'library', category:item.category, item:id, focus:undefined}; remembered[item.category] = id;
  history.replaceState(state, '', hashFor(state)); render(false);
  if (focus) get(`item-${id}`).focus({preventScroll:true});
  if (changed && cue) audio.cue(switched ? 'category' : 'move');
}

function changeCategory(step: number) {
  const index = categories.findIndex(c => c.id === state.category);
  const next = categories[Math.max(0, Math.min(categories.length - 1, index + step))];
  if (next.id === state.category) return;
  const onTab = (document.activeElement as HTMLElement).matches('[data-category]');
  selectItem(remembered[next.id], !onTab);
  if (onTab) get(`category-${next.id}`).focus({preventScroll:true});
}

function openItem(id: string) {
  const item = items.find(i => i.id === id); if (!item) return;
  navigate({item:id, category:item.category, view:item.category === 'profile' ? 'profile' : item.category === 'journal' ? 'journal' : 'project', profileTab:item.category === 'profile' ? item.id : 'overview', photo:0});
}

function back() {
  if (bootPhase !== 'closed') { finishBoot(); return; }
  audio.cue('back');
  if (state.view === 'library') { if(embedded)window.parent.postMessage({type:'toamig:exit'},location.origin);else get(`category-${state.category}`).focus({preventScroll:true}); return; }
  if(embedded && embeddedHistory.length) { state=embeddedHistory.pop()!;history.replaceState(state,'',hashFor(state));render();return; }
  const home = () => { state = {...state, view:'library', focus:undefined}; history.replaceState(state, '', hashFor(state)); render(); };
  if (!state.parent) { home(); return; }
  const from = state.view;
  history.back();
  setTimeout(() => { if (state.view === from) home(); }, 240);
}

function soundUI() {
  get<HTMLInputElement>('sound-setting').checked = audio.enabled;
  get('sound-control').setAttribute('aria-pressed', String(audio.enabled));
  get('sound-control').setAttribute('aria-label', audio.enabled ? 'Mute system sound' : 'Enable system sound');
  get('boot-sound').setAttribute('aria-pressed', String(audio.enabled));
  get('boot-sound').querySelector('span')!.textContent = audio.enabled ? 'Sound on' : 'Sound off';
  get('footer-message').textContent = audio.enabled ? 'Sound on' : 'Sound off';
}
function toggleSound(value = !audio.enabled) { audio.setEnabled(value); save('toamig-os-sound', value ? 'on' : 'off'); soundUI(); if (value) void unlock().then(() => audio.cue('confirm')); }
function unlock() {
  if (audio.ready || !audio.enabled) return Promise.resolve(true);
  audioUnlock ||= audio.unlock().finally(() => { audioUnlock = null; });
  return audioUnlock;
}
function updateMotion() {
  motion = !reducedMotion.matches && read('toamig-motion') !== 'off';
  document.body.classList.toggle('motion-off', !motion);
  if (!motion) { railMotion.settle(); artworkDepth.reset(); }
  get<HTMLInputElement>('motion-setting').checked = motion; get<HTMLInputElement>('motion-setting').disabled = reducedMotion.matches;
  ambient.stop(); bootScene.stop();
  if(portalDormant)return;
  if (bootPhase === 'playing' && !motion) { finishBoot(); return; }
  if (motion && !document.hidden && bootPhase !== 'waiting') (bootPhase === 'playing' ? bootScene : ambient).start();
  else { ambient.drawStill(); bootScene.drawStill(); }
}

async function playBoot() {
  if (bootPhase !== 'waiting') return;
  const generation = bootGeneration;
  await Promise.all([unlock(), motion ? bootScene.prepare() : Promise.resolve()]);
  if (bootPhase !== 'waiting' || generation !== bootGeneration) return;
  bootPhase = 'playing'; boot.dataset.phase = 'playing'; boot.classList.add('is-playing');
  get('start-boot').hidden = true; get('skip-boot').hidden = false; get('skip-boot').focus({preventScroll:true});
  if (motion) { bootScene.start(true, audio.startup()); }
  else { boot.classList.add('is-still'); bootTimer = setTimeout(() => finishBoot(false), 1400); }
}
/** Ends the startup: `complete` when the sequence ran its course (the overlay is already clear), otherwise a short fade while the sound is eased out. */
function finishBoot(complete = false) {
  if (bootPhase === 'closed' || bootPhase === 'leaving') return;
  const generation=++bootGeneration; bootPhase = 'leaving'; clearTimeout(bootTimer); shell.inert = false;
  if (complete) boot.style.opacity = '0'; else { boot.classList.add('is-leaving'); audio.stopStartup(); }
  setTimeout(() => {
    if(generation!==bootGeneration)return;
    boot.hidden = true; boot.classList.remove('is-playing','is-leaving','is-still'); boot.style.opacity = ''; bootPhase = 'closed'; boot.dataset.phase = 'closed';
    bootScene.stop(); if (motion && !document.hidden) ambient.start(); render();
    try { sessionStorage.setItem(bootSeenKey, 'seen'); } catch { /* A fresh intro remains usable without storage. */ }
  }, complete || !motion ? 0 : 500);
}
async function startBoot() {
  bootGeneration++; audio.stopStartup();
  bootPhase = 'waiting'; boot.hidden = false; boot.dataset.phase = 'waiting'; shell.inert = true;
  boot.classList.remove('is-playing','is-leaving','is-still'); boot.style.opacity = ''; get('boot-mark').style.opacity = '0'; get('boot-note').style.opacity = '0';
  get('start-boot').hidden = false; get('skip-boot').hidden = true;
  ambient.stop(); bootScene.drawStill(); get('start-boot').focus({preventScroll:true});
  if (motion) void bootScene.prepare();
  if (!audio.enabled || await unlock()) void playBoot();
}

function showProfileTab(tab: string, company = state.company) {
  state.profileTab = tab; state.company = company; state.focus = undefined;
  history.replaceState(state, '', hashFor(state)); renderProfile(); updateScrollCues(); audio.cue('move');
}
function nextPhoto(step: number) {
  const photos = currentItem().gallery || []; if (!photos.length) return;
  state.photo = (state.photo + step + photos.length) % photos.length; renderJournal(); history.replaceState(state, '', hashFor(state)); audio.cue('move');
}
function direction(direction: Direction) {
  if (bootPhase !== 'closed') return true;
  const active = document.activeElement as HTMLElement;
  const horizontal = direction === 'left' || direction === 'right';
  const sign = direction === 'left' || direction === 'up' ? -1 : 1;
  if (state.view === 'library' && active.closest('.feature')) {
    if (!horizontal && sign < 0) { get(`item-${state.item}`).focus({preventScroll:true}); return true; }
    return false;
  }
  if (state.view === 'library' && !active.closest('.system-header, .control-bar, .developer-shortcut')) {
    if (horizontal) { changeCategory(sign); return true; }
    if (active.matches('[data-category]')) { if (sign < 0) return false; get(`item-${state.item}`).focus({preventScroll:true}); return true; }
    const entries = groupItems(); const index = entries.findIndex(i => i.id === state.item) + sign;
    if (index < 0) get(`category-${state.category}`).focus({preventScroll:true});
    else if (index < entries.length) selectItem(entries[index].id);
    else { const action = document.querySelector<HTMLElement>('.feature:not([hidden]) .actions button, .feature:not([hidden]) .actions a'); if (action) action.focus({preventScroll:true}); else return false; }
    return true;
  }
  if (state.view === 'profile' && active.matches('[data-profile-tab]') && horizontal) {
    const tabs = ['overview','career','toolkit','education']; const index = tabs.indexOf(state.profileTab);
    showProfileTab(tabs[Math.max(0,Math.min(tabs.length - 1,index + sign))]); get(`profile-tab-${state.profileTab}`).focus(); return true;
  }
  if (state.view === 'journal' && horizontal && active.closest('.journal-screen') && !active.matches('a')) { nextPhoto(sign); return true; }
  return false;
}

document.body.classList.add('console-ready');
state = parseHash(); history.replaceState(state, '', location.hash || hashFor(state));
render(false); updateMotion(); soundUI(); get<HTMLInputElement>('volume-setting').value = String(volume);
new ResizeObserver(() => renderRail(true)).observe(get('item-rail')); new ResizeObserver(() => renderRail(true)).observe(get('rail-track'));
all('.app-screen').forEach(screen => screen.addEventListener('scroll', updateScrollCues, {passive:true}));
window.addEventListener('resize', updateScrollCues);
document.addEventListener('load', event => { if ((event.target as HTMLElement).closest?.('.app-screen')) updateScrollCues(); }, true);
all('button[data-category]').forEach(button => button.addEventListener('click', () => selectItem(remembered[button.dataset.category!])));
all('[data-item]').forEach(button => {
  button.addEventListener('click', () => selectItem(button.dataset.item!));
  button.addEventListener('focus', () => { if (!rendering && state.view === 'library' && state.item !== button.dataset.item) selectItem(button.dataset.item!, false); });
  button.addEventListener('dblclick', () => openItem(button.dataset.item!));
});
all('[data-explore], [data-search-item]').forEach(button => button.addEventListener('click', () => openItem(button.dataset.explore || button.dataset.searchItem!)));
all('[data-open]').forEach(button => button.addEventListener('click', () => navigate({view:button.dataset.open as View, profileTab:'overview', query:''})));
all('[data-profile-tab]').forEach(button => button.addEventListener('click', () => showProfileTab(button.dataset.profileTab!)));
all('[data-company]').forEach(button => button.addEventListener('click', () => { showProfileTab('career', Number(button.dataset.company)); get('profile-tab-career').focus(); get('screen-profile').scrollTo(0,0); }));
all('[data-career]').forEach(button => button.addEventListener('click', () => showProfileTab('career', Number(button.dataset.career))));
all('[data-career]').forEach(button => button.addEventListener('focus', () => { if (state.view === 'profile' && Number(button.dataset.career) !== state.company) showProfileTab('career', Number(button.dataset.career)); }));
get('screen-back').addEventListener('click', back); get('back-control').addEventListener('click', back);
get('home-control').addEventListener('click', () => { if (state.view === 'library') selectItem(firstItem); else navigate({...defaultState}, false); });
get('sound-control').addEventListener('click', () => toggleSound()); get('boot-sound').addEventListener('click', () => toggleSound());
get<HTMLInputElement>('sound-setting').addEventListener('change', event => toggleSound((event.target as HTMLInputElement).checked));
get<HTMLInputElement>('volume-setting').addEventListener('input', event => { const value = (event.target as HTMLInputElement).valueAsNumber; audio.setVolume(value / 100); save('toamig-os-volume', String(value)); });
get<HTMLInputElement>('motion-setting').addEventListener('change', event => { save('toamig-motion', (event.target as HTMLInputElement).checked ? 'on' : 'off'); updateMotion(); });
reducedMotion.addEventListener('change', updateMotion);
document.addEventListener('visibilitychange', () => { audio.setHidden(document.hidden || portalDormant); updateMotion(); });
get('library-search').addEventListener('input', filterSearch);
get('photo-previous').addEventListener('click', () => nextPhoto(-1)); get('photo-next').addEventListener('click', () => nextPhoto(1));
get('start-boot').addEventListener('click', () => void playBoot()); get('skip-boot').addEventListener('click', () => finishBoot());
boot.addEventListener('click', event => { if (bootPhase === 'waiting' && !(event.target as HTMLElement).closest('button')) void playBoot(); });
get('replay-boot').addEventListener('click', () => void startBoot());
get('fullscreen-control').addEventListener('click', async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch { get('fullscreen-control').querySelector('small')!.textContent = 'Fullscreen is unavailable in this browser.'; } });
document.addEventListener('fullscreenchange', () => { get('fullscreen-control').querySelector('span')!.childNodes[0].textContent = document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen'; });
get('fullscreen-control').hidden = !document.fullscreenEnabled;
get('copy-email').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(get('copy-email').dataset.email!); get('copy-email').querySelector('span')!.textContent = 'Email address copied'; }
  catch { get('copy-email').querySelector('span')!.textContent = 'Select the address above to copy it'; }
});
window.addEventListener('popstate', event => { state = event.state?.console ? event.state : parseHash(); render(); });
window.addEventListener('hashchange', () => { const next = parseHash(); if (hashFor(next) !== hashFor(state)) { state = next; render(); } });

installNavigation({ direction, back, suspended:() => portalDormant, moved:() => audio.cue('move'), options:() => { if (bootPhase !== 'closed') return; if (state.view === 'settings') back(); else navigate({view:'settings', profileTab:'overview', query:''}); }, boot:() => bootPhase !== 'closed', unlock:() => { void unlock(); }, shoulder:step => { if (bootPhase === 'closed' && state.view === 'library') changeCategory(step); }, confirm() {
  if (bootPhase === 'waiting') { void playBoot(); return; }
  if (bootPhase === 'playing') { finishBoot(); return; }
  if (bootPhase !== 'closed') return;
  const active = document.activeElement as HTMLElement;
  if (state.view === 'library' && active.matches('[data-item], [data-category]')) openItem(state.item);
  else active.click();
}});
function updateClock() { const now = new Date(); const clock = get<HTMLTimeElement>('system-clock'); clock.textContent = now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',hour12:false}); clock.dateTime = now.toISOString(); }
updateClock(); setInterval(updateClock, 10000);
let seen = false; try { seen = sessionStorage.getItem(bootSeenKey) === 'seen'; } catch { /* Storage is optional. */ }
if(embedded) {
  all<HTMLAnchorElement>('a[href^="/"]:not(#portfolio-exit)').forEach(link=>link.target='_top');
  get('portfolio-exit').addEventListener('click',event=>{event.preventDefault();window.parent.postMessage({type:'toamig:exit'},location.origin);});
  const portal:ConsolePortalApi={
    async prepare() { await Promise.all([audio.unlock(),motion?bootScene.prepare():Promise.resolve()]); },
    enter() {
      portalDormant=false;delete document.documentElement.dataset.docked;audio.setHidden(document.hidden);
      if(!portalStarted && !reducedMotion.matches) {portalStarted=true;void startBoot();}
      else {portalStarted=true;shell.inert=false;render();updateMotion();}
    },
    leave() {
      portalDormant=true;bootGeneration++;clearTimeout(bootTimer);bootScene.stop();ambient.stop();audio.stopStartup();audio.setHidden(true);
      boot.hidden=true;bootPhase='closed';boot.dataset.phase='closed';boot.style.opacity='';
      document.documentElement.dataset.docked='true';shell.inert=true;
    },
  };
  window.toamigConsolePortal=portal;shell.inert=true;
  window.parent.postMessage({type:'toamig:ready'},location.origin);
} else if (!seen && state.view === 'library' && !reducedMotion.matches) void startBoot(); else { render(); void unlock(); }
