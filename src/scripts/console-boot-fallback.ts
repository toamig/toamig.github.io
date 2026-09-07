import { BOOT_BURST, smooth, type BootRenderer } from './console-boot-timeline';

/** A sprite-based version of the same depth field for devices without WebGL. */
export function createBootFallback(canvas: HTMLCanvasElement): BootRenderer {
  const ctx = canvas.getContext('2d');
  if (!ctx) return {draw() {},resize() {},dispose() {}};
  const sprites = ['122,176,246','238,200,131'].map(color => {
    const sprite = document.createElement('canvas'); sprite.width=128; sprite.height=128;
    const pen = sprite.getContext('2d')!;
    const glow = pen.createRadialGradient(64,64,0,64,64,64);
    glow.addColorStop(0,`rgba(${color},.7)`); glow.addColorStop(.35,`rgba(${color},.36)`);
    glow.addColorStop(.6,`rgba(${color},.18)`); glow.addColorStop(1,`rgba(${color},0)`);
    pen.fillStyle=glow; pen.fillRect(0,0,128,128);
    return sprite;
  });
  let seed=187;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const particles=Array.from({length:480},(_,i)=>({x:random()-.5,y:random()-.5,z:.5+random()*2.8,size:i%9===0?15+random()*45:1+random()*2.5,phase:random()*6.28}));
  let width=1,height=1;
  const resize=()=>{
    width=Math.max(1,canvas.clientWidth);height=Math.max(1,canvas.clientHeight);
    const ratio=Math.min(devicePixelRatio||1,1.5);
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);
  };
  resize(); canvas.dataset.renderer='canvas';
  return {
    draw(t) {
      ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.fillStyle='#000';ctx.fillRect(0,0,width,height);
      const field=smooth((t-4.75)/1.15),age=Math.max(0,t-BOOT_BURST),warm=smooth(age/.35),s=Math.min(width,height);
      if (!field) return;
      const halo=ctx.createRadialGradient(width/2,height/2,0,width/2,height/2,s*.85);
      halo.addColorStop(0,warm>.5?'#231e15':'#0d1d37');halo.addColorStop(1,'#000');
      ctx.globalAlpha=field;ctx.fillStyle=halo;ctx.fillRect(0,0,width,height);
      ctx.globalCompositeOperation='lighter';
      for (const p of particles) {
        const expansion=t<BOOT_BURST?1+(t-4.75)*.06:.2+(1-Math.exp(-age*4.2))*1.04;
        const x=width/2+(p.x*3.5+Math.sin(t*.15+p.phase)*.02)/p.z*s*expansion;
        const y=height/2+(p.y*2.3+Math.cos(t*.16+p.phase)*.02)/p.z*s*expansion;
        const r=p.size/Math.sqrt(p.z)*(s/900);
        ctx.globalAlpha=field*(.5+Math.sin(t+p.phase)*.15)*(1-warm);
        ctx.drawImage(sprites[0],x-r,y-r,r*2,r*2);
        ctx.globalAlpha=field*(.5+Math.sin(t+p.phase)*.15)*warm;
        ctx.drawImage(sprites[1],x-r,y-r,r*2,r*2);
      }
      if (t>=BOOT_BURST) {
        ctx.globalAlpha=Math.exp(-age*6)*.9;ctx.drawImage(sprites[1],width/2-s,height/2-s,s*2,s*2);
      }
      ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
    }, resize, dispose() {},
  };
}
