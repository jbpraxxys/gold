/**
 * Broker Presentation Template v2 — Professional real estate presentation.
 * 
 * Improved styling with consistent branding, slide numbers, and footers.
 * Colors: Navy #1A4175, Maroon #941D28, Slate #475569
 */

import { z } from 'zod';
import { registerTemplate, type PresentationTemplate } from './registry.ts';

const NAVY = '1A4175';
const WHITE = 'FFFFFF';
const MAROON = '941D28';
const SLATE = '475569';
const LIGHT_BG = 'F8FAFC';
const FONT = 'Calibri';

// ─── Helpers ─────────────────────────────────────────────────────────

function esc(s: string): string { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// PPTX: add branded footer + slide number to every non-title slide
function addFooter(slide: any, pres: any, num: number): void {
  slide.addText('TopRealty AI • www.toprealty.ai', { x: 0.3, y: 6.8, w: 5, h: 0.3, fontSize: 8, color: '999999' });
  slide.addText(String(num), { x: 9, y: 6.8, w: 0.5, h: 0.3, fontSize: 8, color: '999999', align: 'right' });
}

// PPTX: navy heading bar at top
function pptxBar(slide: any, pres: any, title: string): void {
  slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.85, fill: { color: NAVY } });
  slide.addText(title, { x: 0.5, y: 0, w: '90%', h: 0.85, fontSize: 24, fontFace: FONT, bold: true, color: WHITE, valign: 'middle' });
}

// HTML: slide wrapper
function htmlSlide(content: string, num: number): string {
  return `<section class="slide"><div class="slide-num">${num}</div>${content}</section>`;
}

// ─── TITLE SLIDE ─────────────────────────────────────────────────────

const titleSlide = {
  id: 'broker:title',
  name: 'Title Slide',
  description: 'Opening slide. Required: property_name (e.g. "Uptown Parksuites"), price (e.g. "₱4M – ₱85M"). Optional: agent.',
  schema: z.object({
    property_name: z.string(),
    price: z.string(),
    agent: z.string().optional(),
    subtitle: z.string().optional(),
  }),
  renderHtml: (c: any) => htmlSlide(`
    <div class="title-slide">
      <div class="title-badge">PROPERTY PRESENTATION</div>
      <h1>${esc(c.property_name)}</h1>
      <p class="price-tag">${esc(c.price)}</p>
      ${c.subtitle ? `<p class="sub">${esc(c.subtitle)}</p>` : ''}
      ${c.agent ? `<p class="agent">${esc(c.agent)}</p>` : ''}
    </div>
  `, 1),
  renderPptx: (pres: any, c: any) => {
    const slide = pres.addSlide();
    slide.bkgd = NAVY;
    // Accent line
    slide.addShape(pres.ShapeType.rect, { x: 0.8, y: 2.8, w: 8.4, h: 0.03, fill: { color: WHITE } });
    slide.addText(c.property_name, { x: 0.8, y: 1.2, w: 8.4, h: 1.8, fontSize: 38, fontFace: FONT, bold: true, color: WHITE, align: 'center', valign: 'bottom' });
    slide.addText(c.price, { x: 0.8, y: 3.2, w: 8.4, h: 0.8, fontSize: 22, fontFace: FONT, color: WHITE, align: 'center', valign: 'top' });
    if (c.subtitle) slide.addText(c.subtitle, { x: 0.8, y: 4.2, w: 8.4, h: 0.6, fontSize: 16, fontFace: FONT, color: 'B0BEC5', align: 'center' });
    if (c.agent) slide.addText(c.agent, { x: 0.8, y: 5.5, w: 8.4, h: 0.4, fontSize: 12, fontFace: FONT, color: '90A4AE', align: 'center' });
  },
};

// ─── PROPERTY OVERVIEW ───────────────────────────────────────────────

