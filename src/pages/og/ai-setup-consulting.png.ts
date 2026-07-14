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
    <div style="width:1200px;height:630px;display:flex;flex-direction:column;padding:80px;background:#F5F0E8;font-family:Inter;color:#1a1a1a;position:relative">
      <div style="position:absolute;top:0;left:0;width:1200px;height:630px;display:flex;background:radial-gradient(ellipse 55% 45% at 50% 0%, rgba(184,74,43,0.12), transparent 65%)"></div>
      <div style="position:absolute;top:0;left:0;width:6px;height:630px;display:flex;background:linear-gradient(180deg,#B84A2B,#9A3D22)"></div>

      <div style="display:flex;align-items:center;gap:14px;z-index:1">
        <div style="display:flex;width:36px;height:36px;border-radius:8px;background:rgba(184,74,43,0.10);border:1px solid rgba(184,74,43,0.35);align-items:center;justify-content:center;color:#B84A2B;font-size:16px;font-weight:700">M</div>
        <div style="display:flex;font-size:22px;font-weight:600;color:#1a1a1a;letter-spacing:-0.01em">Miguel Vieira</div>
      </div>

      <div style="display:flex;flex-direction:column;margin-top:56px;flex-grow:1;z-index:1">
        <div style="display:flex;padding:8px 16px;border-radius:999px;background:rgba(184,74,43,0.08);border:1px solid rgba(184,74,43,0.35);color:#B84A2B;font-size:16px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;align-self:flex-start">AI Setup Consulting</div>

        <div style="display:flex;flex-direction:column;margin-top:36px">
          <div style="display:flex;font-size:82px;font-weight:800;line-height:1.02;letter-spacing:-0.035em;color:#1a1a1a">AI infrastructure,</div>
          <div style="display:flex;font-size:82px;font-weight:800;line-height:1.02;letter-spacing:-0.035em;color:#B84A2B">engineered for game studios.</div>
        </div>

        <div style="display:flex;margin-top:32px;font-size:24px;line-height:1.4;color:#55514a;font-weight:400;max-width:1040px">A governed knowledge layer and a layered pipeline that make AI adoption safe, consistent, and measurable — with the AI stack your studio chooses.</div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:28px;border-top:1px solid #DED5C4;z-index:1">
        <div style="display:flex;gap:20px;align-items:center">
          <div style="display:flex;font-size:18px;color:#55514a">UE4 / UE5</div>
          <div style="display:flex;font-size:18px;color:#C6BCA5">·</div>
          <div style="display:flex;font-size:18px;color:#55514a">Perforce-native</div>
          <div style="display:flex;font-size:18px;color:#C6BCA5">·</div>
          <div style="display:flex;font-size:18px;color:#55514a">Model-agnostic</div>
        </div>
        <div style="display:flex;font-size:20px;font-weight:700;color:#1a1a1a;letter-spacing:0.02em">toamig.com</div>
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
