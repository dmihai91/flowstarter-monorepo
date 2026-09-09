// Brand Kit PDF — what a walk-away user keeps: logo direction, palette, copy
// doc. Generated with pdf-lib (no native deps, VPS/portable).
import 'server-only';
import { PDFDocument, StandardFonts, rgb, type RGB } from 'pdf-lib';
import type { SiteSpec } from '@flowstarter/build-engine';

function hexToRgb(hex: string): RGB {
  const m = hex.replace('#', '');
  const n = parseInt(m.length === 3 ? m.split('').map((c) => c + c).join('') : m, 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

export async function generateBrandKitPdf(spec: SiteSpec): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595, 842]); // A4
  const { height, width } = page.getSize();
  const margin = 56;
  let y = height - margin;

  const ink = hexToRgb(spec.brand.palette[2]);
  const accent = hexToRgb(spec.brand.palette[0]);
  const gray = rgb(0.45, 0.45, 0.5);

  const text = (
    s: string,
    opts: { size?: number; font?: typeof bold; color?: RGB; gap?: number; maxWidth?: number } = {},
  ) => {
    const size = opts.size ?? 11;
    const font = opts.font ?? regular;
    const maxWidth = opts.maxWidth ?? width - margin * 2;
    // naive word wrap
    const words = s.split(' ');
    let line = '';
    const lines: string[] = [];
    for (const w of words) {
      const probe = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(probe, size) > maxWidth && line) {
        lines.push(line);
        line = w;
      } else {
        line = probe;
      }
    }
    if (line) lines.push(line);
    for (const l of lines) {
      page.drawText(l, { x: margin, y, size, font, color: opts.color ?? ink });
      y -= size * 1.45;
    }
    y -= opts.gap ?? 6;
  };

  // Header
  page.drawRectangle({ x: 0, y: height - 8, width, height: 8, color: accent });
  text('FLOWSTARTER BRAND KIT', { size: 9, color: gray, gap: 14 });
  text(spec.brand.name, { size: 34, font: bold, gap: 2 });
  text(spec.brand.tagline, { size: 14, color: gray, gap: 18 });

  // Positioning
  text('POSITIONING', { size: 9, color: gray, gap: 2 });
  text(`“${spec.positioning}”`, { size: 13, font: bold, gap: 16 });

  // Palette swatches
  text('COLOR PALETTE', { size: 9, color: gray, gap: 4 });
  const sw = 70;
  spec.brand.palette.forEach((hex, i) => {
    const x = margin + i * (sw + 14);
    page.drawRectangle({ x, y: y - sw + 14, width: sw, height: sw - 14, color: hexToRgb(hex) });
    page.drawText(hex.toUpperCase(), { x, y: y - sw - 2, size: 8, font: regular, color: gray });
  });
  y -= sw + 24;

  // Voice
  text('VOICE', { size: 9, color: gray, gap: 2 });
  text(spec.brand.voice.join('  ·  '), { size: 12, font: bold, gap: 16 });

  // Logo direction
  text('LOGO DIRECTION', { size: 9, color: gray, gap: 2 });
  text(
    `Wordmark-first: “${spec.brand.name}” set in a strong modern sans, primary color ${spec.brand.palette[0]} on ${spec.brand.palette[3]}. Keep it simple — the palette and voice above carry the identity.`,
    { gap: 16 },
  );

  // Strategy
  text('STRATEGY', { size: 9, color: gray, gap: 4 });
  text(
    `Lead with the wedge above — own it in every headline. Voice stays ${spec.brand.voice
      .map((v) => v.toLowerCase())
      .join(', ')}: write like you talk to a customer at the counter, not like a brochure.`,
    { gap: 4 },
  );
  text(
    'Next steps: claim the matching domain and social handles, put the hero copy on every profile, and keep one clear call to action everywhere — the one below.',
    { gap: 14 },
  );

  // Copy doc
  text('HOMEPAGE COPY', { size: 9, color: gray, gap: 4 });
  text(spec.copy.hero, { size: 15, font: bold, gap: 2 });
  text(spec.copy.sub, { gap: 8 });
  for (const s of spec.copy.sections) {
    text(s.h, { size: 12, font: bold, gap: 0 });
    text(s.p, { gap: 6 });
  }
  text(`Call to action: ${spec.copy.cta}`, { font: bold, gap: 0 });

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
