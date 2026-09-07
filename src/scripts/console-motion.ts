/** A damped spring with continuous velocity when an input interrupts its settling motion. */
export function createRailMotion(track: HTMLElement, enabled: () => boolean) {
  const damping = 18, frequency = 12, duration = .64;
  let animation: Animation | null = null;
  let target = 0, origin = 0, velocity = 0;
  let initialized = false;
  const sample = (time: number) => {
    if (time >= duration) return {position:target,velocity:0};
    const a = origin-target, b = (velocity+damping*a)/frequency;
    const decay = Math.exp(-damping*time), sin = Math.sin(frequency*time), cos = Math.cos(frequency*time);
    return {
      position:target+decay*(a*cos+b*sin),
      velocity:decay*((b*frequency-damping*a)*cos-(a*frequency+damping*b)*sin),
    };
  };
  return {
    to(next: number, jump = false) {
      if (initialized && next===target && !jump) return;
      // Read the compositor's position and playhead. Its first frame can start later than
      // performance.now() on a busy page, so a second wall clock would cause a small jump.
      const time=typeof animation?.currentTime==='number'?animation.currentTime/1000:duration;
      const current=sample(time);
      if (animation && animation.playState!=='finished') current.position=new DOMMatrixReadOnly(getComputedStyle(track).transform).m42;
      animation?.cancel();
      origin=current.position; velocity=current.velocity; target=next;
      track.style.transform=`translateY(${next}px)`;
      if (jump || !initialized || !enabled()) { initialized=true; origin=next; velocity=0; return; }
      const frames=Array.from({length:40},(_,i)=>({transform:`translateY(${sample(i/39*duration).position}px)`,offset:i/39}));
      animation=track.animate(frames,{duration:duration*1000,easing:'linear'});
    },
    settle() { animation?.cancel();animation=null;origin=target;velocity=0; },
  };
}

/** Give the image a small amount of depth without moving text or controls under the pointer. */
export function installArtworkDepth(enabled: () => boolean) {
  const world=document.querySelector<HTMLElement>('.world')!;
  let x=0,y=0,targetX=0,targetY=0,frame=0;
  const tick=()=>{
    if (!enabled() || document.hidden) { x=0;y=0;targetX=0;targetY=0; }
    x+=(targetX-x)*.075;y+=(targetY-y)*.075;
    world.style.setProperty('--depth-x',`${x.toFixed(2)}px`);
    world.style.setProperty('--depth-y',`${y.toFixed(2)}px`);
    frame=Math.abs(targetX-x)+Math.abs(targetY-y)>.03?requestAnimationFrame(tick):0;
  };
  document.addEventListener('pointermove',event=>{
    if (event.pointerType!=='mouse' || !enabled()) return;
    targetX=(event.clientX/innerWidth-.5)*-10;targetY=(event.clientY/innerHeight-.5)*-7;
    if (!frame) frame=requestAnimationFrame(tick);
  },{passive:true});
  const reset=()=>{targetX=0;targetY=0;if(!frame)frame=requestAnimationFrame(tick);};
  document.documentElement.addEventListener('pointerleave',reset);
  document.addEventListener('visibilitychange',reset);
  return {reset};
}
