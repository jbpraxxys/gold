# Per-Output-Type Stack & Approach

> Stack: **Nuxt 4 + Vue 3 + Node.js backend**  
> Principle: AI generates structured JSON content. Template engine merges JSON into pre-designed templates. AI never touches formatting or binary file generation.

---

## 1. Overall Architecture (Vue/Nuxt Edition)

```
┌────────────────────────────────────────────────────┐
│              NUXT 4 FRONTEND (Vue 3)               │
│                                                    │
│  Chat UI (useChat from @ai-sdk/vue)                │
│  Document Preview (iframe / download)              │
│  Template Manager (admin-only)                     │
└────────────────────┬───────────────────────────────┘
                     │ streaming SSE
┌────────────────────▼───────────────────────────────┐
│         NUXT SERVER ROUTES (/server/api/)          │
│                                                    │
│  POST /api/chat        → AI streaming + tools      │
│  POST /api/documents   → Trigger generation        │
│  GET  /api/documents/:id  → Download file          │
│  POST /api/images      → Trigger image generation  │
└────────────────────┬───────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────┐
│              NODE.JS SERVICE LAYER                  │
│                                                    │
│  AI Service      → Vercel AI SDK + Claude/GPT      │
│  Template Engine → Carbone.io (DOCX/PDF/XLSX/PPTX) │
│  PPTX Builder    → PptxGenJS (programmatic slides) │
│  Image Service   → DALL-E 3 + Sharp (compositing)  │
│  PDF Service     → Puppeteer (HTML→PDF fallback)   │
│  CRM Service     → Supabase queries                │
└────────────────────┬───────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────┐
│              DATA & STORAGE                         │
│  Supabase PostgreSQL  → CRM data (properties, etc.) │
│  Supabase Storage     → Templates, generated files  │
│  pgvector             → Semantic property search    │
└────────────────────────────────────────────────────┘
```

**Key difference from Next.js:** Nuxt 4 uses Nitro server under the hood — the `/server/api/` directory maps directly to API endpoints. Same capability as Next.js API routes, just different folder structure.

---

## 2. Frontend: Nuxt 4 + Vercel AI SDK (Vue)

### Stack

| Package | Version | Purpose |
|---------|---------|---------|
| `nuxt` | 4.x | Vue meta-framework |
| `vue` | 3.5+ | UI framework |
| `@ai-sdk/vue` | latest | Vue composables for AI streaming (`useChat`) |
| `@ai-sdk/openai` | latest | OpenAI provider |
| `@ai-sdk/anthropic` | latest | Anthropic/Claude provider |
| `ai` | latest | Vercel AI SDK core |

### How the Chat Works

```vue
<!-- app/components/AiChat.vue -->
<script setup lang="ts">
import { useChat } from '@ai-sdk/vue';

const { messages, input, handleSubmit, status } = useChat({
  api: '/api/chat',
  // Tool results render as rich Vue components
  onToolCall({ toolCall }) {
    // When AI calls generate_brochure → show loading
    // When result returns → show download button
  },
});
</script>

<template>
  <div class="chat-container">
    <!-- Messages render here -->
    <div v-for="msg in messages" :key="msg.id">
      <ChatBubble :message="msg" />
    </div>
    
    <!-- Input bar -->
    <form @submit="handleSubmit">
      <input v-model="input" placeholder="Ask me to generate a document..." />
      <button :disabled="status !== 'ready'">Send</button>
    </form>
  </div>
</template>
```

**Vercel AI SDK has first-class Vue/Nuxt support** — official `@ai-sdk/vue` package with `useChat()` composable, Nuxt getting-started guide, and a Vercel template (`nuxt-ai-chatbot`). Vue School even has a dedicated course: "AI Interfaces with Vue, Nuxt, and the AI SDK."

---

## 3. Per-Output-Type Breakdown

---

### 3.1 PowerPoint Presentations (.pptx)

**Use case:** Investor presentations, property showcases, agent performance reports.

#### Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Template Design** | Microsoft PowerPoint or Google Slides | Design team creates `.pptx` with branded layouts, placeholder slides |
| **AI Content Generation** | Claude Sonnet 4.6 | Generates slide-by-slide content as structured JSON |
| **PPTX Builder** | **PptxGenJS** | Programmatic slide creation from JSON — the industry standard for Node.js |
| **Alternative** | Carbone.io (PPTX template mode) | Template-based: uses `.pptx` as template with `{tags}`, merges JSON |

