import type { APIRoute, GetStaticPaths } from 'astro';
import satori from 'satori';
import { html } from 'satori-html';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import pluginsData from '../../../data/plugins.json';

interface Plugin {
  name: string;
  tagline: string;
  domain?: string;
  version: string;
  logo: string;
  cover: string;
  accent: string;
  accentLight: string;
  status: 'live' | 'pre-launch' | 'in-development' | 'coming-soon';
  docsUrl: string | null;
  hidden?: boolean;
}

const STATUS_META: Record<Plugin['status'], { label: string; color: string }> = {
  'live':           { label: 'Live on Fab',    color: '#22c55e' },
  'pre-launch':     { label: 'Pre-Launch',     color: '#f59e0b' },
  'in-development': { label: 'In Development', color: '#94a3b8' },
  'coming-soon':    { label: 'Coming Soon',    color: '#8b5cf6' },
};

function slugFromDocsUrl(u: string | null): string | null {
  if (!u) return null;
  const parts = u.split('/').filter(Boolean);
  return parts[parts.length - 1] || null;
}

const plugins = (pluginsData as Plugin[]).filter(p => !p.hidden && p.docsUrl);

export const getStaticPaths: GetStaticPaths = () =>
  plugins
    .map(plugin => ({ slug: slugFromDocsUrl(plugin.docsUrl), plugin }))
    .filter((x): x is { slug: string; plugin: Plugin } => !!x.slug)
    .map(({ slug, plugin }) => ({
      params: { slug },
      props:  { plugin },
    }));

const fontsDir = path.resolve('src/assets/fonts');
const fontRegular   = fs.readFileSync(path.join(fontsDir, 'Inter-Regular.ttf'));
const fontBold      = fs.readFileSync(path.join(fontsDir, 'Inter-Bold.ttf'));
const fontExtraBold = fs.readFileSync(path.join(fontsDir, 'Inter-ExtraBold.ttf'));

const publicDir = path.resolve('public');

// Downscale source plugin logos (1.3–2.8 MB at full res) to a satori-friendly
// 256px PNG and embed as a data URL. Caches per-build so multiple cards using
// the same logo only do the sharp work once.
const logoCache = new Map<string, Promise<string | null>>();

