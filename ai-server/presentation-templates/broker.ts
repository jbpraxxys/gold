/**
 * Broker Presentation Template — Real estate agent presentation.
 * 
 * Slide layouts tailored for Philippine real estate broker presentations.
 * Each layout has a strict schema that tells the AI exactly what to provide.
 */

import { z } from 'zod';
import { registerTemplate, type PresentationTemplate } from './registry.ts';

const NAVY = '1A4175';
const WHITE = 'FFFFFF';
const MAROON = '941D28';

// ─── HTML Renderers ──────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function htmlSlide(content: string, num: number): string {
  return `<section class="slide">
    <div class="slide-num">${num}</div>
    ${content}
  </section>`;
}

// ─── PPTX Renderers ──────────────────────────────────────────────────

function pptxHeadingBar(slide: any, pres: any, title: string): void {
  slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.9, fill: { color: NAVY } });
  slide.addText(title, { x: 0.6, y: 0, w: '90%', h: 0.9, fontSize: 28, bold: true, color: WHITE, valign: 'middle' });
}

// ─── Layouts ─────────────────────────────────────────────────────────

const titleSlide = {
  id: 'broker:title',
  name: 'Title Slide',
  description: 'Opening slide with property name, price, and agent contact. Use as the first slide.',
  schema: z.object({
    property_name: z.string().describe('Property name, e.g., "Uptown Parksuites by Megaworld"'),
    price: z.string().describe('Price range, e.g., "₱4M – ₱85M"'),
    agent: z.string().optional().describe('Agent name and contact'),
  }),
  renderHtml: (c: any) => htmlSlide(`
    <div class="title-slide"><h1>${esc(c.property_name)}</h1>
    <p class="subtitle">${esc(c.price)}</p>
    ${c.agent ? `<p class="agent">${esc(c.agent)}</p>` : ''}</div>
  `, 1),
  renderPptx: (pres: any, c: any) => {
    const slide = pres.addSlide();
    slide.bkgd = NAVY;
    slide.addText(c.property_name, { x: 0.5, y: 1.5, w: '90%', h: 1.2, fontSize: 36, bold: true, color: WHITE, align: 'center' });
    slide.addText(c.price, { x: 0.5, y: 3, w: '90%', h: 0.6, fontSize: 20, color: WHITE, align: 'center' });
    if (c.agent) slide.addText(c.agent, { x: 0.5, y: 4, w: '90%', h: 0.4, fontSize: 14, color: 'B0BEC5', align: 'center' });
  },
};

const propertyOverview = {
  id: 'broker:property-overview',
  name: 'Property Overview',
  description: 'Key specs and highlights of a property. Use for the main property being presented.',
  schema: z.object({
    property_name: z.string().describe('Property name'),
    specs: z.string().describe('Key specs as pipe-delimited table: Feature|Value per line. Example: "Location|BGC, Taguig\nDeveloper|Megaworld\nUnit Sizes|33-453 sqm"'),
    highlights: z.string().describe('3-5 bullet points, one per line. Example: "Prime BGC location\nStrong rental demand\nModern amenities"'),
  }),
  renderHtml: (c: any) => {
    const rows = c.specs.split('\n').filter(Boolean).map((r: string) => r.split('|').map((x: string) => x.trim()));
    const tableHtml = rows.length ? `<table>${rows.map((r: string[], i: number) =>
      `<tr>${r.map((cell: string) => i === 0 ? `<th>${esc(cell)}</th>` : `<td>${esc(cell)}</td>`).join('')}</tr>`
    ).join('')}</table>` : '';
    const bulletsHtml = c.highlights.split('\n').filter(Boolean).map((l: string) => `<li>${esc(l)}</li>`).join('');
    return htmlSlide(`
      <div class="heading-bar">${esc(c.property_name)}</div>
      ${tableHtml}
      <ul>${bulletsHtml}</ul>
    `, 2);
  },
  renderPptx: (pres: any, c: any) => {
    const slide = pres.addSlide();
    pptxHeadingBar(slide, pres, c.property_name);
    const rows = c.specs.split('\n').filter(Boolean).map((r: string) => r.split('|').map((x: string) => x.trim()));
    if (rows.length) slide.addTable(rows, { x: 0.5, y: 1.2, w: 9, border: { type: 'solid', color: 'D1D5DB' }, fontSize: 10, autoPage: true });
    const bullets = c.highlights.split('\n').filter(Boolean).map((t: string) => ({ text: t, options: { bullet: true } }));
    slide.addText(bullets, { x: 0.5, y: 3, w: 9, h: 3, fontSize: 14, valign: 'top' });
  },
};

