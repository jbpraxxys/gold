/**
 * Luxury Property Showcase Template — Premium high-end real estate presentation.
 *
 * Seven slide layouts covering title, overview, amenities, location,
 * investment metrics, contact, and closing.
 *
 * Colors: Navy #1A4175, Maroon #941D28, Gold #C5A55A, Slate #475569
 */

import { z } from 'zod';
import {
  registerTemplate,
  type PresentationTemplate,
  esc,
  htmlSlide,
  pptxBar,
  addFooter,
} from './registry.ts';

// ─── Constants ────────────────────────────────────────────────────────

const NAVY = '1A4175';
const WHITE = 'FFFFFF';
const MAROON = '941D28';
const GOLD = 'C5A55A';
const SLATE = '475569';
const LIGHT_BG = 'F8FAFC';
const FONT = 'Calibri';

// ─── Layout 1: Title Slide ────────────────────────────────────────────

const titleSlide = {
  id: 'luxury:title',
  name: 'Luxury Title Slide',
  description:
    'Opening slide with property name, location, price, and optional tagline. Navy background with maroon price badge. Required: property_name, location, price. Optional: tagline.',
  schema: z.object({
    property_name: z.string(),
    location: z.string(),
    price: z.string(),
    tagline: z.string().optional(),
  }),
  renderHtml: (c: any) =>
    htmlSlide(
      `
    <div class="luxury-title">
      <div class="title-label">LUXURY PROPERTY</div>
      <h1>${esc(c.property_name)}</h1>
      <p class="location">${esc(c.location)}</p>
      <span class="price-badge">${esc(c.price)}</span>
      ${c.tagline ? `<p class="tagline">${esc(c.tagline)}</p>` : ''}
    </div>
  `,
      1,
    ),
  renderPptx: (pres: any, c: any) => {
    const slide = pres.addSlide();
    slide.bkgd = NAVY;

    // Gold accent line
    slide.addShape(pres.ShapeType.rect, {
      x: 1.2,
      y: 2.6,
      w: 7.6,
      h: 0.03,
      fill: { color: GOLD },
    });

    slide.addText('LUXURY PROPERTY', {
      x: 0.5,
      y: 0.6,
      w: 9,
      h: 0.5,
      fontSize: 11,
      fontFace: FONT,
      color: GOLD,
      align: 'center',
      charSpacing: 4,
      valign: 'middle',
    });

    slide.addText(c.property_name, {
      x: 0.8,
      y: 1.2,
      w: 8.4,
      h: 1.4,
      fontSize: 36,
      fontFace: FONT,
      bold: true,
      color: WHITE,
      align: 'center',
      valign: 'bottom',
    });

    slide.addText(c.location, {
      x: 0.8,
      y: 2.8,
      w: 8.4,
      h: 0.6,
      fontSize: 16,
      fontFace: FONT,
      color: 'B0BEC5',
      align: 'center',
      valign: 'top',
    });

    // Maroon price badge
    slide.addShape(pres.ShapeType.roundRect, {
      x: 3.2,
      y: 3.6,
      w: 3.6,
      h: 0.7,
      fill: { color: MAROON },
      rectRadius: 0.05,
    });
    slide.addText(c.price, {
      x: 3.2,
      y: 3.6,
      w: 3.6,
      h: 0.7,
      fontSize: 20,
      fontFace: FONT,
      bold: true,
      color: WHITE,
      align: 'center',
      valign: 'middle',
    });

    if (c.tagline) {
      slide.addText(c.tagline, {
        x: 0.8,
        y: 4.6,
        w: 8.4,
        h: 0.5,
        fontSize: 13,
        fontFace: FONT,
        italic: true,
        color: '90A4AE',
        align: 'center',
      });
    }

    slide.addText('TopRealty AI • www.toprealty.ai', {
      x: 0.5,
      y: 6.7,
      w: 9,
      h: 0.3,
      fontSize: 9,
      color: '78909C',
      align: 'center',
    });
  },
};

// ─── Layout 2: Property Overview ──────────────────────────────────────

