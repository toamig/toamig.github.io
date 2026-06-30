import type { APIRoute, GetStaticPaths } from 'astro';
import satori from 'satori';
import { html } from 'satori-html';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import pluginsData from '../../../data/plugins.json';

// LinkedIn banner spec: 1584x396 (4:1). Desktop profile photo overlays the
// bottom-left around x:60–290, y:240–396 — every layout below keeps the
// "live" content out of that box. Mobile crops differently (more central),
// so the right half also has to read as a complete composition on its own.

interface Plugin {
  name: string;
  tagline: string;
  domain?: string;
  version: string;
  logo: string;
  cover: string;
  accent: string;
  accentLight: string;
  status: string;
  docsUrl: string | null;
  hidden?: boolean;
}

const W = 1584;
const H = 396;

const plugins = (pluginsData as Plugin[]).filter(p => !p.hidden && p.docsUrl);

const VARIANTS = ['showcase', 'hero', 'split', 'inspire', 'inspire-bold', 'inspire-quiet'] as const;
type Variant = typeof VARIANTS[number];

export const getStaticPaths: GetStaticPaths = () =>
  VARIANTS.map(variant => ({ params: { variant }, props: { variant } }));

const fontsDir = path.resolve('src/assets/fonts');
const fontRegular   = fs.readFileSync(path.join(fontsDir, 'Inter-Regular.ttf'));
const fontBold      = fs.readFileSync(path.join(fontsDir, 'Inter-Bold.ttf'));
const fontExtraBold = fs.readFileSync(path.join(fontsDir, 'Inter-ExtraBold.ttf'));

const publicDir = path.resolve('public');
const logoCache = new Map<string, Promise<string | null>>();