#### Approach A: PptxGenJS (Programmatic — Recommended)

**Best for:** Presentations with variable slide counts, dynamic content, charts, and tables.

```
USER: "Create an investor presentation for Makati Tower"

  ┌─ STEP 1: AI extracts intent ─────────────────────────────┐
  │  Tool called: generate_presentation                      │
  │  → propertyId: "makati-tower"                            │
  │  → type: "investor"                                      │
  │  → template: "modern-dark"                               │
  └──────────────────────────────────────────────────────────┘
                          │
  ┌─ STEP 2: CRM fetches data ───────────────────────────────┐
  │  → Property: price, sqm, bedrooms, location, amenities   │
  │  → Financials: projected ROI, rental yield, appreciation │
  │  → Comparables: nearby sold properties                   │
  │  → Market: area growth trends                            │
  └──────────────────────────────────────────────────────────┘
                          │
  ┌─ STEP 3: AI generates slide content (JSON) ──────────────┐
  │  ~300-500 tokens of structured data:                     │
  │  {                                                       │
  │    "slides": [                                           │
  │      { "type": "title",                                  │
  │        "title": "Makati Tower",                          │
  │        "subtitle": "Prime Investment Opportunity" },     │
  │      { "type": "two_column",                             │
  │        "left": { "heading": "Key Metrics", ... },        │
  │        "right": { "image": "property-hero.jpg" } },      │
  │      { "type": "chart",                                  │
  │        "chartType": "bar",                               │
  │        "data": [{ "label": "ROI", "value": 8.2 }, ...]}, │
  │      ...                                                 │
  │    ]                                                     │
  │  }                                                       │
  └──────────────────────────────────────────────────────────┘
                          │
  ┌─ STEP 4: PptxGenJS builds .pptx file ────────────────────┐
  │  const pptx = new PptxGenJS();                           │
  │  slides.forEach(slide => {                               │
  │    const s = pptx.addSlide();                            │
  │    if (slide.type === 'title') {                         │
  │      s.addText(slide.title, { fontSize: 44, bold: true });│
  │      s.addText(slide.subtitle, { fontSize: 24 });        │
  │    }                                                     │
  │    if (slide.type === 'chart') {                         │
  │      s.addChart(pptx.charts.BAR, slide.data);            │
  │    }                                                     │
  │  });                                                     │
  │  await pptx.writeFile({ fileName: 'Makati-Tower.pptx' });│
  └──────────────────────────────────────────────────────────┘
                          │
  ┌─ STEP 5: Upload to S3, return download link ─────────────┐
  └──────────────────────────────────────────────────────────┘
```

**Token savings:** AI only generates ~300-500 tokens of slide content JSON. PptxGenJS handles all formatting, layout, colors, and charts programmatically. Without this pattern, asking the AI to generate a full presentation description would consume 5,000+ tokens.

#### Approach B: Carbone PPTX Template (Template-based)

**Best for:** Highly branded presentations where design team maintains exact layouts.

1. Design team creates a `.pptx` in PowerPoint with Carbone tags: `{c.slides[i].title}`, `{c.slides[i].content}`
2. AI generates the content JSON
3. Carbone renders: `carbone.render('./templates/investor.pptx', data, (err, result) => ...)`

**Trade-off:** Less flexible than PptxGenJS for dynamic slide counts and charts, but easier for the design team.

#### Recommended Approach

**Use PptxGenJS as primary** with a "slide component library" — pre-built Vue-like slide components (TitleSlide, TwoColumnSlide, ChartSlide, ImageSlide) that map AI-generated JSON to PptxGenJS API calls. This gives you both design consistency (slide components enforce branding) and flexibility (unlimited slides, dynamic charts).

```typescript
// server/services/pptx/slide-components.ts
export const slideComponents = {
  title: (slide: PptxGenSlide, data: TitleSlideData) => {
    slide.background = { fill: THEME.navy };
    slide.addText(data.title, { x: 1, y: 2, w: 8, fontSize: 36, color: 'FFFFFF' });
  },
  two_column: (slide: PptxGenSlide, data: TwoColSlideData) => {
    slide.addText(data.left.heading, { x: 0.5, y: 0.5, w: 4.5 });
    slide.addImage({ path: data.right.image, x: 5.5, y: 0.5, w: 4 });
  },
  chart: (slide: PptxGenSlide, data: ChartSlideData) => {
    slide.addChart(pptx.charts[data.chartType.toUpperCase()], data.chartData, {
      x: 1, y: 1.5, w: 8, h: 4.5,
      showTitle: true, title: data.title,
    });
  },
  // ... etc
};
```