const overviewSlide = {
  id: 'luxury:overview',
  name: 'Property Overview',
  description:
    'Stats grid showing property type, beds, baths, floor area, lot area, parking, year built, and furnished status, with a description below. Required: property_name, property_type, beds, baths, floor_area, lot_area, parking, year_built, furnished, description.',
  schema: z.object({
    property_name: z.string(),
    property_type: z.string(),
    beds: z.string(),
    baths: z.string(),
    floor_area: z.string(),
    lot_area: z.string(),
    parking: z.string(),
    year_built: z.string(),
    furnished: z.string(),
    description: z.string(),
  }),
  renderHtml: (c: any) => {
    const stats = [
      { label: 'Type', value: c.property_type },
      { label: 'Bedrooms', value: c.beds },
      { label: 'Bathrooms', value: c.baths },
      { label: 'Floor Area', value: c.floor_area },
      { label: 'Lot Area', value: c.lot_area },
      { label: 'Parking', value: c.parking },
      { label: 'Year Built', value: c.year_built },
      { label: 'Furnished', value: c.furnished },
    ];
    return htmlSlide(
      `
      <div class="heading-bar">${esc(c.property_name)}</div>
      <div class="stats-grid">
        ${stats
          .map(
            (s) =>
              `<div class="stat-card"><span class="stat-label">${esc(s.label)}</span><span class="stat-value">${esc(s.value)}</span></div>`,
          )
          .join('')}
      </div>
      <div class="description-block"><p>${esc(c.description)}</p></div>
    `,
      2,
    );
  },
  renderPptx: (pres: any, c: any) => {
    const slide = pres.addSlide();
    pptxBar(slide, pres, c.property_name);
    addFooter(slide, pres, 2);

    const stats = [
      { label: 'Property Type', value: c.property_type },
      { label: 'Bedrooms', value: c.beds },
      { label: 'Bathrooms', value: c.baths },
      { label: 'Floor Area', value: c.floor_area },
      { label: 'Lot Area', value: c.lot_area },
      { label: 'Parking', value: c.parking },
      { label: 'Year Built', value: c.year_built },
      { label: 'Furnished', value: c.furnished },
    ];

    // 2 rows × 4 columns stat grid
    stats.forEach((s, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = 0.4 + col * 2.4;
      const y = 1.15 + row * 1.25;

      slide.addShape(pres.ShapeType.rect, {
        x,
        y,
        w: 2.15,
        h: 1.05,
        fill: { color: LIGHT_BG },
        rectRadius: 0.06,
      });
      slide.addText(s.label, {
        x,
        y: y + 0.05,
        w: 2.15,
        h: 0.4,
        fontSize: 9,
        fontFace: FONT,
        color: SLATE,
        align: 'center',
        valign: 'bottom',
      });
      slide.addText(s.value, {
        x,
        y: y + 0.42,
        w: 2.15,
        h: 0.5,
        fontSize: 14,
        fontFace: FONT,
        bold: true,
        color: NAVY,
        align: 'center',
        valign: 'top',
      });
    });

    slide.addText(c.description, {
      x: 0.4,
      y: 3.8,
      w: 9.2,
      h: 2.8,
      fontSize: 12,
      fontFace: FONT,
      color: SLATE,
      valign: 'top',
      lineSpacingMultiple: 1.4,
    });
  },
};

// ─── Layout 3: Amenities ──────────────────────────────────────────────