function loadLogo(logoPath: string, size = 160): Promise<string | null> {
  const key = `${logoPath}@${size}`;
  const existing = logoCache.get(key);
  if (existing) return existing;
  const absPath = path.join(publicDir, logoPath.replace(/^\//, ''));
  const promise = sharp(absPath)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer()
    .then(buf => `data:image/png;base64,${buf.toString('base64')}`)
    .catch(err => {
      console.warn(`[linkedin] logo ${logoPath}: ${err.message ?? err}`);
      return null;
    });
  logoCache.set(key, promise);
  return promise;
}

// satori-html parses HTML, but `&` and `<` are not decoded back so we only
// escape the `<` that could break the parser. Site copy controls the rest.
const esc = (s: string) => String(s).replace(/</g, '&lt;');

interface LogoData { name: string; src: string; accent: string; accentLight: string; }

async function loadAllPluginLogos(size: number): Promise<LogoData[]> {
  const out: LogoData[] = [];
  for (const p of plugins) {
    const src = await loadLogo(p.logo, size);
    if (src) out.push({ name: p.name, src, accent: p.accent, accentLight: p.accentLight });
  }
  return out;
}

// --- Variant 1: Showcase --------------------------------------------------
// Identity text left-of-center (clear of avatar), plugin logos in a row on
// the right. Reads as "this is what I build" at a glance.
function showcaseMarkup(logos: LogoData[]): string {
  const logoSize = 96;
  const gap = 28;
  const tile = (l: LogoData) => `
    <div style="display:flex;flex-direction:column;align-items:center;width:${logoSize}px">
      <div style="display:flex;width:${logoSize}px;height:${logoSize}px;border-radius:20px;background:linear-gradient(160deg,${l.accent}55,${l.accent}11);border:1px solid ${l.accentLight}33;align-items:center;justify-content:center">
        <img src="${l.src}" style="width:${logoSize - 16}px;height:${logoSize - 16}px;object-fit:contain" />
      </div>
    </div>
  `;
  const logoRow = logos.map(tile).join(`<div style="display:flex;width:${gap}px"></div>`);

  return `
    <div style="width:${W}px;height:${H}px;display:flex;flex-direction:row;align-items:center;padding:0 64px 0 320px;background:linear-gradient(120deg,#06080d 0%,#0a1628 40%,#10233e 75%,#0f2040 100%);font-family:Inter;color:#ffffff;position:relative">
      <div style="position:absolute;top:0;left:0;width:8px;height:${H}px;background:linear-gradient(180deg,#5cb1e8,#3b97d3);display:flex"></div>

      <div style="display:flex;flex-direction:column;flex-grow:1;max-width:560px">
        <div style="display:flex;font-size:22px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#5cb1e8">Miguel "Toamig" Vieira</div>
        <div style="display:flex;margin-top:8px;font-size:54px;font-weight:800;line-height:1.05;letter-spacing:-0.02em;color:#ffffff">Lead Software Engineer</div>
        <div style="display:flex;margin-top:14px;font-size:22px;line-height:1.4;color:#b8c5d6;max-width:560px">Building UE5 plugins for combat, inventory, dialog, multiplayer, and world tooling.</div>
        <div style="display:flex;margin-top:18px;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:0.02em">migueltechlead.pt</div>
      </div>

      <div style="display:flex;flex-direction:row;align-items:center;margin-left:32px">
        ${logoRow}
      </div>
    </div>
  `;
}

// --- Variant 2: Hero identity --------------------------------------------
// Centered TOAMIG wordmark, no plugin imagery. Pure personal brand.
function heroMarkup(): string {
  return `
    <div style="width:${W}px;height:${H}px;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:0 64px 0 320px;background:linear-gradient(135deg,#0a1628 0%,#10233e 55%,#0f2040 100%);font-family:Inter;color:#ffffff;position:relative">
      <div style="position:absolute;top:0;left:0;width:8px;height:${H}px;background:linear-gradient(180deg,#5cb1e8,#3b97d3);display:flex"></div>

      <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center">
        <div style="display:flex;padding:8px 18px;border-radius:999px;background:#cbc5ff;color:#1a202c;font-size:16px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase">Game Developer</div>
        <div style="display:flex;padding:8px 18px;border-radius:999px;background:#b8dcff;color:#1a202c;font-size:16px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase">Lead Software Engineer</div>
      </div>

      <div style="display:flex;margin-top:18px;font-size:108px;font-weight:800;line-height:1;letter-spacing:-0.04em;color:#ffffff">TOAMIG</div>
      <div style="display:flex;margin-top:6px;font-size:24px;font-weight:600;color:#5cb1e8;letter-spacing:-0.01em">Miguel "Toamig" Vieira · migueltechlead.pt</div>
      <div style="display:flex;margin-top:14px;font-size:20px;line-height:1.35;color:#b8c5d6;max-width:900px;text-align:center">Software engineer specialized in game development and interactive systems.</div>
    </div>
  `;
}

// --- Variant 3: Split -----------------------------------------------------
// Identity in the right-of-center column, plugin tile grid on the far right.
// More graphic / product-forward than 1.
function splitMarkup(logos: LogoData[]): string {
  const tileSize = 132;
  const gap = 18;
  const tile = (l: LogoData) => `
    <div style="display:flex;width:${tileSize}px;height:${tileSize}px;border-radius:18px;background:linear-gradient(150deg,${l.accent}66,${l.accent}1a);border:1px solid ${l.accentLight}44;align-items:center;justify-content:center">
      <img src="${l.src}" style="width:${tileSize - 24}px;height:${tileSize - 24}px;object-fit:contain" />
    </div>
  `;
  // Two rows: 3 on top, 2 on bottom — keeps the grid balanced inside the slim banner.
  const top    = logos.slice(0, 3).map(tile).join(`<div style="display:flex;width:${gap}px"></div>`);
  const bottom = logos.slice(3, 5).map(tile).join(`<div style="display:flex;width:${gap}px"></div>`);

  return `
    <div style="width:${W}px;height:${H}px;display:flex;flex-direction:row;align-items:center;padding:0 56px 0 320px;background:linear-gradient(120deg,#06080d 0%,#0a1628 35%,#10233e 70%,#0f2040 100%);font-family:Inter;color:#ffffff;position:relative">
      <div style="position:absolute;top:0;left:0;width:8px;height:${H}px;background:linear-gradient(180deg,#5cb1e8,#3b97d3);display:flex"></div>

      <div style="display:flex;flex-direction:column;flex-grow:1;max-width:520px">
        <div style="display:flex;font-size:20px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#5cb1e8">Miguel "Toamig" Vieira</div>
        <div style="display:flex;margin-top:6px;font-size:48px;font-weight:800;line-height:1.05;letter-spacing:-0.02em;color:#ffffff">Game Tech · UE5</div>
        <div style="display:flex;margin-top:10px;font-size:20px;line-height:1.4;color:#b8c5d6;max-width:500px">Lead engineer shipping reusable plugins for Unreal Engine.</div>
        <div style="display:flex;margin-top:14px;font-size:17px;font-weight:700;color:#ffffff">migueltechlead.pt</div>
      </div>

      <div style="display:flex;flex-direction:column;align-items:flex-end;margin-left:32px">
        <div style="display:flex;flex-direction:row">${top}</div>
        <div style="display:flex;flex-direction:row;margin-top:${gap}px;margin-right:${(tileSize + gap) / 2}px">${bottom}</div>
      </div>
    </div>
  `;
}

// --- Inspirational variants ----------------------------------------------
// LinkedIn-as-CV reading: who I am over what I ship. Personal TOA logo is
// the visual anchor; plugins are a quiet supporting caption. Each variant
// shares the same content stack and differs only in background mood.

// LinkedIn spec (verified against PixExact / Hyperclapper banner guides):
//   Banner               : 1584 x 396
//   Profile-photo cover  : ~568 x 264 box, bottom-left → x:0..568, y:132..396.
//                          Treat everything inside that rectangle as hidden.
//   Mobile-safe text zone: central 1350 x 220 → x:117..1467, y:88..308.
//   Tight content zone   : x:317..1267 (recommended on every guide for text).
//
// The layout wraps the avatar with an L-shape:
//   TOP BAND  : y:24..104, full width above the avatar — eyebrow + monogram +
//               accent rule. Reads as a horizontal "name plate" that the
//               avatar visually slots into from below.
//   RIGHT BAND: x:600..1480, y:128..372 — hero / sub / plugins+URL stacked
//               with generous breathing room. Pushes past the conservative
//               SAFE_RIGHT (1267) but stays inside the mobile-safe x<=1467,
//               so the wider hero column doesn't get cropped on phones.
const AVATAR_LEFT   = 0;
const AVATAR_RIGHT  = 568;
const AVATAR_TOP    = 132;
const AVATAR_BOTTOM = 396;
const AVATAR_CX     = (AVATAR_LEFT + AVATAR_RIGHT) / 2;     // 284
const AVATAR_CY     = (AVATAR_TOP + AVATAR_BOTTOM) / 2;     // 264
const SAFE_LEFT     = 317;
const SAFE_RIGHT    = 1267;
const SAFE_TOP      = 88;

// Top band — horizontal "name plate" sitting above the avatar.
const EYEBROW_X     = 320;
const EYEBROW_Y     = 48;
const RULE_Y        = 98;       // accent rule shelves the avatar's top edge
const RULE_RIGHT    = 1460;
// Monogram anchors the right end of the top band, opposite the avatar.
const LOGO_X        = 1340;
const LOGO_Y        = 22;
const LOGO_W        = 116;
const LOGO_H        = 106;

// Right band — content column to the right of the avatar.
const CONTENT_LEFT  = 600;      // right of avatar (568) + breathing room
const CONTENT_RIGHT = 1480;     // mobile-safe right edge, gives ~880px width
const CONTENT_WIDTH = CONTENT_RIGHT - CONTENT_LEFT;
const HERO_Y        = 128;
const SUB_Y         = 252;
const ROW_Y         = 336;
const ACCENT_RULE_Y = RULE_Y;   // legacy alias kept for framing fn

const COPY = {
  eyebrow:  'MIGUEL "TOAMIG" VIEIRA  ·  GAME ENGINEER · TECH LEAD',
  hero:     'Designing systems. Solving problems. Chasing dreams.',
  sub:      'Drawn to the work behind the work: tooling, patterns, and tech direction that help teams ship without burning out.',
  building: 'CURRENTLY BUILDING',
  url:      'migueltechlead.pt',
};

// Personal monogram built inline so each path gets a flat colour fill —
// same treatment as the homepage Logo component (no outlines, fillable
// elements). Sharp rasterises the SVG so satori embeds a clean alpha PNG.
function personalLogoSvg(fill: string, accent: string = fill): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 689 633">
    <g transform="translate(0,633) scale(0.1,-0.1)" stroke="none">
      <path fill="${fill}" d="M507 4863 c-4 -3 -7 -152 -7 -330 l0 -323 335 0 335 0 0 -1332 0 -1333 330 330 330 330 0 1002 0 1003 999 0 1000 0 323 326 c178 179 325 327 327 330 2 2 -889 4 -1981 4 -1091 0 -1988 -3 -1991 -7z"/>
      <path fill="${fill}" d="M4227 4472 l-327 -327 -2 -1005 -3 -1005 -1000 -3 -1000 -2 -330 -330 -330 -330 1658 0 1657 0 0 335 0 335 392 -2 393 -3 123 -215 c68 -118 154 -267 191 -330 l67 -115 377 -3 c207 -1 377 0 377 3 0 2 -22 42 -49 87 -46 77 -1130 1958 -1218 2113 -22 39 -84 147 -138 240 -54 94 -130 226 -170 295 -40 69 -98 170 -130 225 -32 55 -91 158 -132 230 -41 71 -75 130 -76 132 -2 1 -150 -145 -330 -325z m375 -1064 c20 -35 104 -181 187 -325 83 -144 151 -267 151 -273 0 -6 -67 -10 -195 -10 l-195 0 0 335 c0 184 4 335 8 335 4 0 24 -28 44 -62z"/>
      <path fill="${accent}" d="M2898 3139 l-318 -324 317 -3 c174 -1 318 -1 320 1 2 2 2 149 1 327 l-3 323 -317 -324z"/>
    </g>
  </svg>`;
}

const personalLogoCache = new Map<string, Promise<string | null>>();

async function rasterizePersonalLogo(fill: string, accent: string, height: number): Promise<string | null> {
  const key = `${fill}|${accent}|${height}`;
  const existing = personalLogoCache.get(key);
  if (existing) return existing;

  const svg = personalLogoSvg(fill, accent);
  const width = Math.round(height * 689 / 633);
  const promise = sharp(Buffer.from(svg))
    .resize(width, height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer()
    .then(buf => `data:image/png;base64,${buf.toString('base64')}`)
    .catch(err => {
      console.warn(`[linkedin] personal logo: ${err.message ?? err}`);
      return null;
    });
  personalLogoCache.set(key, promise);
  return promise;
}

// Decoration that EMBRACES the avatar without being covered by it:
//   - A top "halo": radial glow whose center is just above the avatar's top
//     edge — only the upper crescent (y < AVATAR_TOP) is visible, framing
//     the avatar like a soft sunrise.
//   - A thin accent rule under the eyebrow that shelves the avatar's top
//     edge, tying the top band together as a name-plate.
// (Earlier revisions also drew orbit rings around the avatar; removed
// because they competed with the photo instead of framing it.)
function avatarFraming(_arcColor: string, glowColor: string, ruleColor: string): string {
  // Halo: large circle centered slightly above the avatar's top edge.
  const haloR = 240;
  const haloCY = AVATAR_TOP - 20;
  const halo = `<div style="display:flex;position:absolute;top:${haloCY - haloR}px;left:${AVATAR_CX - haloR}px;width:${haloR * 2}px;height:${haloR * 2}px;border-radius:9999px;background:radial-gradient(circle, ${glowColor} 0%, transparent 60%)"></div>`;

  // Horizontal accent rule under the eyebrow, just above the avatar top edge.
  const rule = `<div style="display:flex;position:absolute;top:${RULE_Y}px;left:${EYEBROW_X}px;width:${RULE_RIGHT - EYEBROW_X}px;height:1px;background:linear-gradient(90deg, transparent, ${ruleColor} 18%, ${ruleColor} 82%, transparent)"></div>`;

  return halo + rule;
}

function miniPluginRow(logos: LogoData[]): string {
  const size = 36;
  const gap = 14;
  const tile = (l: LogoData) => `
    <div style="display:flex;width:${size}px;height:${size}px;border-radius:10px;background:linear-gradient(150deg,${l.accent}55,${l.accent}11);border:1px solid ${l.accentLight}33;align-items:center;justify-content:center">
      <img src="${l.src}" style="width:${size - 8}px;height:${size - 8}px;object-fit:contain" />
    </div>
  `;
  return logos.map(tile).join(`<div style="display:flex;width:${gap}px"></div>`);
}

// Build the inspirational composition as an L-shape that wraps the avatar:
//
//   TOP BAND  (y:24..104, full width):
//     eyebrow — accent rule — TOA monogram
//     Reads as a horizontal name-plate the avatar slots into from below.
//
//   RIGHT BAND (x:600..1480, y:128..372):
//     hero (44px, 2 lines)
//     sub  (16px, 2 lines)
//     CURRENTLY BUILDING · plugins · URL (single bottom row)
//
// The monogram lives at the top-right end of the top band (not floating
// mid-banner), the hero column extends to x=1480 so it actually fills the
// space, and the bottom row plants the URL flush right as a signature.
function inspireMarkup(args: {
  background: string;
  decorations?: string;
  personalLogo: string | null;
  plugins: LogoData[];
  framing: string;
}): string {
  const { background, decorations = '', personalLogo, plugins, framing } = args;
  const pluginRow = miniPluginRow(plugins);

  const logoBlock = personalLogo
    ? `<img src="${personalLogo}" style="position:absolute;top:${LOGO_Y}px;left:${LOGO_X}px;width:${LOGO_W}px;height:${LOGO_H}px;object-fit:contain" />`
    : '';

  return `
    <div style="width:${W}px;height:${H}px;display:flex;font-family:Inter;color:#ffffff;position:relative;${background}">
      ${decorations}
      ${framing}
      <div style="position:absolute;top:0;left:0;width:6px;height:${H}px;background:linear-gradient(180deg,#5cb1e8,#3b97d3);display:flex"></div>
      ${logoBlock}

      <!-- TOP BAND: eyebrow + accent rule above the avatar -->
      <div style="position:absolute;top:${EYEBROW_Y}px;left:${EYEBROW_X}px;display:flex;font-size:15px;font-weight:700;letter-spacing:0.26em;color:#7fb6df">${esc(COPY.eyebrow)}</div>

      <!-- RIGHT BAND: hero / sub / meta, all clear of the avatar -->
      <div style="position:absolute;top:${HERO_Y}px;left:${CONTENT_LEFT}px;display:flex;font-size:44px;font-weight:800;line-height:1.1;letter-spacing:-0.02em;color:#ffffff;width:${CONTENT_WIDTH}px">${esc(COPY.hero)}</div>

      <div style="position:absolute;top:${SUB_Y}px;left:${CONTENT_LEFT}px;display:flex;font-size:16px;line-height:1.5;color:#b8c5d6;width:${CONTENT_WIDTH}px">${esc(COPY.sub)}</div>

      <!-- Bottom row: building label + plugin tiles on the left, URL flush right -->
      <div style="position:absolute;top:${ROW_Y}px;left:${CONTENT_LEFT}px;display:flex;flex-direction:row;align-items:center;width:${CONTENT_WIDTH}px">
        <div style="display:flex;font-size:11px;font-weight:700;letter-spacing:0.22em;color:#7fb6df;margin-right:14px">${esc(COPY.building)}</div>
        <div style="display:flex;flex-direction:row;align-items:center">${pluginRow}</div>
        <div style="display:flex;flex-grow:1"></div>
        <div style="display:flex;padding:6px 14px;border-radius:8px;background:rgba(127,182,223,0.10);border:1px solid rgba(127,182,223,0.32);font-size:14px;font-weight:700;color:#ffffff;letter-spacing:0.02em">${esc(COPY.url)}</div>
      </div>
    </div>
  `;
}

// Decoration helper: builds N small "constellation" dots with deterministic
// positions so the layout is stable run-to-run.
function constellation(points: Array<[number, number, number, string]>): string {
  return points.map(([x, y, size, color]) =>
    `<div style="display:flex;position:absolute;top:${y}px;left:${x}px;width:${size}px;height:${size}px;border-radius:9999px;background:${color}"></div>`
  ).join('');
}

function inspireAuroraBackground(): { background: string; decorations: string } {
  // Cool: aurora glow over the right half (balances avatar glow), scattered
  // dust only in the top half so it doesn't compete with the avatar photo.
  const background = `background:
    radial-gradient(ellipse at 78% 30%, rgba(92,177,232,0.18) 0%, transparent 55%),
    linear-gradient(135deg,#06080d 0%,#0a1628 50%,#0f2040 100%)`;
  // Dots live in the top strip (y<132) or right of avatar (x>600) only.
  const decorations = constellation([
    [340,  56, 3, 'rgba(180,210,235,0.45)'],
    [460,  90, 2, 'rgba(180,210,235,0.35)'],
    [720,  46, 2, 'rgba(180,210,235,0.35)'],
    [920,  64, 3, 'rgba(127,182,223,0.45)'],
    [1120, 40, 2, 'rgba(180,210,235,0.3)'],
    [1320, 70, 3, 'rgba(180,210,235,0.4)'],
    [1480, 110,2, 'rgba(180,210,235,0.35)'],
    [1380, 280,3, 'rgba(180,210,235,0.4)'],
    [1500, 220,2, 'rgba(180,210,235,0.3)'],
    [1200, 220,2, 'rgba(127,182,223,0.35)'],
  ]);
  return { background, decorations };
}

function inspireBoldBackground(): { background: string; decorations: string } {
  // Vivid: brighter base gradient and stronger right-side glow, nothing else.
  const background = `background:
    radial-gradient(ellipse at 78% 40%, rgba(92,177,232,0.26) 0%, transparent 55%),
    linear-gradient(120deg,#050810 0%,#0c1a30 50%,#142c52 100%)`;
  const decorations = '';
  return { background, decorations };
}

function inspireQuietBackground(): { background: string; decorations: string } {
  // Minimal: blueprint grid in the avatar zone, otherwise calm. No dots.
  const background = `background:
    radial-gradient(circle at 85% 40%, rgba(92,177,232,0.16) 0%, transparent 55%),
    repeating-linear-gradient(0deg,   transparent 0, transparent 40px, rgba(127,182,223,0.04) 40px, rgba(127,182,223,0.04) 41px),
    repeating-linear-gradient(90deg,  transparent 0, transparent 40px, rgba(127,182,223,0.04) 40px, rgba(127,182,223,0.04) 41px),
    linear-gradient(135deg,#06080d 0%,#0a1628 60%,#0c1c34 100%)`;
  // A single thin accent line as a graphic flourish.
  const decorations = `
    <div style="display:flex;position:absolute;top:50px;left:1180px;width:1px;height:296px;background:linear-gradient(180deg,transparent,rgba(127,182,223,0.4),transparent)"></div>
  `;
  return { background, decorations };
}

export const GET: APIRoute = async ({ props }) => {
  const variant = props.variant as Variant;

  let markupString: string;
  if (variant === 'hero') {
    markupString = heroMarkup();
  } else if (variant.startsWith('inspire')) {
    // Personal logo: flat white with a soft accent on the inner triangle —
    // mirrors the homepage rendering (no outlines, fillable shapes).
    const [pluginLogos, personalLogo] = await Promise.all([
      loadAllPluginLogos(96),
      rasterizePersonalLogo('#ffffff', '#5cb1e8', 272),
    ]);

    const bg =
      variant === 'inspire-bold'  ? inspireBoldBackground()  :
      variant === 'inspire-quiet' ? inspireQuietBackground() :
                                    inspireAuroraBackground();

    // Framing colors vary per variant so the arcs feel native to each mood.
    const framing =
      variant === 'inspire-bold'
        ? avatarFraming('rgba(146,200,236,0.32)', 'rgba(92,177,232,0.34)', 'rgba(127,182,223,0.40)')
      : variant === 'inspire-quiet'
        ? avatarFraming('rgba(127,182,223,0.20)', 'rgba(92,177,232,0.18)', 'rgba(127,182,223,0.28)')
        : avatarFraming('rgba(127,182,223,0.28)', 'rgba(92,177,232,0.24)', 'rgba(127,182,223,0.34)');

    markupString = inspireMarkup({
      background: bg.background,
      decorations: bg.decorations,
      personalLogo,
      plugins: pluginLogos,
      framing,
    });
  } else {
    const logos = await loadAllPluginLogos(variant === 'split' ? 192 : 144);
    markupString = variant === 'split' ? splitMarkup(logos) : showcaseMarkup(logos);
  }

  const markup = html(markupString);
  const svg = await satori(markup, {
    width: W,
    height: H,
    fonts: [
      { name: 'Inter', data: fontRegular,   weight: 400, style: 'normal' },
      { name: 'Inter', data: fontBold,      weight: 700, style: 'normal' },
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