---

### 3.2 Word Documents (.docx)

**Use case:** Property brochures, valuation reports, property descriptions, market reports.

#### Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Template Design** | Microsoft Word | Design team creates `.docx` with Carbone `{tags}`, branded headers/footers, table styles |
| **AI Content Generation** | Claude Sonnet 4.6 | Generates document content as structured JSON |
| **Template Engine** | **Carbone.io** | Merges JSON into `.docx` template, renders to `.docx` or `.pdf` |
| **Fallback** | `docx` npm package (programmatic) | For simple docs that don't need heavy branding |

#### Process

```
USER: "Generate a luxury brochure for Makati Tower"

  ┌─ STEP 1: AI tool call ──────────────────────────────────┐
  │  generate_brochure({                                    │
  │    propertyId: "makati-tower",                          │
  │    format: "docx",       // or "pdf", "both"            │
  │    tone: "luxury",       // luxury | family | investment│
  │    includeFloorPlan: true                               │
  │  })                                                     │
  └──────────────────────────────────────────────────────────┘
                          │
  ┌─ STEP 2: CRM data ──────────────────────────────────────┐
  │  Property: name, address, price, specs, amenities,      │
  │            description, agent details, images           │
  │  Neighborhood: schools, transport, restaurants, parks   │
  └──────────────────────────────────────────────────────────┘
                          │
  ┌─ STEP 3: AI generates content JSON (~400 tokens) ───────┐
  │  {                                                      │
  │    "property": {                                        │
  │      "headline": "Makati Tower — Luxury Redefined",     │
  │      "tagline": "Where urban sophistication meets...",  │
  │      "description": "...",                              │
  │      "key_features": [                                  │
  │        "Floor-to-ceiling windows with panoramic views", │
  │        "Private elevator access to each residence",     │
  │        "Smart home automation throughout"               │
  │      ],                                                 │
  │      "neighborhood_blurb": "...",                        │
  │      "agent_message": "I'm excited to present..."       │
  │    },                                                   │
  │    "specs": { "bedrooms": 3, "bathrooms": 2.5, ... },   │
  │    "images": ["hero.jpg", "living-room.jpg", ...]       │
  │  }                                                      │
  └──────────────────────────────────────────────────────────┘
                          │
  ┌─ STEP 4: Carbone merges JSON into template ─────────────┐
  │  const carbone = require('carbone');                    │
  │                                                         │
  │  const data = { ...step3Json };                         │
  │  const options = {                                      │
  │    convertTo: 'pdf',  // or 'docx'                      │
  │    variableStr: '{}',  // Carbone tag style             │
  │  };                                                     │
  │                                                         │
  │  carbone.render(                                        │
  │    './templates/brochure-luxury.docx',                  │
  │    data,                                                │
  │    options,                                             │
  │    (err, result) => {                                   │
  │      // result is a Buffer — upload to S3               │
  │      fs.writeFileSync('output.pdf', result);            │
  │    }                                                    │
  │  );                                                     │
  └──────────────────────────────────────────────────────────┘
```

#### The DOCX Template (designed in Word)

```
┌─────────────────────────────────────────┐
│  [LOGO]                     TOP REALTY  │
│                                         │
│  {c.property.headline}                  │
│  {c.property.tagline}                   │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │        [PROPERTY IMAGE]             ││
│  └─────────────────────────────────────┘│
│                                         │
│  Overview                               │
│  {c.property.description}               │
│                                         │
│  Key Features                           │
│  {c.property.key_features[i]}           │  ← Carbone loop
│                                         │
│  Specifications       Neighborhood      │
│  {c.specs.bedrooms} BR   {c.neighborhood_blurb} │
│  {c.specs.bathrooms} BA                  │
│  {c.specs.sqm} sqm                      │
│                                         │
│  Agent's Note                           │
│  {c.property.agent_message}             │
└─────────────────────────────────────────┘
```

**Token savings:** The template handles all layout, fonts, colors, page breaks, headers, footers, and image placement. AI only generates the **variable text content** — ~400 tokens instead of 8,000+ for a full document description.