const amenitiesSlide = {
  id: 'luxury:amenities',
  name: 'Amenities & Premium Features',
  description:
    'Two-column layout: standard amenities on the left, premium/exclusive features on the right. Required: property_name, amenities (one per line), premium_features (one per line).',
  schema: z.object({
    property_name: z.string(),
    amenities: z.string(),
    premium_features: z.string(),
  }),
  renderHtml: (c: any) => {
    const amenitiesList = c.amenities
      .split('\n')
      .filter(Boolean)
      .map((l: string) => `<li>${esc(l.trim())}</li>`)
      .join('');
    const premiumList = c.premium_features
      .split('\n')
      .filter(Boolean)
      .map((l: string) => `<li class="premium">${esc(l.trim())}</li>`)
      .join('');
    return htmlSlide(
      `
      <div class="heading-bar">${esc(c.property_name)}</div>
      <div class="two-col">
        <div class="col">
          <h3>AMENITIES</h3>
          <ul>${amenitiesList || '<li>—</li>'}</ul>
        </div>
        <div class="col">
          <h3>PREMIUM FEATURES</h3>
          <ul>${premiumList || '<li>—</li>'}</ul>
        </div>
      </div>
    `,
      3,
    );
  },
  renderPptx: (pres: any, c: any) => {
    const slide = pres.addSlide();
    pptxBar(slide, pres, c.property_name);
    addFooter(slide, pres, 3);

    // Left column heading
    slide.addShape(pres.ShapeType.rect, {
      x: 0.4,
      y: 1.1,
      w: 4.4,
      h: 0.5,
      fill: { color: NAVY },
    });
    slide.addText('AMENITIES', {
      x: 0.4,
      y: 1.1,
      w: 4.4,
      h: 0.5,
      fontSize: 13,
      fontFace: FONT,
      bold: true,
      color: WHITE,
      align: 'center',
      valign: 'middle',
    });

    // Right column heading
    slide.addShape(pres.ShapeType.rect, {
      x: 5.2,
      y: 1.1,
      w: 4.4,
      h: 0.5,
      fill: { color: MAROON },
    });
    slide.addText('PREMIUM FEATURES', {
      x: 5.2,
      y: 1.1,
      w: 4.4,
      h: 0.5,
      fontSize: 13,
      fontFace: FONT,
      bold: true,
      color: WHITE,
      align: 'center',
      valign: 'middle',
    });

    const leftItems = c.amenities
      .split('\n')
      .filter(Boolean)
      .map((t: string) => ({
        text: t.trim(),
        options: {
          bullet: { color: GOLD },
          fontSize: 11,
          fontFace: FONT,
          breakLine: true,
          paraSpaceAfter: 6,
        },
      }));

    const rightItems = c.premium_features
      .split('\n')
      .filter(Boolean)
      .map((t: string) => ({
        text: t.trim(),
        options: {
          bullet: { color: GOLD },
          fontSize: 11,
          fontFace: FONT,
          breakLine: true,
          paraSpaceAfter: 6,
        },
      }));

    slide.addText(
      leftItems.length ? leftItems : [{ text: '—', options: { fontSize: 11, fontFace: FONT } }],
      { x: 0.6, y: 1.8, w: 4, h: 4.8, valign: 'top' },
    );

    slide.addText(
      rightItems.length
        ? rightItems
        : [{ text: '—', options: { fontSize: 11, fontFace: FONT } }],
      { x: 5.4, y: 1.8, w: 4, h: 4.8, valign: 'top' },
    );
  },
};

// ─── Layout 4: Location ───────────────────────────────────────────────

const locationSlide = {
  id: 'luxury:location',
  name: 'Location & Neighborhood',
  description:
    'Map image, landmarks distance table (pipe-delimited: "Landmark|Distance"), and neighborhood description. Required: property_name, landmarks, neighborhood_description. Optional: map_image_url.',
  schema: z.object({
    property_name: z.string(),
    map_image_url: z.string().optional(),
    landmarks: z.string(),
    neighborhood_description: z.string(),
  }),
  renderHtml: (c: any) => {
    const rows = c.landmarks
      .split('\n')
      .filter(Boolean)
      .map((r: string) => r.split('|').map((x: string) => x.trim()));
    return htmlSlide(
      `
      <div class="heading-bar">${esc(c.property_name)} — Location</div>
      <div class="location-layout">
        <div class="map-area">
          ${c.map_image_url ? `<img src="${esc(c.map_image_url)}" alt="Location Map">` : '<div class="map-placeholder">MAP IMAGE</div>'}
        </div>
        <div class="landmarks-table">
          ${rows.length ? `<table><thead><tr><th>Landmark</th><th>Distance</th></tr></thead><tbody>${rows.map((r: string[]) => `<tr><td>${esc(r[0] || '')}</td><td>${esc(r[1] || '')}</td></tr>`).join('')}</tbody></table>` : ''}
        </div>
      </div>
      <div class="neighborhood-desc"><p>${esc(c.neighborhood_description)}</p></div>
    `,
      4,
    );
  },
  renderPptx: (pres: any, c: any) => {
    const slide = pres.addSlide();
    pptxBar(slide, pres, `${c.property_name} — Location`);
    addFooter(slide, pres, 4);

    // Map area (left)
    if (c.map_image_url) {
      slide.addImage({
        path: c.map_image_url,
        x: 0.4,
        y: 1.1,
        w: 4.6,
        h: 2.8,
        sizing: { type: 'cover', w: 4.6, h: 2.8 },
      });
    } else {
      slide.addShape(pres.ShapeType.rect, {
        x: 0.4,
        y: 1.1,
        w: 4.6,
        h: 2.8,
        fill: { color: LIGHT_BG },
      });
      slide.addText('📍 Map Image', {
        x: 0.4,
        y: 1.1,
        w: 4.6,
        h: 2.8,
        fontSize: 14,
        fontFace: FONT,
        color: '9CA3AF',
        align: 'center',
        valign: 'middle',
      });
    }

    // Landmarks table (right)
    const rows = c.landmarks
      .split('\n')
      .filter(Boolean)
      .map((r: string) => r.split('|').map((x: string) => x.trim()));
    if (rows.length) {
      slide.addTable([['Landmark', 'Distance'], ...rows], {
        x: 5.3,
        y: 1.1,
        w: 4.3,
        border: { type: 'solid', color: 'D1D5DB' },
        fontFace: FONT,
        fontSize: 10,
        autoPage: true,
      });
    }

    // Neighborhood description (bottom)
    slide.addText(c.neighborhood_description, {
      x: 0.4,
      y: 4.2,
      w: 9.2,
      h: 2.5,
      fontSize: 12,
      fontFace: FONT,
      color: SLATE,
      valign: 'top',
      lineSpacingMultiple: 1.4,
    });
  },
};