const comparisonSlide = {
  id: 'broker:comparison',
  name: 'Property Comparison',
  description: 'Side-by-side comparison of two properties. Use for head-to-head analysis.',
  schema: z.object({
    left_name: z.string().describe('Left property name'),
    left_details: z.string().describe('Left property specs and highlights (plain text, multiple lines)'),
    right_name: z.string().describe('Right property name'),
    right_details: z.string().describe('Right property specs and highlights (plain text, multiple lines)'),
  }),
  renderHtml: (c: any) => htmlSlide(`
    <h2 style="text-align:center;color:#${NAVY}">Property Comparison</h2>
    <div class="columns" style="display:flex;gap:20px;padding:10px 30px">
      <div class="col" style="flex:1"><h3 style="color:#${NAVY}">${esc(c.left_name)}</h3><p>${esc(c.left_details).replace(/\n/g,'<br>')}</p></div>
      <div class="col" style="flex:1"><h3 style="color:#${NAVY}">${esc(c.right_name)}</h3><p>${esc(c.right_details).replace(/\n/g,'<br>')}</p></div>
    </div>
  `, 3),
  renderPptx: (pres: any, c: any) => {
    const slide = pres.addSlide();
    const colW = 4.7;
    for (const [x, name, details] of [[0.3, c.left_name, c.left_details], [5.3, c.right_name, c.right_details]] as const) {
      slide.addShape(pres.ShapeType.rect, { x, y: 0.4, w: colW, h: 0.7, fill: { color: NAVY }, rectRadius: 0.05 });
      slide.addText(name, { x: x + 0.2, y: 0.4, w: colW - 0.4, h: 0.7, fontSize: 18, bold: true, color: WHITE, valign: 'middle' });
      slide.addText(details, { x: x + 0.2, y: 1.3, w: colW - 0.4, h: 5, fontSize: 12, valign: 'top', lineSpacingMultiple: 1.2 });
    }
  },
};