---

### 3.3 PDF Reports

**Use case:** CMA reports, valuation reports, market reports, property comparisons.

Two approaches depending on the report type:

#### Approach A: Carbone DOCX→PDF Pipeline (Recommended for text-heavy reports)

**Same as DOCX above**, just set Carbone's `convertTo: 'pdf'`. Design template in Word, AI generates JSON, Carbone renders PDF. This ensures WYSIWYG fidelity — what you see in Word is what you get in PDF.

**Best for:** CMA reports, valuation reports, market reports, property brochures.

#### Approach B: HTML→PDF via Puppeteer (for data-visualization-heavy reports)

**Stack:** HTML/CSS template + Chart.js (charts) + Puppeteer or `@resvg/resvg-js` (rendering)

**Best for:** Reports with dynamic charts, maps, data tables that change per property.

```
USER: "Generate CMA report for Makati Tower"

  AI generates JSON:
  {
    "subject": { "name": "Makati Tower", "price": 45000000, ... },
    "comparables": [
      { "address": "123 Ayala Ave", "price": 42000000, "sqm": 120, ... },
      { "address": "456 Gil Puyat", "price": 48000000, "sqm": 135, ... },
    ],
    "charts": {
      "pricePerSqm": [{ "label": "Subject", "value": 375000 }, ...],
      "priceTrend": [{ "month": "Jan", "avg": 360000 }, ...]
    },
    "analysis": "Makati Tower is priced competitively at..."
  }

  HTML template renders with Chart.js → Puppeteer saves as PDF:
  await page.pdf({ format: 'A4', printBackground: true });
```

#### Stack Summary for PDF

| Technology | Use Case |
|-----------|----------|
| **Carbone (DOCX→PDF)** | Text-heavy structured reports (CMA, valuation, brochure) |
| **Puppeteer + HTML/CSS + Chart.js** | Reports with dynamic charts, maps, data visualization |
| **WeasyPrint** | Python alternative to Puppeteer (if you add a Python microservice) |

---

### 3.4 Excel Spreadsheets (.xlsx)

**Use case:** Pricing sheets, property comparisons, market data exports, agent performance tables.

#### Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Template Design** | Microsoft Excel | Design team creates `.xlsx` with formatting, formulas, pivot tables, conditional formatting |
| **AI Content Generation** | Claude Haiku 4.5 | Extracts and organizes tabular data — cheap, fast |
| **Template Engine** | **Carbone.io** (XLSX template mode) | Merges JSON arrays into Excel template with formatting |
| **Alternative** | **ExcelJS** (programmatic) | For dynamic sheets where column count varies |

#### Process

```
USER: "Export a pricing comparison of all luxury condos in Makati"

  ┌─ STEP 1: AI extracts intent + query ────────────────────┐
  │  Tool called: export_spreadsheet                        │
  │  → query: "luxury condos in Makati"                     │
  │  → format: "xlsx"                                       │
  │  → sortBy: "price_per_sqm"                              │
  └──────────────────────────────────────────────────────────┘
                          │
  ┌─ STEP 2: CRM fetches data ──────────────────────────────┐
  │  Properties array with: name, address, price, sqm,      │
  │  bedrooms, bathrooms, price_per_sqm, year_built         │
  └──────────────────────────────────────────────────────────┘
                          │
  ┌─ STEP 3: AI optionally enriches data (~200 tokens) ─────┐
  │  For each property:                                     │
  │  → Categorizes as "good deal" / "fair" / "overpriced"   │
  │  → Adds 1-line neighborhood summary                     │
  └──────────────────────────────────────────────────────────┘
                          │
  ┌─ STEP 4: Carbone merges into .xlsx template ────────────┐
  │  carbone.render(                                        │
  │    './templates/pricing-comparison.xlsx',               │
  │    { properties: [...], generatedAt: new Date() },      │
  │    { convertTo: 'xlsx' },                               │
  │    (err, result) => uploadToS3(result)                  │
  │  );                                                     │
  └──────────────────────────────────────────────────────────┘
```

#### The XLSX Template (designed in Excel)

```
| A: Property      | B: Price    | C: SQM | D: Price/SQM | E: Beds | F: Assessment |
|------------------|-------------|--------|--------------|---------|---------------|
| {c.props[i].name}| {c.props[i].price|currency} | {c.props[i].sqm} | =B{row}/C{row} | {c.props[i].beds} | {c.props[i].assessment} |

← Carbone array loop over properties
← Excel formula auto-calculated
← Conditional formatting: green if "good deal", red if "overpriced"
```