// ─── Layout 5: Investment ─────────────────────────────────────────────

const investmentSlide = {
  id: 'luxury:investment',
  name: 'Investment Analysis',
  description:
    'Metric cards for rental yield, appreciation, rental income, and occupancy rate, plus market trend summary and comparable sales table (pipe-delimited: "Address|Price|Size" per line). Required: property_name, rental_yield, appreciation, rental_income, occupancy, market_trend, comparable_sales.',
  schema: z.object({
    property_name: z.string(),
    rental_yield: z.string(),
    appreciation: z.string(),
    rental_income: z.string(),
    occupancy: z.string(),
    market_trend: z.string(),
    comparable_sales: z.string(),
  }),
  renderHtml: (c: any) => {
    const metrics = [
      { label: 'Rental Yield', value: c.rental_yield },
      { label: 'Appreciation', value: c.appreciation },
      { label: 'Rental Income', value: c.rental_income },
      { label: 'Occupancy', value: c.occupancy },
    ];
    const compRows = c.comparable_sales
      .split('\n')
      .filter(Boolean)
      .map((r: string) => r.split('|').map((x: string) => x.trim()));
    return htmlSlide(
      `
      <div class="heading-bar">${esc(c.property_name)} — Investment</div>
      <div class="metric-cards">
        ${metrics
          .map(
            (m) =>
              `<div class="metric"><span class="metric-label">${esc(m.label)}</span><span class="metric-value">${esc(m.value)}</span></div>`,
          )
          .join('')}
      </div>
      <div class="market-trend"><strong>Market Trend:</strong> ${esc(c.market_trend)}</div>
      <div class="comp-table">
        <h4>Comparable Sales</h4>
        ${compRows.length ? `<table><thead><tr><th>Address</th><th>Price</th><th>Size</th></tr></thead><tbody>${compRows.map((r: string[]) => `<tr><td>${esc(r[0] || '')}</td><td>${esc(r[1] || '')}</td><td>${esc(r[2] || '')}</td></tr>`).join('')}</tbody></table>` : '<p>No comparable sales listed.</p>'}
      </div>
    `,
      5,
    );
  },
  renderPptx: (pres: any, c: any) => {
    const slide = pres.addSlide();
    pptxBar(slide, pres, `${c.property_name} — Investment`);
    addFooter(slide, pres, 5);

    // 4 metric cards
    const metrics = [
      { label: 'Rental Yield', value: c.rental_yield },
      { label: 'Appreciation', value: c.appreciation },
      { label: 'Est. Rental Income', value: c.rental_income },
      { label: 'Occupancy Rate', value: c.occupancy },
    ];

    metrics.forEach((m, i) => {
      const x = 0.4 + i * 2.4;
      slide.addShape(pres.ShapeType.rect, {
        x,
        y: 1.15,
        w: 2.15,
        h: 1.35,
        fill: { color: LIGHT_BG },
        rectRadius: 0.06,
      });
      slide.addShape(pres.ShapeType.rect, {
        x: x + 0.5,
        y: 1.15,
        w: 1.15,
        h: 0.04,
        fill: { color: GOLD },
      });
      slide.addText(m.label, {
        x,
        y: 1.25,
        w: 2.15,
        h: 0.35,
        fontSize: 9,
        fontFace: FONT,
        color: SLATE,
        align: 'center',
        valign: 'bottom',
      });
      slide.addText(m.value, {
        x,
        y: 1.6,
        w: 2.15,
        h: 0.7,
        fontSize: 16,
        fontFace: FONT,
        bold: true,
        color: NAVY,
        align: 'center',
        valign: 'middle',
      });
    });

    // Market trend
    slide.addText(`Market Trend: ${c.market_trend}`, {
      x: 0.4,
      y: 2.7,
      w: 9.2,
      h: 0.5,
      fontSize: 11,
      fontFace: FONT,
      color: SLATE,
      valign: 'middle',
      lineSpacingMultiple: 1.3,
    });

    // Comparable sales table
    const compRows = c.comparable_sales
      .split('\n')
      .filter(Boolean)
      .map((r: string) => r.split('|').map((x: string) => x.trim()));

    slide.addText('Comparable Sales', {
      x: 0.4,
      y: 3.25,
      w: 9.2,
      h: 0.4,
      fontSize: 13,
      fontFace: FONT,
      bold: true,
      color: NAVY,
      valign: 'middle',
    });

    if (compRows.length) {
      slide.addTable([['Address', 'Price', 'Size'], ...compRows], {
        x: 0.4,
        y: 3.7,
        w: 9.2,
        border: { type: 'solid', color: 'D1D5DB' },
        fontFace: FONT,
        fontSize: 10,
        autoPage: true,
      });
    }
  },
};