const investmentSlide = {
  id: 'broker:investment',
  name: 'Investment Highlights',
  description: 'Investment metrics and ROI analysis. Use for financial projections.',
  schema: z.object({
    property_name: z.string().describe('Property name'),
    price_range: z.string().describe('Price range'),
    rental_yield: z.string().describe('Expected rental yield, e.g., "5-7% gross"'),
    appreciation: z.string().describe('Expected annual appreciation, e.g., "8-10%"'),
    key_points: z.string().describe('3-5 key investment points, one per line'),
  }),
  renderHtml: (c: any) => htmlSlide(`
    <div class="heading-bar">${esc(c.property_name)} — Investment Analysis</div>
    <div style="display:flex;gap:20px;padding:20px 30px">
      <div style="flex:1;text-align:center;padding:20px;background:#F9FAFB;border-radius:8px;">
        <p style="font-size:12px;color:#888">Price Range</p><p style="font-size:24px;color:#${MAROON};font-weight:700">${esc(c.price_range)}</p>
      </div>
      <div style="flex:1;text-align:center;padding:20px;background:#F9FAFB;border-radius:8px;">
        <p style="font-size:12px;color:#888">Rental Yield</p><p style="font-size:24px;color:#${MAROON};font-weight:700">${esc(c.rental_yield)}</p>
      </div>
      <div style="flex:1;text-align:center;padding:20px;background:#F9FAFB;border-radius:8px;">
        <p style="font-size:12px;color:#888">Appreciation</p><p style="font-size:24px;color:#${MAROON};font-weight:700">${esc(c.appreciation)}</p>
      </div>
    </div>
    <ul style="padding:10px 40px">${c.key_points.split('\n').filter(Boolean).map((l: string) => `<li>${esc(l)}</li>`).join('')}</ul>
  `, 4),
  renderPptx: (pres: any, c: any) => {
    const slide = pres.addSlide();
    pptxHeadingBar(slide, pres, `${c.property_name} — Investment Analysis`);
    // Metric cards
    slide.addShape(pres.ShapeType.rect, { x: 0.5, y: 1.3, w: 2.8, h: 1.8, fill: { color: 'F5F5F5' }, rectRadius: 0.1 });
    slide.addText(`Price\n${c.price_range}`, { x: 0.5, y: 1.4, w: 2.8, h: 1.6, fontSize: 11, align: 'center', valign: 'middle', color: MAROON, bold: true });
    slide.addShape(pres.ShapeType.rect, { x: 3.6, y: 1.3, w: 2.8, h: 1.8, fill: { color: 'F5F5F5' }, rectRadius: 0.1 });
    slide.addText(`Yield\n${c.rental_yield}`, { x: 3.6, y: 1.4, w: 2.8, h: 1.6, fontSize: 11, align: 'center', valign: 'middle', color: MAROON, bold: true });
    slide.addShape(pres.ShapeType.rect, { x: 6.7, y: 1.3, w: 2.8, h: 1.8, fill: { color: 'F5F5F5' }, rectRadius: 0.1 });
    slide.addText(`Apprec.\n${c.appreciation}`, { x: 6.7, y: 1.4, w: 2.8, h: 1.6, fontSize: 11, align: 'center', valign: 'middle', color: MAROON, bold: true });
    const bullets = c.key_points.split('\n').filter(Boolean).map((t: string) => ({ text: t, options: { bullet: true } }));
    slide.addText(bullets, { x: 0.5, y: 3.5, w: 9, h: 3, fontSize: 14, valign: 'top' });
  },
};

const endSlide = {
  id: 'broker:end',
  name: 'Closing Slide',
  description: 'Thank you slide with agent contact. Use as the final slide.',
  schema: z.object({
    message: z.string().optional().describe('Closing message, default "Thank You"'),
    agent: z.string().optional().describe('Agent name and contact info'),
  }),
  renderHtml: (c: any) => htmlSlide(`
    <div class="title-slide"><h1>${esc(c.message || 'Thank You')}</h1>
    <p class="brand">TopRealty AI • www.toprealty.ai</p>
    ${c.agent ? `<p class="agent">${esc(c.agent)}</p>` : ''}</div>
  `, 99),
  renderPptx: (pres: any, c: any) => {
    const slide = pres.addSlide();
    slide.bkgd = NAVY;
    slide.addText(c.message || 'Thank You', { x: 0.5, y: 2.5, w: '90%', h: 1, fontSize: 40, bold: true, color: WHITE, align: 'center' });
    slide.addText('TopRealty AI • www.toprealty.ai', { x: 0.5, y: 3.8, w: '90%', h: 0.5, fontSize: 14, color: 'B0BEC5', align: 'center' });
    if (c.agent) slide.addText(c.agent, { x: 0.5, y: 4.5, w: '90%', h: 0.4, fontSize: 14, color: WHITE, align: 'center' });
  },
};

// ─── Register Template ────────────────────────────────────────────────

const brokerTemplate: PresentationTemplate = {
  id: 'toprealty-broker',
  name: 'TopRealty Broker Presentation',
  primaryColor: NAVY,
  layouts: [titleSlide, propertyOverview, comparisonSlide, investmentSlide, endSlide],
};

registerTemplate(brokerTemplate);