**Token savings:** AI generates zero tokens for the data itself (it comes from the database). AI only generates ~200 tokens for enrichment (categorization, summaries). Carbone handles all formatting, formulas, and styling from the template.

---

### 3.5 Marketing Images & Flyers

**Use case:** Social media posts, Facebook banners, Instagram stories, open house posters, property flyers.

This is the only output type that requires a **second AI model** — an image generation model — because text LLMs cannot produce pixels.

#### Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **AI Content (text LLM)** | Claude Sonnet 4.6 | Generates headline, copy, and the **image prompt** for the image generator |
| **Image Generation** | **DALL-E 3** (OpenAI API) | Generates the base image from a text prompt |
| **Alternative Image Gen** | Stability AI / Replicate (Flux, SDXL) | Cheaper for high volume, self-hostable |
| **Image Compositing** | **Sharp** (Node.js) | Overlays text, logos, branding onto the generated image |
| **Template System** | JSON layout definitions | Defines where text/logo/image goes per format |

#### Process (Flyer Example)

```
USER: "Create a luxury Facebook banner for Makati Tower"

  ┌─ STEP 1: AI generates image prompt ─────────────────────┐
  │  Claude generates a detailed DALL-E prompt:             │
  │  "Professional architectural photography of a modern    │
  │   30-story glass and steel luxury condominium tower in  │
  │   Makati skyline at golden hour. Clean composition,      │
  │   wide angle, luxury lifestyle aesthetic. 16:9 ratio,   │
  │   bright airy feel, no text overlay."                   │
  └──────────────────────────────────────────────────────────┘
                          │
  ┌─ STEP 2: DALL-E 3 generates the image ──────────────────┐
  │  const image = await openai.images.generate({           │
  │    model: "dall-e-3",                                   │
  │    prompt: promptFromStep1,                             │
  │    size: "1792x1024",   // Facebook cover: 16:9         │
  │    quality: "hd",                                       │
  │  });                                                    │
  │  const imageUrl = image.data[0].url;                    │
  └──────────────────────────────────────────────────────────┘
                          │
  ┌─ STEP 3: Sharp composites branding ─────────────────────┐
  │  const baseImage = await fetch(imageUrl).then(r=>r.buffer())│
  │                                                         │
  │  const finalBanner = await sharp(baseImage)             │
  │    // Add semi-transparent overlay at bottom            │
  │    .composite([{                                        │
  │      input: overlayBuffer,                              │
  │      top: 800, left: 0,                                 │
  │    }])                                                  │
  │    // Add property name text (rendered as SVG→PNG)      │
  │    .composite([{                                        │
  │      input: textOverlayBuffer("MAKATI TOWER"),          │
  │      top: 840, left: 60,                                │
  │    }])                                                  │
  │    // Add logo                                          │
  │    .composite([{                                        │
  │      input: logoBuffer,                                 │
  │      top: 20, left: 60,                                 │
  │    }])                                                  │
  │    .jpeg({ quality: 90 })                               │
  │    .toBuffer();                                         │
  └──────────────────────────────────────────────────────────┘
```

#### Layout Templates (JSON)

Instead of asking AI to design the layout, define reusable layout templates:

```typescript
// server/services/images/layouts.ts
export const facebookBanner: Layout = {
  width: 1200,
  height: 630,
  zones: [
    { type: 'background', x: 0, y: 0, w: 1200, h: 630 },          // DALL-E image
    { type: 'overlay', x: 0, y: 420, w: 1200, h: 210, opacity: 0.6, color: THEME.navy },
    { type: 'text', x: 60, y: 450, fontSize: 48, font: 'Inter Bold', color: '#FFFFFF', field: 'headline' },
    { type: 'text', x: 60, y: 520, fontSize: 24, font: 'Inter', color: '#CCCCCC', field: 'subtitle' },
    { type: 'logo', x: 60, y: 20, w: 180 },
  ],
};

export const instagramPost: Layout = {
  width: 1080,
  height: 1080,
  zones: [ /* different layout for square format */ ],
};
```