// ─── Layout 6: Contact / Agent ────────────────────────────────────────

const contactSlide = {
  id: 'luxury:contact',
  name: 'Agent Contact',
  description:
    'Agent contact information with photo, name, title, phone, email, call-to-action text, and disclaimer. Navy background closing slide. Required: property_name, agent_name, title, phone, email, cta_text, disclaimer. Optional: photo_url.',
  schema: z.object({
    property_name: z.string(),
    agent_name: z.string(),
    title: z.string(),
    phone: z.string(),
    email: z.string(),
    photo_url: z.string().optional(),
    cta_text: z.string(),
    disclaimer: z.string(),
  }),
  renderHtml: (c: any) =>
    htmlSlide(
      `
      <div class="contact-slide">
        <div class="title-label">CONTACT AGENT</div>
        <h2>${esc(c.property_name)}</h2>
        <div class="agent-card">
          ${c.photo_url ? `<img src="${esc(c.photo_url)}" alt="Agent Photo" class="agent-photo">` : '<div class="agent-photo-placeholder">📷</div>'}
          <h3>${esc(c.agent_name)}</h3>
          <p class="agent-title">${esc(c.title)}</p>
          <p class="agent-phone">${esc(c.phone)}</p>
          <p class="agent-email">${esc(c.email)}</p>
        </div>
        <p class="cta">${esc(c.cta_text)}</p>
        <p class="disclaimer">${esc(c.disclaimer)}</p>
      </div>
    `,
      6,
    ),
  renderPptx: (pres: any, c: any) => {
    const slide = pres.addSlide();
    slide.bkgd = NAVY;

    // Gold accent line
    slide.addShape(pres.ShapeType.rect, {
      x: 1.2,
      y: 2.3,
      w: 7.6,
      h: 0.03,
      fill: { color: GOLD },
    });

    slide.addText('CONTACT AGENT', {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.4,
      fontSize: 11,
      fontFace: FONT,
      color: GOLD,
      align: 'center',
      charSpacing: 3,
      valign: 'middle',
    });

    slide.addText(c.property_name, {
      x: 0.5,
      y: 0.95,
      w: 9,
      h: 0.6,
      fontSize: 22,
      fontFace: FONT,
      bold: true,
      color: WHITE,
      align: 'center',
      valign: 'middle',
    });

    // Agent photo or placeholder
    if (c.photo_url) {
      slide.addImage({
        path: c.photo_url,
        x: 3.8,
        y: 2.55,
        w: 2.4,
        h: 2.4,
        sizing: { type: 'contain', w: 2.4, h: 2.4 },
      });
    } else {
      slide.addShape(pres.ShapeType.ellipse, {
        x: 4.0,
        y: 2.55,
        w: 2.0,
        h: 2.0,
        fill: { color: LIGHT_BG },
      });
      slide.addText('📷', {
        x: 4.0,
        y: 2.55,
        w: 2.0,
        h: 2.0,
        fontSize: 30,
        align: 'center',
        valign: 'middle',
      });
    }

    slide.addText(c.agent_name, {
      x: 0.5,
      y: 5.1,
      w: 9,
      h: 0.5,
      fontSize: 18,
      fontFace: FONT,
      bold: true,
      color: WHITE,
      align: 'center',
      valign: 'middle',
    });

    slide.addText(c.title, {
      x: 0.5,
      y: 5.5,
      w: 9,
      h: 0.4,
      fontSize: 12,
      fontFace: FONT,
      color: GOLD,
      align: 'center',
      valign: 'middle',
    });

    slide.addText(`${c.phone}  •  ${c.email}`, {
      x: 0.5,
      y: 5.85,
      w: 9,
      h: 0.35,
      fontSize: 11,
      fontFace: FONT,
      color: 'B0BEC5',
      align: 'center',
      valign: 'middle',
    });

    // CTA
    slide.addShape(pres.ShapeType.roundRect, {
      x: 3.2,
      y: 6.3,
      w: 3.6,
      h: 0.5,
      fill: { color: MAROON },
      rectRadius: 0.05,
    });
    slide.addText(c.cta_text, {
      x: 3.2,
      y: 6.3,
      w: 3.6,
      h: 0.5,
      fontSize: 12,
      fontFace: FONT,
      bold: true,
      color: WHITE,
      align: 'center',
      valign: 'middle',
    });

    // Disclaimer
    slide.addText(c.disclaimer, {
      x: 0.3,
      y: 6.9,
      w: 9.4,
      h: 0.3,
      fontSize: 7,
      fontFace: FONT,
      color: '78909C',
      align: 'center',
    });
  },
};

