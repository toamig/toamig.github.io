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
    <div style="width:1200px;height:630px;display:flex;flex-direction:column;padding:80px;background:#ffffff;font-family:Inter;color:#0f172a;position:relative">
      <div style="position:absolute;top:0;left:0;width:1200px;height:6px;background:#0f172a;display:flex"></div>

      <div style="display:flex;align-items:center;gap:14px">
        <div style="display:flex;width:36px;height:36px;border-radius:8px;background:#0f172a;align-items:center;justify-content:center;color:#ffffff;font-size:18px;font-weight:800">M</div>
        <div style="display:flex;font-size:22px;font-weight:600;color:#0f172a;letter-spacing:-0.01em">Miguel Vieira</div>
      </div>

      <div style="display:flex;flex-direction:column;margin-top:48px;flex-grow:1">
        <div style="display:flex;padding:8px 18px;border-radius:999px;background:#f1f5f9;color:#475569;font-size:18px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;align-self:flex-start">UE5 Pre-Production Consulting</div>
        <div style="display:flex;font-size:76px;font-weight:800;line-height:1.05;letter-spacing:-0.03em;color:#0f172a;margin-top:32px;max-width:1040px">Start your UE5 project with architecture that scales.</div>
        <div style="display:flex;margin-top:28px;font-size:28px;line-height:1.4;color:#475569;font-weight:400;max-width:1000px">Gameplay architecture, pipelines, and reference implementations, defined in pre-production, so you don't pay for rewrites later.</div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:28px;border-top:1px solid #e2e8f0">
        <div style="display:flex;gap:24px;align-items:center">
          <div style="display:flex;font-size:20px;font-weight:600;color:#0f172a">Multiplayer</div>
          <div style="display:flex;font-size:20px;color:#cbd5e1">·</div>
          <div style="display:flex;font-size:20px;font-weight:600;color:#0f172a">Systems Design</div>
          <div style="display:flex;font-size:20px;color:#cbd5e1">·</div>
          <div style="display:flex;font-size:20px;font-weight:600;color:#0f172a">Standards & Pipelines</div>
        </div>
        <div style="display:flex;font-size:20px;font-weight:700;color:#0f172a;letter-spacing:0.02em">migueltechlead.pt</div>
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