**Token savings:** AI generates only the image prompt (~80 tokens) and copy text (~50 tokens). DALL-E + Sharp handle the rest. Total ~130 AI tokens vs 3,000+ if AI had to describe every visual detail.

---

## 4. The Complete Pipeline (End-to-End Token Flow)

Here's how a single user request flows through the system with token minimization:

```
USER: "Create a full marketing package for Makati Tower"

┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Classify intent (GPT-5 Nano — $0.05/M tokens)          │
│ Input:   "Create a full marketing package for Makati Tower"     │
│ Output:  { intent: "marketing_package", propertyId: "makati-   │
│           tower", confidence: 0.97 }                            │
│ Tokens:  ~30 in, ~20 out = 50 tokens ($0.0000025)              │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Fetch CRM data (Supabase — 0 tokens)                   │
│ → Property details, images, agent info, comparables            │
│ → Cached for this session                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Generate content for ALL deliverables at once           │
│ (Claude Sonnet 4.6 — $3/M tokens, prompt cached at $0.30/M)    │
│                                                                 │
│ System prompt (CACHED at 90% off):                              │
│   "You are a real estate marketing AI. Given property data,     │
│    generate structured JSON for all marketing deliverables..."  │
│   ~800 tokens → cached = $0.00024 (once per session)            │
│                                                                 │
│ User prompt: property data + task instruction                   │
│   ~500 tokens → $0.0015                                         │
│                                                                 │
│ AI output (structured JSON):                                    │
│   {                                                             │
│     "brochure": { "headline": "...", "description": "...", },   │
│     "social_posts": [                                           │
│       { "platform": "facebook", "caption": "...",               │
│         "image_prompt": "Luxury condo golden hour..." },        │
│       { "platform": "instagram", "caption": "...",              │
│         "image_prompt": "..." }                                 │
│     ],                                                          │
│     "flyer": { "headline": "...", "image_prompt": "..." },      │
│     "email": { "subject": "...", "body": "..." }                │
│   }                                                             │
│   ~600 tokens → $0.0018                                         │
│                                                                 │
│ TOTAL: ~$0.00354 for content generation                         │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Document engines build files (0 AI tokens)              │
│                                                                 │
│ Carbone → brochure.docx + brochure.pdf                          │
│ PptxGenJS → presentation.pptx                                   │
│ DALL-E 3 → 4 social media images ($0.16)                       │
│ Sharp → composite text/logos onto images                        │
│ Carbone → flyer layout merged                                   │
│                                                                 │
│ TOTAL AI cost: ~$0.00354                                        │
│ TOTAL image cost: ~$0.16                                        │
│ TOTAL per marketing package: ~$0.16                             │
└─────────────────────────────────────────────────────────────────┘
```

**Without the template pattern**, AI would need to describe every document in full markup (~15,000 tokens), costing ~$0.045 and taking much longer. The template approach saves **92% on token costs**.

---

## 5. Summary: Complete Stack Reference

| Output Type | AI Model | Content Engine | Template Format | Cost/Unit |
|------------|----------|----------------|-----------------|-----------|
| **PPTX** (presentation) | Claude Sonnet | PptxGenJS | Slide component library (TS) | ~$0.005 AI + free |
| **DOCX** (brochure/report) | Claude Sonnet | Carbone.io | `.docx` (Word) | ~$0.005 AI + free |
| **PDF** (CMA/report) | Claude Sonnet | Carbone (DOCX→PDF) | `.docx` (Word) → PDF | ~$0.005 AI + free |
| **PDF** (charts/maps) | Claude Sonnet | Puppeteer + Chart.js | HTML/CSS template | ~$0.005 AI + free |
| **XLSX** (spreadsheet) | Claude Haiku | Carbone.io or ExcelJS | `.xlsx` (Excel) | ~$0.001 AI + free |
| **Image** (flyer/banner) | Claude Sonnet (prompt) + DALL-E 3 | Sharp (composite) | JSON layout template | ~$0.04 image + $0.001 AI |
| **Social post** (image) | Claude Sonnet (prompt) + DALL-E 3 | Sharp | JSON layout template | ~$0.04 image + $0.001 AI |
| **Email** (HTML) | Claude Sonnet | MJML + Handlebars | `.mjml` template | ~$0.003 AI + free |
| **Property description** (text) | Claude Sonnet | N/A (direct output) | N/A | ~$0.002 AI |

---

## 6. Nuxt 4 Project Structure (Recommended)

