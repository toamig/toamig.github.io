import { gsap } from 'gsap';
import type { ConsolePortalApi } from './console-portal-bridge';

const flight=document.getElementById('device-flight')!;
const placement=document.getElementById('device-placement')!;
const screen=document.getElementById('device-screen')!;
const frame=document.getElementById('console-frame') as HTMLIFrameElement;
const blackout=document.getElementById('portal-blackout')!;
const room=document.getElementById('playroom')!;
const triggers=Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-enter-console]'));
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let phase:'docked'|'preparing'|'entering'|'active'|'leaving'='docked';
let animation:gsap.core.Timeline|null=null;
let savedFocus:HTMLElement|null=null;
let savedScroll=0,request=0;
let returnHash='#playroom';
let api:ConsolePortalApi|undefined;
let readyResolve:()=>void;
let ready=makeReady();
const inertState=new Map<HTMLElement,boolean>();
let dock={x:0,y:0,width:0,height:0};

function makeReady() { return new Promise<void>(resolve=>{readyResolve=resolve;}); }

function layout() {
  if (phase==='active') { immersiveTransform(); return; }
  if (phase!=='docked' && phase!=='preparing') return;
  const rect=placement.getBoundingClientRect();
  dock={x:rect.x,y:rect.y+scrollY,width:rect.width,height:rect.width/2.4};
  gsap.set(flight,{position:'absolute',left:dock.x,top:dock.y,width:dock.width,height:dock.height,x:0,y:0,scale:1,rotationX:12,rotationY:-9,rotationZ:-7,transformPerspective:1800});
  previewSurface();
  document.documentElement.classList.add('portal-ready');
}
const SURFACE={width:1280,height:720};
function previewSurface() {
  frame.style.width=`${SURFACE.width}px`;frame.style.height=`${SURFACE.height}px`;
  sizePreview();
}
function sizePreview() { frame.style.transform=`scale(${screen.clientWidth/SURFACE.width})`; }
function load() {
  if (!frame.hasAttribute('src')) frame.src=frame.dataset.src!;
  return ready;
}
function setPhase(next:typeof phase) { phase=next;flight.dataset.portalState=next; }
function isolate(active:boolean) {
  document.documentElement.classList.toggle('portal-open',active);
  document.body.classList.toggle('portal-open',active);
  if (active) {
    for (const child of Array.from(document.body.children)) {
      if (!(child instanceof HTMLElement) || child===flight || child===blackout || child.tagName==='SCRIPT') continue;
      inertState.set(child,child.inert);child.inert=true;
    }
  } else { for(const [el,value]of inertState)el.inert=value;inertState.clear(); }
}
function immersiveTransform() {
  // Once the console fills the window the full-bleed layout owns the geometry, and reapplying
  // the camera's covering scale on top of it would crop the console's own edges.
  if (flight.classList.contains('is-immersive')) return;
  const rect=placement.getBoundingClientRect();
  dock={x:rect.x,y:rect.y+scrollY,width:rect.width,height:rect.width/2.4};
  const x=innerWidth/2-(dock.x+dock.width/2),y=innerHeight/2-(dock.y-scrollY+dock.height/2);
  const zoom=Math.max(innerWidth/screen.clientWidth,innerHeight/screen.clientHeight)*1.04;
  gsap.set(flight,{position:'fixed',left:dock.x,top:dock.y-scrollY,x,y,scale:zoom,rotationX:0,rotationY:0,rotationZ:0});
}
function fullView() {
  immersiveTransform();
  flight.classList.add('is-immersive');
  // Hand the console the window it is actually on. Scaling a fixed 16:9 surface to cover the
  // window crops whatever does not fit, which on most windows means losing the system bar at
  // the top and the control bar at the bottom.
  gsap.set(flight,{clearProps:'transform,left,top,width,height,position'});
  frame.style.transform='none';frame.style.width='100%';frame.style.height='100%';
  frame.tabIndex=0;
  setPhase('active');api?.enter();frame.contentWindow?.focus();
}
function resetFrame() {
  api=undefined;screen.classList.remove('is-ready');frame.removeAttribute('src');frame.tabIndex=-1;previewSurface();
  ready=makeReady();
}

async function enter(push=true) {
  if(phase!=='docked')return;
  const token=++request;savedFocus=document.activeElement as HTMLElement;
  setPhase('preparing');triggers.forEach(link=>link.setAttribute('aria-busy','true'));
  // Call prepare in the click's activation stack when the nearby screen is already loaded.
  const preparation=api?.prepare();
  try {
    let timeout:ReturnType<typeof setTimeout>|undefined;
    try { await Promise.race([load(),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('Screen unavailable')),8000);})]); }
    finally { clearTimeout(timeout); }
    if(token!==request)return;
    await (preparation || api?.prepare());
    if(token!==request)return;
  } catch { if(token===request)location.assign('/console/');return; }
  gsap.killTweensOf(flight);layout();savedScroll=scrollY;
  if(push) { returnHash=location.hash || '#playroom';history.pushState({consolePortal:true},'', '#play'); }
  isolate(true);setPhase('entering');
  gsap.set(flight,{position:'fixed',top:dock.y-savedScroll});
  const x=innerWidth/2-(dock.x+dock.width/2),y=innerHeight/2-(dock.y-savedScroll+dock.height/2);
  const zoom=Math.max(innerWidth/screen.clientWidth,innerHeight/screen.clientHeight)*1.04;
  animation=gsap.timeline({onComplete:fullView});
  animation.to(blackout,{opacity:1,duration:reduced.matches ? .16 : 1.05,ease:'power2.inOut'},0);
  animation.to(flight,{x,y,scale:zoom,rotationX:0,rotationY:0,rotationZ:0,duration:reduced.matches?0:1.35,ease:'power3.inOut'},0);
}

