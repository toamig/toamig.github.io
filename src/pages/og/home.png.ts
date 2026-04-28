import type { APIRoute } from 'astro';
import satori from 'satori';
import { html } from 'satori-html';
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';

const fontsDir = path.resolve('src/assets/fonts');
const fontRegular   = fs.readFileSync(path.join(fontsDir, 'Inter-Regular.ttf'));
const fontBold      = fs.readFileSync(path.join(fontsDir, 'Inter-Bold.ttf'));
const fontExtraBold = fs.readFileSync(path.join(fontsDir, 'Inter-ExtraBold.ttf'));

export const GET: APIRoute = async () => {
  const markupString = `
    <div style="width:1200px;height:630px;display:flex;flex-direction:column;padding:72px;background:linear-gradient(135deg,#0a1628 0%,#10233e 60%,#0f2040 100%);font-family:Inter;color:#ffffff;position:relative">
      <div style="position:absolute;top:0;left:0;width:8px;height:630px;background:linear-gradient(180deg,#3b97d3,#1d6fa0);display:flex"></div>

      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <div style="display:flex;padding:10px 22px;border-radius:999px;background:#cbc5ff;color:#1a202c;font-size:20px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase">Game Developer</div>
        <div style="display:flex;padding:10px 22px;border-radius:999px;background:#b8dcff;color:#1a202c;font-size:20px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase">Lead Software Engineer</div>
      </div>

      <div style="display:flex;flex-direction:column;margin-top:56px;flex-grow:1">
        <div style="display:flex;font-size:120px;font-weight:800;line-height:1;letter-spacing:-0.04em;color:#ffffff">TOAMIG</div>
        <div style="display:flex;margin-top:18px;font-size:36px;font-weight:600;color:#3b97d3;letter-spacing:-0.01em">Miguel "Toamig" Vieira</div>
        <div style="display:flex;margin-top:32px;font-size:30px;line-height:1.35;color:#b8c5d6;font-weight:400;max-width:1040px">Software engineer specialized in game development and interactive systems.</div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:32px;border-top:2px solid rgba(255,255,255,0.12)">
        <div style="display:flex;font-size:26px;font-weight:600;color:#3b97d3">Projects · Skills · Experience</div>
        <div style="display:flex;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.02em">migueltechlead.pt</div>
      </div>
    </div>
  `;

  const markup = html(markupString);

  const svg = await satori(markup, {
    width:  1200,
    height: 630,
    fonts: [
      { name: 'Inter', data: fontRegular,   weight: 400, style: 'normal' },
      { name: 'Inter', data: fontBold,      weight: 700, style: 'normal' },
      { name: 'Inter', data: fontExtraBold, weight: 800, style: 'normal' },
    ],
  });

  const png = new Resvg(svg).render().asPng();

  return new Response(png, {
    headers: {
      'Content-Type':  'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
