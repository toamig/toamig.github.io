import { bootTimeline, type BootTimeline, type BootRenderer } from './console-boot-timeline';

/** Owns the startup playhead. The renderer is loaded only when the sequence is needed. */
export function createBootScene(initialCanvas: HTMLCanvasElement, onFrame: (timeline: BootTimeline) => void) {
  let canvas = initialCanvas;
  let renderer: BootRenderer | null = null;
  let loading: Promise<void> | null = null;
  let frame = 0, running = false, elapsed = 0, started = 0;
  let audioClock: (() => number) | null = null;
  let observer: ResizeObserver;

  const fallback = async () => {
    const replacement = canvas.cloneNode() as HTMLCanvasElement;
    canvas.replaceWith(replacement); observer.unobserve(canvas); canvas = replacement;
    const {createBootFallback} = await import('./console-boot-fallback');
    renderer = createBootFallback(canvas); observer.observe(canvas);
  };
  const load = () => loading ||= (async () => {
    try {
      const {createBootVfx} = await import('./console-boot-vfx');
      renderer = createBootVfx(canvas);
      canvas.addEventListener('webglcontextlost', event => {
        event.preventDefault(); renderer?.dispose(); renderer=null;
        void fallback();
      }, {once:true});
    } catch { await fallback(); }
    renderer?.draw(elapsed);
  })();

  function tick(now: number) {
    if (!running) return;
    elapsed = Math.max(0,audioClock ? audioClock() : (now-started)/1000);
    renderer?.draw(elapsed);
    canvas.dataset.time = elapsed.toFixed(3);
    const timeline = bootTimeline(elapsed);
    onFrame(timeline);
    if (timeline.done) { running=false; return; }
    frame=requestAnimationFrame(tick);
  }
  observer = new ResizeObserver(() => { renderer?.resize(); if (!running) renderer?.draw(elapsed); });
  observer.observe(canvas);
  return {
    prepare: load,
    start(reset = false, clock?: () => number) {
      if (reset) { elapsed=0; audioClock=clock || null; started=performance.now(); }
      if (running && !reset) return;
      cancelAnimationFrame(frame); running=true;
      frame=requestAnimationFrame(tick);
    },
    stop() { running=false;cancelAnimationFrame(frame); },
    drawStill() { if (!running) renderer?.draw(0); },
    get time() { return audioClock ? Math.max(0,audioClock()) : Math.max(0,(performance.now()-started)/1000); },
  };
}