async function leave() {
  if(phase==='docked'||phase==='leaving')return;
  request++;animation?.kill();
  if(phase==='preparing') { setPhase('docked');triggers.forEach(link=>link.removeAttribute('aria-busy'));return; }
  if(document.fullscreenElement) { try {await document.exitFullscreen();}catch { /* The return also works in windowed mode. */ } }
  api?.leave();setPhase('leaving');
  const rect=placement.getBoundingClientRect();
  dock={x:rect.x,y:rect.y+scrollY,width:rect.width,height:rect.width/2.4};
  flight.classList.remove('is-immersive');frame.tabIndex=-1;
  // Put the handheld back on its preview surface, then start the return from where the
  // full-bleed console just was.
  previewSurface();
  gsap.set(flight,{width:dock.width,height:dock.height,transformPerspective:1800});
  immersiveTransform();
  animation=gsap.timeline({onComplete:()=>{
    isolate(false);setPhase('docked');layout();resetFrame();
    gsap.set(blackout,{opacity:0});
    triggers.forEach(link=>link.removeAttribute('aria-busy'));
    (savedFocus?.isConnected && savedFocus!==document.body?savedFocus:triggers[0]).focus({preventScroll:true});
    if(location.hash==='#play')void enter(false);
  }});
  animation.to(flight,{x:0,y:0,scale:1,rotationX:12,rotationY:-9,rotationZ:-7,duration:reduced.matches?0:1.15,ease:'power3.inOut'},0);
  animation.to(blackout,{opacity:0,duration:reduced.matches ? .16 : .8,ease:'power2.inOut'},reduced.matches?0:.25);
}
function close() {
  if(phase==='docked'||phase==='leaving')return;
  if(!history.state?.consolePortal) { history.replaceState(null,'',returnHash);void leave();return; }
  // Loading the screen navigates the iframe, and those navigations join the session history.
  // A step back can therefore land on one of them instead of the entry before the console, so
  // if the hash has not moved shortly after, leave directly rather than stranding the visitor.
  const from=location.hash;
  history.back();
  setTimeout(()=>{
    if(location.hash===from && phase!=='docked' && phase!=='leaving') { history.replaceState(null,'',returnHash);void leave(); }
  },250);
}

triggers.forEach(link=>{
  link.addEventListener('pointerenter',()=>void load());link.addEventListener('focus',()=>void load());
  link.addEventListener('click',event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button!==0)return;event.preventDefault();void enter();});
});
window.addEventListener('message',event=>{
  if(event.origin!==location.origin || event.source!==frame.contentWindow)return;
  if(event.data?.type==='toamig:ready') {api=frame.contentWindow?.toamigConsolePortal;screen.classList.add('is-ready');readyResolve();}
  if(event.data?.type==='toamig:exit')close();
});
window.addEventListener('popstate',()=>{if(location.hash==='#play'){if(phase==='docked')void enter(false);}else void leave();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&phase!=='docked'){event.preventDefault();close();}});
window.addEventListener('resize',()=>{
  if(phase==='entering') {animation?.kill();gsap.set(blackout,{opacity:1});fullView();}
  else if(phase==='leaving') {animation?.progress(1);layout();}
  else if(phase==='active') immersiveTransform();
  else layout();
});
const layoutObserver=new ResizeObserver(layout);layoutObserver.observe(placement);layoutObserver.observe(document.body);
new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting))void load();},{rootMargin:'600px'}).observe(room);
document.fonts.ready.then(layout);layout();

flight.addEventListener('pointermove',event=>{
  if(phase!=='docked'||reduced.matches||event.pointerType==='touch')return;
  const box=flight.getBoundingClientRect();const x=(event.clientX-box.left)/box.width-.5,y=(event.clientY-box.top)/box.height-.5;
  gsap.to(flight,{rotationY:-9+x*5,rotationX:12-y*4,duration:.65,ease:'power2.out',overwrite:'auto'});
});
flight.addEventListener('pointerleave',()=>{if(phase==='docked')gsap.to(flight,{rotationX:12,rotationY:-9,duration:.7,overwrite:'auto'});});
if(location.hash==='#play') {room.scrollIntoView({behavior:'instant',block:'center'});layout();void enter(false);}
// Existing links to the console still work after the professional page returns to the root.
function redirectConsoleLink() {
  if(/^#(?:library\/|project\/|journal\/|profile\/|settings$|search$)/.test(location.hash))location.replace(`/console/${location.hash}`);
}
window.addEventListener('hashchange',redirectConsoleLink);redirectConsoleLink();