function loadLogoDataUrl(logoPath: string | undefined): Promise<string | null> {
  if (!logoPath) return Promise.resolve(null);
  const existing = logoCache.get(logoPath);
  if (existing) return existing;

  const absPath = path.join(publicDir, logoPath.replace(/^\//, ''));
  const promise = sharp(absPath)
    .resize(256, 256, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toBuffer()
    .then(buf => `data:image/png;base64,${buf.toString('base64')}`)
    .catch(err => {
      console.warn(`[og:plugins] could not load logo ${logoPath}: ${err.message ?? err}`);
      return null;
    });

  logoCache.set(logoPath, promise);
  return promise;
}

// Plugin data is build-time JSON we control. We only need to neutralise `<`
// so a stray glyph can't break the satori-html parser; `&` is left literal
// because satori-html does not decode HTML entities back to characters.
const escapeForSatori = (s: string) => String(s).replace(/</g, '&lt;');

export const GET: APIRoute = async ({ props }) => {
  const plugin = props.plugin as Plugin;

  const accent      = plugin.accent      || '#3b97d3';
  const accentLight = plugin.accentLight || '#5cb1e8';

  const titleText = plugin.name || 'Plugin';
  const taglineRaw = plugin.tagline || '';
  const tagline = taglineRaw.length > 200
    ? taglineRaw.slice(0, 197).trimEnd() + '…'
    : taglineRaw;

  const domain  = plugin.domain || 'UE5 Plugin';
  const status  = STATUS_META[plugin.status];
  const version = plugin.version || '';

  const logoDataUrl = await loadLogoDataUrl(plugin.logo);

  // Layout math: card 1200px, padding 72px each side, logo 220px + 48px gap.
  // That leaves ~788px for text. Satori wraps text inside a flex element
  // when `max-width` is set on the text element itself — width on a parent
  // flex column is not enough. Cap conservatively for kerning slack.
  const textColumnWidth = logoDataUrl ? 720 : 1040;

  const titleSize = titleText.length > 18 ? 60 : titleText.length > 12 ? 72 : 84;
  const taglineSize = tagline.length > 140 ? 22 : tagline.length > 100 ? 24 : 26;

  const domainPill = `<div style="display:flex;padding:10px 22px;border-radius:999px;background:${accentLight};color:#0a0e15;font-size:20px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase">${escapeForSatori(domain)}</div>`;
  const statusPill = status
    ? `<div style="display:flex;padding:10px 22px;border-radius:999px;background:${status.color};color:#0a0e15;font-size:20px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase">${escapeForSatori(status.label)}</div>`
    : '';

  const taglineBlock = tagline
    ? `<div style="display:flex;margin-top:20px;font-size:${taglineSize}px;line-height:1.4;color:#b8c5d6;font-weight:400;max-width:${textColumnWidth}px">${escapeForSatori(tagline)}</div>`
    : '';

  // satori requires image dimensions in `style`, not as HTML attributes,
  // otherwise it logs `Invalid value "220" for "width"` warnings.
  const logoBlock = logoDataUrl
    ? `<div style="display:flex;flex-shrink:0;width:220px;height:220px;margin-right:48px;align-items:center;justify-content:center"><img src="${logoDataUrl}" style="width:220px;height:220px;object-fit:contain" /></div>`
    : '';

  // Background composition:
  //   - Base diagonal: flat dark, no accent tint anywhere. Warm accents
  //     (orange/gold) at low alpha were still creating a visible "beam"
  //     across the middle of the card that fought the tagline.
  //   - Top-right radial: the ONLY accent wash, contained to the corner
  //     above the title. Keeps each plugin visually distinct without
  //     bleeding into the text or URL areas.
  //   - Bottom vignette: darkens the band under the URL row so white
  //     text always reads, regardless of accent.
  // The accent identity is carried by the left bar, the domain pill,
  // the top-right glow, and the accent-coloured "UE5 Plugin · v" line.
  const markupString = `
    <div style="width:1200px;height:630px;display:flex;flex-direction:column;padding:56px 72px;background:linear-gradient(135deg,#06080d 0%,#0a0d14 60%,#0c1018 100%);font-family:Inter;color:#ffffff;position:relative">
      <div style="position:absolute;top:0;left:0;width:8px;height:630px;background:linear-gradient(180deg,${accentLight},${accent});display:flex"></div>
      <div style="position:absolute;top:0;right:0;width:620px;height:360px;background:radial-gradient(ellipse at 95% 5%, ${accent}26 0%, transparent 65%);display:flex"></div>
      <div style="position:absolute;left:0;right:0;bottom:0;height:200px;background:linear-gradient(180deg, transparent 0%, rgba(4,6,10,0.55) 60%, rgba(4,6,10,0.85) 100%);display:flex"></div>

      <div style="display:flex;gap:12px;flex-wrap:wrap">
        ${domainPill}
        ${statusPill}
      </div>

      <div style="display:flex;flex-direction:row;align-items:center;margin-top:36px;flex-grow:1">
        ${logoBlock}
        <div style="display:flex;flex-direction:column">
          <div style="display:flex;font-size:${titleSize}px;font-weight:800;line-height:1.05;letter-spacing:-0.02em;color:#ffffff;max-width:${textColumnWidth}px">${escapeForSatori(titleText)}</div>
          ${taglineBlock}
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:24px;border-top:2px solid rgba(255,255,255,0.18)">
        <div style="display:flex;font-size:24px;font-weight:600;color:${accentLight}">Unreal Engine 5 Plugin${version ? ' · v' + escapeForSatori(version) : ''}</div>
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