// ─── Layout 7: Closing ────────────────────────────────────────────────

const closingSlide = {
  id: 'luxury:closing',
  name: 'Closing Slide',
  description:
    'Thank you closing slide. Navy background. Optional: property_name, message (default "Thank You"), agent_name. Used to end the presentation.',
  schema: z.object({
    property_name: z.string().optional(),
    message: z.string().optional(),
    agent_name: z.string().optional(),
  }),
  renderHtml: (c: any) =>
    htmlSlide(
      `
      <div class="luxury-title">
        ${c.property_name ? `<div class="title-label">${esc(c.property_name)}</div>` : ''}
        <h1>${esc(c.message || 'Thank You')}</h1>
        <p class="brand">TopRealty AI • www.toprealty.ai</p>
        ${c.agent_name ? `<p class="agent">${esc(c.agent_name)}</p>` : ''}
      </div>
    `,
      99,
    ),
  renderPptx: (pres: any, c: any) => {
    const slide = pres.addSlide();
    slide.bkgd = NAVY;

    // Gold accent line
    slide.addShape(pres.ShapeType.rect, {
      x: 1.2,
      y: 2.8,
      w: 7.6,
      h: 0.03,
      fill: { color: GOLD },
    });

    if (c.property_name) {
      slide.addText(c.property_name, {
        x: 0.5,
        y: 0.6,
        w: 9,
        h: 0.5,
        fontSize: 13,
        fontFace: FONT,
        color: GOLD,
        align: 'center',
        valign: 'middle',
      });
    }

    slide.addText(c.message || 'Thank You', {
      x: 0.5,
      y: 1.5,
      w: 9,
      h: 1.5,
      fontSize: 42,
      fontFace: FONT,
      bold: true,
      color: WHITE,
      align: 'center',
      valign: 'bottom',
    });

    slide.addText('TopRealty AI • www.toprealty.ai', {
      x: 0.5,
      y: 3.3,
      w: 9,
      h: 0.5,
      fontSize: 14,
      fontFace: FONT,
      color: '90A4AE',
      align: 'center',
    });

    if (c.agent_name) {
      slide.addText(c.agent_name, {
        x: 0.5,
        y: 4.2,
        w: 9,
        h: 0.4,
        fontSize: 12,
        fontFace: FONT,
        color: WHITE,
        align: 'center',
      });
    }
  },
};

// ─── Register ─────────────────────────────────────────────────────────

const luxuryTemplate: PresentationTemplate = {
  id: 'toprealty-luxury',
  name: 'TopRealty Luxury Property Showcase',
  primaryColor: NAVY,
  layouts: [
    titleSlide,
    overviewSlide,
    amenitiesSlide,
    locationSlide,
    investmentSlide,
    contactSlide,
    closingSlide,
  ],
};

registerTemplate(luxuryTemplate);
