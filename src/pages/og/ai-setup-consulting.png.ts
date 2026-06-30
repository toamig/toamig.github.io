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
    <div style="width:1200px;height:630px;display:flex;flex-direction:column;padding:80px;background:#0a0a0b;font-family:Inter;color:#ededee;position:relative">
      <div style="position:absolute;top:0;left:0;width:1200px;height:630px;display:flex;background:radial-gradient(ellipse 60% 40% at 50% 0%, rgba(212,165,116,0.12), transparent 70%)"></div>
      <div style="position:absolute;top:0;left:0;width:6px;height:630px;display:flex;background:linear-gradient(180deg,#d4a574,#b8865a)"></div>

      <div style="display:flex;align-items:center;gap:14px;z-index:1">
        <div style="display:flex;width:36px;height:36px;border-radius:8px;background:rgba(212,165,116,0.15);border:1px solid rgba(212,165,116,0.4);align-items:center;justify-content:center;color:#d4a574;font-size:16px;font-weight:700">M</div>
        <div style="display:flex;font-size:22px;font-weight:600;color:#ededee;letter-spacing:-0.01em">Miguel Vieira</div>
      </div>

      <div style="display:flex;flex-direction:column;margin-top:56px;flex-grow:1;z-index:1">
        <div style="display:flex;padding:8px 16px;border-radius:999px;background:rgba(212,165,116,0.08);border:1px solid rgba(212,165,116,0.3);color:#d4a574;font-size:16px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;align-self:flex-start">AI Setup Consulting</div>

        <div style="display:flex;flex-direction:column;margin-top:36px">
          <div style="display:flex;font-size:88px;font-weight:800;line-height:1.02;letter-spacing:-0.035em;color:#ededee">AI setup,</div>
          <div style="display:flex;font-size:88px;font-weight:800;line-height:1.02;letter-spacing:-0.035em;color:#d4a574">built for game studios.</div>
        </div>

        <div style="display:flex;margin-top:32px;font-size:26px;line-height:1.4;color:#a3a3a8;font-weight:400;max-width:1000px">Claude Code, MCPs, and AI workflows for Unreal Engine teams, with guardrails for C++, Perforce, and proprietary IP.</div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:28px;border-top:1px solid #26262c;z-index:1">
        <div style="display:flex;gap:20px;align-items:center">
          <div style="display:flex;font-size:18px;color:#a3a3a8">UE4 / UE5</div>
          <div style="display:flex;font-size:18px;color:#33333a">·</div>
          <div style="display:flex;font-size:18px;color:#a3a3a8">Perforce-native</div>
          <div style="display:flex;font-size:18px;color:#33333a">·</div>
          <div style="display:flex;font-size:18px;color:#a3a3a8">Privacy-first</div>
        </div>
        <div style="display:flex;font-size:20px;font-weight:700;color:#ededee;letter-spacing:0.02em">migueltechlead.pt</div>
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
