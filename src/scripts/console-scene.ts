/** Flowing silk light and depth particles behind the menu. */
export function createScene(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d');
  if (!context) return { start(_reset = false) {}, stop() {}, drawStill() {} };
  const ctx = context;
  let width = 0, height = 0, frame = 0, running = false, started = 0, elapsed = 0, lastFrame = 0;
  const points = Array.from({length: 52}, (_, i) => ({
    x: ((i * 73.319) % 100) / 100, y: ((i * 37.717) % 100) / 100,
    size: .35 + (i % 7) * .22, speed: .15 + (i % 5) * .16, phase: i * 2.399,
  }));

  function draw(seconds: number) {
    if (!width || !height) return;
    ctx.clearRect(0, 0, width, height);
    const peak = .1;
    const glow = ctx.createRadialGradient(width * .56, height * .5, 0, width * .56, height * .5, width * .6);
    glow.addColorStop(0, `rgba(140,185,218,${.035 + peak * .16})`);
    glow.addColorStop(.5, '#315d8c14');
    glow.addColorStop(1, '#10213900');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 55; i++) {
      const spread = i / 55;
      const gold = i > 41;
      const alpha = gold ? .02 + peak * .05 : .015 + peak * .02;
      const gradient = ctx.createLinearGradient(0, height * .7, width, height * .35);
      gradient.addColorStop(0, '#7bc8ff00');
      gradient.addColorStop(.38, `rgba(${gold ? '216,187,135' : '130,190,238'},${alpha})`);
      gradient.addColorStop(.74, `rgba(${gold ? '231,211,159' : '158,215,255'},${alpha * 2})`);
      gradient.addColorStop(1, '#a1c7ff00');
      ctx.strokeStyle = gradient;
      ctx.lineWidth = gold ? .7 : 1.15;
      ctx.beginPath();
      for (let step = 0; step <= 80; step++) {
        const u = step / 80;
        const x = u * width;
        const wave = Math.sin(u * 5.1 + seconds * .13 + spread * .65);
        const y = height * (.57 + wave * .135 + Math.sin(u * 3.1 - seconds * .08) * spread * .18 - spread * .08);
        if (!step) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    for (const p of points) {
      const x = p.x * width;
      const y = p.y * height + Math.sin(seconds * p.speed + p.phase) * 13;
      const alpha = .11 + (Math.sin(seconds * .5 + p.phase) + 1) * .15 + peak * .22;
      const size = p.size * (1 + peak * .8);
      ctx.fillStyle = `rgba(${p.size > 1.1 ? '226,207,166' : '187,218,247'},${alpha})`;
      ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
      if (size > 1.4) {
        const halo = ctx.createRadialGradient(x, y, 0, x, y, size * 7);
        halo.addColorStop(0, `rgba(224,221,195,${alpha * .2})`); halo.addColorStop(1, '#becde000');
        ctx.fillStyle = halo; ctx.fillRect(x - 15, y - 15, 30, 30);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  function resize() {
    width = canvas.clientWidth; height = canvas.clientHeight;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (!running) draw(elapsed);
  }
  function tick(now: number) {
    if (!running) return;
    if (now - lastFrame >= 32) { elapsed = (now - started) / 1000; draw(elapsed); lastFrame = now; }
    frame = requestAnimationFrame(tick);
  }
  new ResizeObserver(resize).observe(canvas);
  resize();
  return {
    start(reset = false) { if (reset) elapsed = 0; if (running && !reset) return; cancelAnimationFrame(frame); running = true; started = performance.now() - elapsed * 1000; frame = requestAnimationFrame(tick); },
    stop() { running = false; cancelAnimationFrame(frame); },
    drawStill() { draw(0); },
  };
}