```
toprealty/
├── app/                          # Nuxt 4 app directory
│   ├── components/
│   │   ├── chat/
│   │   │   ├── AiChat.vue        # Main chat interface
│   │   │   ├── ChatBubble.vue    # Message bubble
│   │   │   ├── DocumentCard.vue  # Generated doc preview
│   │   │   └── ImagePreview.vue  # Generated image preview
│   │   └── admin/
│   │       └── TemplateManager.vue
│   ├── composables/
│   │   └── useDocuments.ts       # Document download/preview
│   ├── pages/
│   │   ├── index.vue             # AI Workspace (main page)
│   │   └── admin/
│   │       └── templates.vue     # Template management
│   └── app.vue
│
├── server/                       # Nuxt Nitro server
│   ├── api/
│   │   ├── chat.post.ts          # AI streaming endpoint
│   │   ├── documents/
│   │   │   ├── index.post.ts     # Generate document
│   │   │   └── [id].get.ts       # Download document
│   │   ├── images.post.ts        # Generate image
│   │   └── templates/
│   │       ├── index.get.ts      # List templates
│   │       └── index.post.ts     # Upload template
│   │
│   └── services/                 # Business logic
│       ├── ai/
│       │   ├── chat.ts           # AI orchestration
│       │   ├── tools/            # AI tool definitions
│       │   │   ├── brochure.ts
│       │   │   ├── cma.ts
│       │   │   ├── comparison.ts
│       │   │   ├── presentation.ts
│       │   │   ├── marketing.ts
│       │   │   ├── spreadsheet.ts
│       │   │   └── image.ts
│       │   └── prompts.ts        # System prompts
│       ├── documents/
│       │   ├── carbone.ts        # Carbone wrapper
│       │   ├── pptx.ts           # PptxGenJS wrapper
│       │   ├── excel.ts          # ExcelJS/Carbone wrapper
│       │   ├── pdf.ts            # Puppeteer PDF wrapper
│       │   └── image.ts          # DALL-E + Sharp wrapper
│       ├── crm/
│       │   ├── properties.ts
│       │   ├── agents.ts
│       │   └── market.ts
│       └── storage/
│           └── s3.ts             # Supabase Storage wrapper
│
├── templates/                    # Document templates
│   ├── pptx/                     # PptxGenJS slide components
│   │   ├── title.ts
│   │   ├── two-column.ts
│   │   └── chart.ts
│   ├── docx/                     # Carbone .docx templates
│   │   ├── brochure-luxury.docx
│   │   ├── brochure-standard.docx
│   │   ├── valuation-report.docx
│   │   └── cma-report.docx
│   ├── xlsx/                     # Carbone/Excel templates
│   │   ├── pricing-sheet.xlsx
│   │   └── comparison-table.xlsx
│   ├── pdf/                      # HTML→PDF templates
│   │   ├── cma-charts.html
│   │   └── market-report.html
│   └── images/                   # Image layout templates
│       ├── facebook-banner.json
│       ├── instagram-post.json
│       └── flyer-a4.json
│
├── nuxt.config.ts
├── package.json
└── .env
```

---

## 7. Key Principles (TL;DR)

1. **AI generates JSON, not files** — The text LLM outputs structured data. Separate document engines build the actual binary files (.docx, .pdf, .pptx, .xlsx, .png).

2. **Templates handle formatting** — Design team creates branded templates in native tools (Word, Excel, PowerPoint). Developers never hard-code formatting.

3. **Images need a separate model** — Text LLMs cannot generate images. You must integrate DALL-E 3, Stable Diffusion, or similar. The text LLM writes the prompt; the image model creates the pixels.

4. **One AI call, multiple outputs** — When generating a marketing package, the AI produces all content JSON in a single call. Each output type's engine then picks up its relevant slice and builds the file.

5. **Model cascade saves money** — Route simple tasks (classification, extraction) to cheap models (GPT-5 Nano at $0.05/M). Reserve Claude Sonnet for content generation. Reserve Claude Opus for complex analysis only.

6. **Prompt caching is free money** — System prompts and tool definitions are identical across chat turns. Cache them for 90% discount. Vercel AI SDK does this automatically.

7. **Nuxt 4 + Vercel AI SDK is officially supported** — `@ai-sdk/vue` with `useChat()` composable, Nuxt getting-started guide, and Vercel template. You're not hacking around missing features.
