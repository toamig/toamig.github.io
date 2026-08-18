import type { APIRoute, GetStaticPaths } from 'astro';
import satori from 'satori';
import { html } from 'satori-html';
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';
import events from '../../data/events.json';
import { ogCached } from '../../lib/og-cache';

interface LifeEvent {
  id: string;
  date: string;
  title: string;
  category?: string;
  tags?: string[];
  description?: string;
  images?: string[];
}

// Only generate OG images for events without photos — the rest use their first image.
const photolessEvents = (events as LifeEvent[]).filter(
  e => !Array.isArray(e.images) || e.images.length === 0,
);

export const getStaticPaths: GetStaticPaths = () =>
  photolessEvents.map(event => ({
    params: { id: event.id },
    props:  { event },
  }));

const TAG_META: Record<string, { name: string; color: string }> = {
  hobbies:      { name: 'Hobbies',       color: '#f9fbbf' },
  studies:      { name: 'Studies',       color: '#b8dcff' },
  personal:     { name: 'Personal',      color: '#f6c48a' },
  professional: { name: 'Professional',  color: '#cbc5ff' },
  travels:      { name: 'Travels',       color: '#c9f3b2' },
  work:         { name: 'Work & Career', color: '#cbc5ff' },
};

function getTags(e: LifeEvent): string[] {
  if (Array.isArray(e.tags)) return e.tags;
  if (e.category) return [e.category];
  return [];
}

function formatDate(dateString: string): string {
  if (!dateString) return '';
  const hasDay = /^\d{4}-\d{2}-\d{2}$/.test(dateString);
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString('en-US', hasDay
    ? { year: 'numeric', month: 'long', day: 'numeric' }
    : { year: 'numeric', month: 'long' });
}

const fontsDir = path.resolve('src/assets/fonts');
const fontRegular    = fs.readFileSync(path.join(fontsDir, 'Inter-Regular.ttf'));
const fontBold       = fs.readFileSync(path.join(fontsDir, 'Inter-Bold.ttf'));
const fontExtraBold  = fs.readFileSync(path.join(fontsDir, 'Inter-ExtraBold.ttf'));

export const GET: APIRoute = async ({ props }) => {
  const event = props.event as LifeEvent;
  const png = await ogCached(`event:${event.id}`, event, async () => {
    const tags  = getTags(event);
    const dateText = formatDate(event.date);
    const titleText = event.title || 'Untitled';
    const descText  = event.description || '';

    // Scale font size down if the title is long so it always fits two lines.
    const titleSize = titleText.length > 60 ? 64 : titleText.length > 40 ? 76 : 88;

    const escapeHtml = (s: string) =>
      String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const tagPills = tags.map(t => {
      const meta = TAG_META[t] || { name: t, color: '#dfe6e9' };
      return `<div style="display:flex;padding:10px 22px;border-radius:999px;background:${meta.color};color:#1a202c;font-size:20px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase">${escapeHtml(meta.name)}</div>`;
    }).join('');

    const descBlock = descText
      ? `<div style="display:flex;margin-top:28px;font-size:28px;line-height:1.35;color:#b8c5d6;font-weight:400;max-width:1040px">${escapeHtml(descText)}</div>`
      : '';

    const markupString = `
      <div style="width:1200px;height:630px;display:flex;flex-direction:column;padding:72px;background:linear-gradient(135deg,#0a1628 0%,#10233e 60%,#0f2040 100%);font-family:Inter;color:#ffffff;position:relative">
        <div style="position:absolute;top:0;left:0;width:8px;height:630px;background:linear-gradient(180deg,#3b97d3,#1d6fa0);display:flex"></div>
        <div style="display:flex;gap:12px;flex-wrap:wrap">${tagPills}</div>
        <div style="display:flex;flex-direction:column;margin-top:56px;flex-grow:1">
          <div style="display:flex;font-size:${titleSize}px;font-weight:800;line-height:1.05;letter-spacing:-0.02em;color:#ffffff;max-width:1040px">${escapeHtml(titleText)}</div>
          ${descBlock}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:32px;border-top:2px solid rgba(255,255,255,0.12)">
          <div style="display:flex;font-size:26px;font-weight:600;color:#3b97d3">${escapeHtml(dateText)}</div>
          <div style="display:flex;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.02em">toamig.com</div>
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

    return new Resvg(svg).render().asPng();
  });

  return new Response(png, {
    headers: {
      'Content-Type':  'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
