import type { APIRoute } from 'astro';
import satori from 'satori';
import { html } from 'satori-html';
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';

const W = 1200;
const H = 630;
const fontsDir = path.resolve('src/assets/fonts');
const publicDir = path.resolve('public');
const fontRegular = fs.readFileSync(path.join(fontsDir, 'Inter-Regular.ttf'));
const fontBold = fs.readFileSync(path.join(fontsDir, 'Inter-Bold.ttf'));
const fontExtraBold = fs.readFileSync(path.join(fontsDir, 'Inter-ExtraBold.ttf'));
const heroLogoSvg = fs
  .readFileSync(path.join(publicDir, 'logo_head.svg'), 'utf8')
  .replaceAll('fill: black', 'fill: #ffffff');
const heroLogo = `data:image/png;base64,${Buffer.from(new Resvg(heroLogoSvg, {
  fitTo: { mode: 'width', value: 168 },
}).render().asPng()).toString('base64')}`;

interface ConstellationNode {
  x: number;
  y: number;
  size: number;
  coral: boolean;
}

function createRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function createConstellationImage() {
  const random = createRandom(0x544f414d);
  const linkDistance = 130;
  const nodeCount = Math.round(Math.min(130, Math.max(50, (W * H) / 13000)));
  const nodes: ConstellationNode[] = Array.from({ length: nodeCount }, () => ({
    x: random() * W,
    y: random() * H,
    size: 2.2 + random() * 2.6,
    coral: random() < 0.1,
  }));
  const lines: string[] = [];
  const glows: string[] = [];
  const points: string[] = [];

  for (let index = 0; index < nodes.length; index++) {
    const from = nodes[index];
    const color = from.coral ? '#ff9e5c' : '#a8d1f2';
    const nodeAlpha = from.coral ? 0.85 : 0.55;
    glows.push(`<circle cx="${from.x.toFixed(1)}" cy="${from.y.toFixed(1)}" r="${(from.size * 3.6).toFixed(1)}" fill="${color}" fill-opacity="${(nodeAlpha * 0.14).toFixed(3)}" filter="url(#glow)" />`);
    points.push(`<circle cx="${from.x.toFixed(1)}" cy="${from.y.toFixed(1)}" r="${(from.size * 0.68).toFixed(1)}" fill="${color}" fill-opacity="${nodeAlpha}" />`);

    for (let nextIndex = index + 1; nextIndex < nodes.length; nextIndex++) {
      const to = nodes[nextIndex];
      const distance = Math.hypot(from.x - to.x, from.y - to.y);
      if (distance > linkDistance) continue;
      const color = from.coral || to.coral ? '#ff9e5c' : '#a8d1f2';
      const opacity = (1 - distance / linkDistance) * 0.14;
      lines.push(`<line x1="${from.x.toFixed(1)}" y1="${from.y.toFixed(1)}" x2="${to.x.toFixed(1)}" y2="${to.y.toFixed(1)}" stroke="${color}" stroke-opacity="${opacity.toFixed(3)}" stroke-width="1" />`);
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <filter id="glow" x="-200%" y="-200%" width="400%" height="400%"><feGaussianBlur stdDeviation="2.6" /></filter>
    </defs>
    ${lines.join('')}
    ${glows.join('')}
    ${points.join('')}
  </svg>`;
  const png = new Resvg(svg).render().asPng();
  return `data:image/png;base64,${Buffer.from(png).toString('base64')}`;
}

const heroConstellation = createConstellationImage();

const markupString = `
  <div style="width:${W}px;height:${H}px;display:flex;position:relative;overflow:hidden;background:linear-gradient(130deg,#0a1628 0%,#0c1b30 48%,#10233e 100%);font-family:Inter;color:#ffffff">
    <div style="position:absolute;inset:-120px -80px auto -120px;width:680px;height:520px;background:radial-gradient(ellipse at 42% 50%,rgba(255,138,76,0.15) 0%,rgba(255,138,76,0.05) 28%,rgba(255,138,76,0) 70%);display:flex"></div>
    <div style="position:absolute;right:-160px;bottom:-220px;width:740px;height:640px;background:radial-gradient(ellipse at 48% 42%,rgba(59,151,211,0.22) 0%,rgba(59,151,211,0.06) 35%,rgba(59,151,211,0) 70%);display:flex"></div>
    <img src="${heroConstellation}" style="position:absolute;top:0;left:0;width:${W}px;height:${H}px;object-fit:cover" />

    <div style="position:absolute;top:58px;left:0;width:${W}px;display:flex;justify-content:center">
      <div style="display:flex;align-items:center;gap:12px;padding:8px 16px 8px 13px;border:1px solid rgba(255,255,255,0.14);border-radius:999px;background:rgba(10,22,40,0.42);font-size:14px;font-weight:600;letter-spacing:0.13em;color:rgba(255,255,255,0.68)">
        <div style="display:flex;width:8px;height:8px;border-radius:999px;background:#ff8a4c;box-shadow:0 0 14px rgba(255,138,76,0.7)"></div>
        <div style="display:flex;color:#ffb18a">CURRENT</div>
        <div style="display:flex;color:rgba(255,255,255,0.26)">/</div>
        <div style="display:flex;color:rgba(255,255,255,0.92)">LEAD SOFTWARE ENGINEER</div>
        <div style="display:flex;color:rgba(255,255,255,0.26)">·</div>
        <div style="display:flex">SIDE</div>
      </div>
    </div>

    <div style="position:absolute;top:132px;left:0;width:${W}px;display:flex;align-items:center;justify-content:center;gap:28px">
      <img src="${heroLogo}" style="width:132px;height:121px;object-fit:contain" />
      <div style="display:flex;font-size:116px;font-weight:800;line-height:0.9;letter-spacing:-0.055em;color:#ffffff">TOAMIG</div>
    </div>

    <div style="position:absolute;top:324px;left:0;width:${W}px;display:flex;flex-direction:column;align-items:center">
      <div style="display:flex;font-size:54px;font-weight:400;line-height:1.13;letter-spacing:-0.025em;color:rgba(255,255,255,0.88)">I lead the engineering</div>
      <div style="display:flex;align-items:baseline;gap:14px;margin-top:4px;font-size:58px;font-weight:400;line-height:1.08;letter-spacing:-0.03em;color:rgba(255,255,255,0.88)">
        <div style="display:flex">behind</div>
        <div style="position:relative;display:flex;font-style:italic;font-weight:700;color:#ffffff">games.<div style="position:absolute;left:0;right:0;bottom:-5px;height:7px;border-radius:2px;background:#ff8a4c;display:flex"></div></div>
      </div>
    </div>

    <div style="position:absolute;bottom:62px;left:0;width:${W}px;display:flex;justify-content:center;font-size:15px;font-weight:600;letter-spacing:0.15em;color:rgba(255,255,255,0.48)">GAMEPLAY · MULTIPLAYER · TOOLS · ANIMATION · AI · LEADERSHIP</div>
  </div>
`;

export const GET: APIRoute = async () => {
  const markup = html(markupString);
  const svg = await satori(markup, {
    width: W,
    height: H,
    fonts: [
      { name: 'Inter', data: fontRegular, weight: 400, style: 'normal' },
      { name: 'Inter', data: fontBold, weight: 700, style: 'normal' },
      { name: 'Inter', data: fontExtraBold, weight: 800, style: 'normal' },
    ],
  });
  const png = new Resvg(svg).render().asPng();

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