const propertyOverview = {
  id: 'broker:property-overview',
  name: 'Property Overview',
  description: 'Main property slide. Required: property_name, specs (pipe-delimited table rows like "Location|BGC\\nPrice|₱4M"), highlights (bullet points, one per line).',
  schema: z.object({
    property_name: z.string(),
    specs: z.string(),
    highlights: z.string(),
  }),
  renderHtml: (c: any) => {
    const rows = c.specs.split('\n').filter(Boolean).map((r: string) => r.split('|').map((x: string) => x.trim()));
    return htmlSlide(`
      <div class="heading-bar">${esc(c.property_name)}</div>
      <div class="overview-layout"><div class="overview-table">
        ${rows.length ? `<table>${rows.map((r: string[], i: number) => `<tr>${r.map((cell: string) => i===0?`<th>${esc(cell)}</th>`:`<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</table>` : ''}
      </div><div class="overview-highlights"><h3>Key Highlights</h3><ul>${c.highlights.split('\n').filter(Boolean).map((l: string) => `<li>${esc(l)}</li>`).join('')}</ul></div></div>
    `, 2);
  },
  renderPptx: (pres: any, c: any) => {
    const slide = pres.addSlide();
    pptxBar(slide, pres, c.property_name);
    addFooter(slide, pres, 2);
    const rows = c.specs.split('\n').filter(Boolean).map((r: string) => r.split('|').map((x: string) => x.trim()));
    if (rows.length) slide.addTable(rows, { x: 0.4, y: 1.1, w: 5.5, border: { type: 'solid', color: 'D1D5DB' }, fontFace: FONT, fontSize: 10, autoPage: true });
    const bullets = c.highlights.split('\n').filter(Boolean).map((t: string) => ({ text: t, options: { bullet: { color: MAROON }, fontSize: 13, fontFace: FONT, breakLine: true, paraSpaceAfter: 6 } }));
    slide.addText(bullets, { x: 6.2, y: 1.1, w: 3.6, h: 5.5, valign: 'top' });
  },
};

// ─── COMPARISON ──────────────────────────────────────────────────────

const comparisonSlide = {
  id: 'broker:comparison',
  name: 'Property Comparison',
  description: 'Side-by-side comparison. Required: left_name, left_details, right_name, right_details. Details should be multi-line text with key specs.',
  schema: z.object({
    left_name: z.string(),
    left_details: z.string(),
    right_name: z.string(),
    right_details: z.string(),
  }),
  renderHtml: (c: any) => htmlSlide(`
    <h2 style="text-align:center;color:#${NAVY};margin:16px 0">Property Comparison</h2>
    <div class="columns"><div class="col"><h3>${esc(c.left_name)}</h3><p>${esc(c.left_details).replace(/\n/g,'<br>')}</p></div>
    <div class="col"><h3>${esc(c.right_name)}</h3><p>${esc(c.right_details).replace(/\n/g,'<br>')}</p></div></div>
  `, 3),
  renderPptx: (pres: any, c: any) => {
    const slide = pres.addSlide();
    addFooter(slide, pres, 3);
    const colW = 4.6;
    for (const [x, name, details] of [[0.4, c.left_name, c.left_details], [5.4, c.right_name, c.right_details]] as const) {
      slide.addShape(pres.ShapeType.rect, { x, y: 0.3, w: colW, h: 0.65, fill: { color: NAVY }, rectRadius: 0.04 });
      slide.addText(name, { x: x + 0.15, y: 0.3, w: colW - 0.3, h: 0.65, fontSize: 16, fontFace: FONT, bold: true, color: WHITE, valign: 'middle' });
      slide.addText(details, { x: x + 0.15, y: 1.1, w: colW - 0.3, h: 5.5, fontSize: 13, fontFace: FONT, color: SLATE, valign: 'top', lineSpacingMultiple: 1.3 });
    }
  },
};

// ─── INVESTMENT ──────────────────────────────────────────────────────

const investmentSlide = {
  id: 'broker:investment',
  name: 'Investment Highlights',
  description: 'ROI analysis slide. Required: property_name, price_range, rental_yield, appreciation, key_points (bullet text, one per line).',
  schema: z.object({
    property_name: z.string(),
    price_range: z.string(),
    rental_yield: z.string(),
    appreciation: z.string(),
    key_points: z.string(),
  }),
  renderHtml: (c: any) => htmlSlide(`
    <div class="heading-bar">${esc(c.property_name)}</div>
    <div class="metric-cards">
      <div class="metric"><span class="metric-label">Price Range</span><span class="metric-value">${esc(c.price_range)}</span></div>
      <div class="metric"><span class="metric-label">Rental Yield</span><span class="metric-value">${esc(c.rental_yield)}</span></div>
      <div class="metric"><span class="metric-label">Appreciation</span><span class="metric-value">${esc(c.appreciation)}</span></div>
    </div>
    <ul>${c.key_points.split('\n').filter(Boolean).map((l: string) => `<li>${esc(l)}</li>`).join('')}</ul>
  `, 4),
  renderPptx: (pres: any, c: any) => {
    const slide = pres.addSlide();
    pptxBar(slide, pres, c.property_name);
    addFooter(slide, pres, 4);
    // Metric cards
    const cards = [
      { label: 'Price Range', value: c.price_range },
      { label: 'Rental Yield', value: c.rental_yield },
      { label: 'Appreciation', value: c.appreciation },
    ];
    cards.forEach(({ label, value }, i) => {
      const x = 0.5 + i * 3.2;
      slide.addShape(pres.ShapeType.rect, { x, y: 1.2, w: 2.8, h: 1.6, fill: { color: LIGHT_BG }, rectRadius: 0.08, shadow: { type: 'outer', blur: 4, offset: 2, color: 'D1D5DB', opacity: 0.3 } });
      slide.addText(`${label}\n\n${value}`, { x, y: 1.2, w: 2.8, h: 1.6, fontSize: 10, fontFace: FONT, align: 'center', valign: 'middle', color: SLATE });
    });
    const bullets = c.key_points.split('\n').filter(Boolean).map((t: string) => ({ text: t, options: { bullet: { color: MAROON }, fontSize: 14, fontFace: FONT, breakLine: true, paraSpaceAfter: 8 } }));
    slide.addText(bullets, { x: 0.5, y: 3.2, w: 9, h: 3.5, valign: 'top' });
  },
};

// ─── END SLIDE ───────────────────────────────────────────────────────

const endSlide = {
  id: 'broker:end',
  name: 'Closing Slide',
  description: 'Thank you slide. Optional: message (default "Thank You"), agent.',
  schema: z.object({
    message: z.string().optional(),
    agent: z.string().optional(),
  }),
  renderHtml: (c: any) => htmlSlide(`
    <div class="title-slide"><h1>${esc(c.message || 'Thank You')}</h1>
    <p class="brand">TopRealty AI • www.toprealty.ai</p>
    ${c.agent ? `<p class="agent">${esc(c.agent)}</p>` : ''}</div>
  `, 99),
  renderPptx: (pres: any, c: any) => {
    const slide = pres.addSlide();
    slide.bkgd = NAVY;
    slide.addShape(pres.ShapeType.rect, { x: 1, y: 3, w: 8, h: 0.03, fill: { color: WHITE } });
    slide.addText(c.message || 'Thank You', { x: 0.5, y: 1.5, w: '90%', h: 1.5, fontSize: 42, fontFace: FONT, bold: true, color: WHITE, align: 'center', valign: 'bottom' });
    slide.addText('TopRealty AI • www.toprealty.ai', { x: 0.5, y: 3.5, w: '90%', h: 0.5, fontSize: 14, fontFace: FONT, color: '90A4AE', align: 'center' });
    if (c.agent) slide.addText(c.agent, { x: 0.5, y: 4.5, w: '90%', h: 0.4, fontSize: 12, fontFace: FONT, color: WHITE, align: 'center' });
  },
};

// ─── Register ────────────────────────────────────────────────────────

const brokerTemplate: PresentationTemplate = {
  id: 'toprealty-broker',
  name: 'TopRealty Broker Presentation',
  primaryColor: NAVY,
  layouts: [titleSlide, propertyOverview, comparisonSlide, investmentSlide, endSlide],
};

registerTemplate(brokerTemplate);
