# TopRealty AI — MVP Implementation Plan

> **Date:** July 16, 2026  
> **Stack:** Nuxt 4 + Vue 3 + OpenCode Go API (DeepSeek) + TinyFish (mock CRM)  
> **AI:** DeepSeek V4 Flash (primary) / DeepSeek V4 Pro (complex) via OpenCode Go  
> **Image Gen:** Parked for MVP  
> **Budget:** $5/mo OpenCode Go subscription (~3,450 requests/mo on V4 Pro, 31K on V4 Flash)

---

## MVP Scope

### In Scope ✅

- Nuxt 4 port of existing static chat UI
- Real AI chat powered by OpenCode Go (DeepSeek)
- Streaming AI responses (same "thinking" animation)
- TinyFish web search as mock CRM data source
- Document generation: **DOCX, PDF, XLSX, PPTX**
- Report types: CMA, property comparisons, valuations, brochures, presentations, property descriptions, marketing copy, spreadsheets

### Out of Scope ❌

- Marketing images (parked)
- Real CRM database
- User authentication
- Template management UI (use file-based templates for MVP)

---

## OpenCode Go API Setup

### Connection Details

```typescript
// server/services/ai/client.ts
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

export const opencode = createOpenAICompatible({
  baseURL: 'https://opencode.ai/zen/go/v1',
  apiKey: process.env.OPENCODE_GO_API_KEY!,
  name: 'opencode-go',
});

export const models = {
  // Primary workhorse — $0.14/Mt equivalent, 31K+ requests/month limit
  flash: opencode('deepseek-v4-flash'),
  
  // Complex analysis only — $1.60/Mt equivalent, 3,450 requests/month limit  
  pro: opencode('deepseek-v4-pro'),
};
```

### Usage Limits (OpenCode Go)

| Limit | Value | With V4 Flash | With V4 Pro |
|-------|-------|---------------|-------------|
| 5-hour | $12 | ~31K requests | ~3.4K requests |
| Weekly | $30 | ~79K requests | ~8.5K requests |
| Monthly | $60 | ~158K requests | ~17K requests |

For MVP, **DeepSeek V4 Flash should be the default** for all text generation. Only switch to V4 Pro for genuinely hard analysis tasks.

---

## Project Setup

### Initialize Nuxt 4 Project

```bash
npx nuxi@latest init toprealty-ai
cd toprealty-ai

# AI SDK
npm install ai @ai-sdk/openai-compatible @ai-sdk/vue zod

# Document engines
npm install carbone pptxgenjs exceljs puppeteer sharp

# TinyFish (for mock CRM web search)
# We'll call it via ctx_execute / fetch_content tools — no npm package needed
```

### Project Structure

```
toprealty-ai/
├── app/
│   ├── components/
│   │   ├── chat/
│   │   │   ├── AiChat.vue            # Main chat wrapper (useChat)
│   │   │   ├── ChatBubble.vue        # Message rendering
│   │   │   ├── DocumentCard.vue      # Generated doc download card
│   │   │   ├── HeroSection.vue       # Hero (visible when no messages)
│   │   │   ├── PromptMarquee.vue     # Scrolling suggestion chips
│   │   │   └── InputBar.vue          # Chat input + mic icon + send
│   │   └── ui/
│   │       └── ThinkingDots.vue      # "AI is thinking" animation
│   ├── composables/
│   │   └── useDocuments.ts           # Download tracking
│   ├── layouts/
│   │   └── default.vue
│   ├── pages/
│   │   └── index.vue                 # AI Workspace
│   ├── assets/
│   │   └── css/
│   │       └── main.css              # Tailwind + brand tokens
│   └── app.vue
│
├── server/
│   ├── api/
│   │   ├── chat.post.ts              # AI streaming + tool calling
│   │   └── documents/
│   │       └── [id].get.ts           # Download generated file
│   │
│   ├── services/
│   │   ├── ai/
│   │   │   ├── client.ts             # OpenCode Go client
│   │   │   ├── prompts.ts            # System prompts
│   │   │   └── tools/
│   │   │       ├── search.ts          # TinyFish web search tool
│   │   │       ├── brochure.ts        # Generate brochure
│   │   │       ├── cma.ts             # Generate CMA report
│   │   │       ├── comparison.ts      # Property comparison
│   │   │       ├── presentation.ts    # Generate PPTX
│   │   │       ├── spreadsheet.ts     # Generate XLSX
│   │   │       ├── description.ts     # Property descriptions
│   │   │       └── marketing.ts       # Marketing copy (no images)
│   │   │
│   │   └── documents/
│   │       ├── carbone.ts            # Carbone wrapper
│   │       ├── pptx.ts               # PptxGenJS wrapper
│   │       └── excel.ts              # ExcelJS wrapper
│   │
│   └── utils/
│       └── tinyfish.ts               # TinyFish search helper
│
├── templates/                        # Document templates
│   ├── brochure.docx                 # Carbone template
│   ├── cma-report.docx
│   ├── valuation-report.docx
│   ├── comparison-table.xlsx
│   └── pricing-sheet.xlsx
│
├── public/
│   └── assets/                       # Port existing SVG/PNG assets
│       ├── logo-top-realty.png
│       ├── logo-toprealty-gpt.png
│       └── icon-*.svg
│
├── nuxt.config.ts
├── tailwind.config.ts
├── package.json
└── .env                              # OPENCODE_GO_API_KEY=
```

---

## Implementation Tasks

### Phase 1: Project Foundation (Day 1)

#### Task 1.1: Initialize Nuxt project with dependencies

```bash
npx nuxi@latest init toprealty-ai
cd toprealty-ai
npm install ai @ai-sdk/openai-compatible @ai-sdk/vue zod
npm install carbone pptxgenjs exceljs
npm install -D @nuxtjs/tailwindcss
```

**Files:** `package.json`, `nuxt.config.ts`, `.env`

#### Task 1.2: Port brand tokens to Tailwind config

Port existing CSS variables to Tailwind theme:

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#1a4175', light: '#2a5a9a', dark: '#0f2d52' },
        maroon: { DEFAULT: '#941d28', light: '#b82432', dark: '#6e1520' },
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
    },
  },
};
```

#### Task 1.3: Port static assets

Copy all SVGs, PNGs from existing project:

```bash
cp ../toprealty/assets/* public/assets/
cp ../toprealty/favicon.svg public/
```

---

### Phase 2: Chat UI Port to Vue (Day 1-2)

#### Task 2.1: Create the main chat composable

```vue
<!-- app/pages/index.vue -->
<script setup lang="ts">
import { useChat } from '@ai-sdk/vue';

const { messages, input, handleSubmit, status, addToolOutput } = useChat({
  api: '/api/chat',
  onToolCall({ toolCall }) {
    // Handled automatically by server tools
  },
});

const hasMessages = computed(() => messages.value.length > 0);
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />
    
    <HeroSection v-if="!hasMessages" />
    <PromptMarquee v-if="!hasMessages" @select="handlePromptSelect" />
    
    <div v-if="hasMessages" class="chat-scroll">
      <ChatBubble
        v-for="msg in messages"
        :key="msg.id"
        :message="msg"
      />
    </div>
    
    <InputBar
      v-model="input"
      :loading="status === 'streaming'"
      @submit="handleSubmit"
    />
  </div>
</template>
```

#### Task 2.2: Port ChatBubble component

Port the existing rich bubble types from `ai-workspace.js`:

```vue
<!-- app/components/chat/ChatBubble.vue -->
<script setup lang="ts">
const props = defineProps<{ message: any }>();

const isUser = props.message.role === 'user';

// Parse AI responses for special content blocks:
// - checklists → <ul class="checklist">
// - data grids → <div class="grid-2col">
// - valuation boxes → <div class="valuation-box">
// - document cards → <DocumentCard>
// - tables → <table>
</script>

<template>
  <div :class="['bubble', isUser ? 'user' : 'ai']">
    <!-- AI avatar -->
    <div v-if="!isUser" class="ai-avatar">AI</div>
    
    <!-- Text content with rich rendering -->
    <div class="bubble-content" v-html="renderedContent" />
    
    <!-- Tool results: document download cards -->
    <DocumentCard
      v-if="message.toolInvocations"
      v-for="tool in message.toolInvocations"
      :key="tool.toolCallId"
      :tool="tool"
    />
  </div>
</template>
```

#### Task 2.3: Port UI components

Port: `HeroSection.vue`, `PromptMarquee.vue`, `InputBar.vue`, `ThinkingDots.vue`, `DocumentCard.vue`

---

### Phase 3: AI Chat Backend (Day 2-3)

#### Task 3.1: Set up OpenCode Go client

```typescript
// server/services/ai/client.ts
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

export const opencode = createOpenAICompatible({
  baseURL: 'https://opencode.ai/zen/go/v1',
  apiKey: process.env.OPENCODE_GO_API_KEY!,
  name: 'opencode-go',
});

export const models = {
  flash: opencode('deepseek-v4-flash'),
  pro: opencode('deepseek-v4-pro'),
};
```

#### Task 3.2: Create system prompt

```typescript
// server/services/ai/prompts.ts
export const SYSTEM_PROMPT = `You are TopRealty AI, an assistant for a Philippine real estate company.

CAPABILITIES:
- Search the web via TinyFish for property data, market trends, comparable sales
- Generate property brochures (DOCX/PDF)
- Generate CMA (Comparative Market Analysis) reports
- Compare properties
- Create valuation reports
- Build investor presentations (PPTX)
- Export data spreadsheets (XLSX)
- Write property descriptions and marketing copy
- Create marketing content (listings, emails, social captions)

RULES:
- ALWAYS use the search_web tool before answering property or market questions
- For document generation, confirm the format and property with the user first
- Use Philippine Peso (₱) for all prices
- Be professional but warm in tone
- When generating documents, include a brief summary in the chat, then provide the download

FORMAT YOUR RESPONSES using these conventions:
- Property specs: use a 2-column grid (Key | Value)
- Checklists: use bullet points with checkmark styling
- Financial data: use tables with aligned numbers
- Valuations: highlight the final figure prominently
- Document results: show a card with filename, format, and download button`;
```

#### Task 3.3: Implement TinyFish web search as mock CRM

```typescript
// server/utils/tinyfish.ts
// TinyFish is available as an MCP tool in the OpenCode environment.
// For the Nuxt server, we call it via HTTP or use the ctx_execute/crawl tools.
// MVP approach: use the built-in TinyFish fetch_content tool.

export async function searchWeb(query: string): Promise<string> {
  // For MVP: Use TinyFish search + fetch_content via the MCP protocol
  // In the Nuxt server, we can call the TinyFish API directly if we have an API key,
  // OR we route through a server-side fetch to web search endpoints.
  
  // FALLBACK MVP approach: Use a free web search API or scrape Google results
  // For now, we'll package this as a structured search tool that the AI calls
  
  const results = await $fetch('https://api.tinyfish.io/v1/search', {
    headers: { Authorization: `Bearer ${process.env.TINYFISH_API_KEY}` },
    query: { q: query, limit: 5 },
  });
  
  return JSON.stringify(results);
}
```

**MVP alternative if no TinyFish API key:** Use the OpenCode session's TinyFish tools indirectly, or use a free alternative like DuckDuckGo search.

#### Task 3.4: Implement chat endpoint with tool calling

```typescript
// server/api/chat.post.ts
import { streamText, tool } from 'ai';
import { models } from '~/server/services/ai/client';
import { SYSTEM_PROMPT } from '~/server/services/ai/prompts';
import { searchWeb } from '~/server/utils/tinyfish';
import { generateBrochure } from '~/server/services/ai/tools/brochure';
import { generateCMA } from '~/server/services/ai/tools/cma';
import { generateComparison } from '~/server/services/ai/tools/comparison';
import { generatePresentation } from '~/server/services/ai/tools/presentation';
import { generateSpreadsheet } from '~/server/services/ai/tools/spreadsheet';
import { z } from 'zod';

export default defineEventHandler(async (event) => {
  const { messages } = await readBody(event);

  const result = streamText({
    model: models.flash,  // DeepSeek V4 Flash — 31K+ requests/month limit
    system: SYSTEM_PROMPT,
    messages,
    tools: {
      // --- MOCK CRM: Web Search ---
      search_web: tool({
        description: 'Search the web for property data, market trends, comparable sales, and neighborhood information. Use this before answering ANY property, market, or location question.',
        parameters: z.object({
          query: z.string().describe('Search query. Be specific: include location, property type, and what data you need.'),
        }),
        execute: async ({ query }) => {
          const results = await searchWeb(query);
          return results;
        },
      }),

      // --- DOCUMENT GENERATION ---
      generate_brochure: tool({
        description: 'Generate a property brochure as DOCX or PDF',
        parameters: z.object({
          propertyName: z.string(),
          propertyDetails: z.string().describe('Full property description including price, specs, location'),
          format: z.enum(['docx', 'pdf', 'both']).default('pdf'),
          tone: z.enum(['luxury', 'family', 'investment', 'standard']).default('standard'),
        }),
        execute: generateBrochure,
      }),

      generate_cma: tool({
        description: 'Generate a Comparative Market Analysis (CMA) report',
        parameters: z.object({
          subjectProperty: z.string().describe('Subject property name and address'),
          subjectPrice: z.string(),
          comparableProperties: z.string().describe('List of comparable properties with prices and details'),
          marketTrends: z.string().describe('Current market trends in the area'),
        }),
        execute: generateCMA,
      }),

      generate_comparison: tool({
        description: 'Generate a property comparison report (PDF)',
        parameters: z.object({
          properties: z.array(z.object({
            name: z.string(),
            price: z.string(),
            specs: z.string(),
            pros: z.string(),
            cons: z.string(),
          })),
        }),
        execute: generateComparison,
      }),

      generate_presentation: tool({
        description: 'Generate an investor PowerPoint presentation',
        parameters: z.object({
          propertyName: z.string(),
          slides: z.array(z.object({
            title: z.string(),
            content: z.string(),
            type: z.enum(['title', 'content', 'two_column', 'chart', 'image']).default('content'),
          })),
          includeFinancials: z.boolean().default(false),
        }),
        execute: generatePresentation,
      }),

      generate_spreadsheet: tool({
        description: 'Generate an Excel spreadsheet (pricing sheet, comparison, data export)',
        parameters: z.object({
          title: z.string(),
          headers: z.array(z.string()),
          rows: z.array(z.array(z.string())),
          sheetName: z.string().default('Sheet1'),
        }),
        execute: generateSpreadsheet,
      }),
    },
    maxSteps: 10,  // Allow multi-step: search → analyze → generate
  });

  return result.toDataStreamResponse();
});
```

---

### Phase 4: Document Generation Engines (Day 3-4)

#### Task 4.1: Carbone setup (DOCX & PDF)

```typescript
// server/services/documents/carbone.ts
import carbone from 'carbone';
import fs from 'fs/promises';
import path from 'path';

const TEMPLATES_DIR = path.resolve('templates');
const OUTPUT_DIR = path.resolve('public/generated');

// Ensure output directory exists
await fs.mkdir(OUTPUT_DIR, { recursive: true });

export async function renderDocument(
  templateName: string,
  data: Record<string, any>,
  options: { convertTo?: 'docx' | 'pdf' } = {}
): Promise<{ filename: string; path: string; url: string }> {
  const templatePath = path.join(TEMPLATES_DIR, templateName);
  const ext = options.convertTo || 'pdf';
  const filename = `${Date.now()}-${templateName.replace('.docx', '')}.${ext}`;
  const outputPath = path.join(OUTPUT_DIR, filename);

  return new Promise((resolve, reject) => {
    carbone.render(templatePath, data, { convertTo: ext }, (err, result) => {
      if (err) return reject(err);
      fs.writeFile(outputPath, result);
      resolve({
        filename,
        path: outputPath,
        url: `/generated/${filename}`,
      });
    });
  });
}
```

#### Task 4.2: Brochure tool implementation

```typescript
// server/services/ai/tools/brochure.ts
import { renderDocument } from '~/server/services/documents/carbone';

export async function generateBrochure(params: {
  propertyName: string;
  propertyDetails: string;
  format: 'docx' | 'pdf' | 'both';
  tone: string;
}) {
  const data = {
    property_name: params.propertyName,
    details: params.propertyDetails,
    tone: params.tone,
    generated_date: new Date().toLocaleDateString(),
  };

  const results = [];
  
  if (params.format === 'docx' || params.format === 'both') {
    const doc = await renderDocument('brochure.docx', data, { convertTo: 'docx' });
    results.push({ format: 'DOCX', ...doc });
  }
  
  if (params.format === 'pdf' || params.format === 'both') {
    const pdf = await renderDocument('brochure.docx', data, { convertTo: 'pdf' });
    results.push({ format: 'PDF', ...pdf });
  }

  return {
    success: true,
    message: `Brochure for "${params.propertyName}" generated successfully.`,
    files: results,
  };
}
```

#### Task 4.3: PptxGenJS Presentation tool

```typescript
// server/services/documents/pptx.ts
import PptxGenJS from 'pptxgenjs';
import fs from 'fs/promises';
import path from 'path';

const OUTPUT_DIR = path.resolve('public/generated');

// Slide component library
const slideBuilders = {
  title: (slide: any, data: any) => {
    slide.background = { fill: '1a4175' }; // Navy
    slide.addText(data.title, { x: 0.5, y: 2, w: 9, fontSize: 36, color: 'FFFFFF', bold: true });
    if (data.subtitle) {
      slide.addText(data.subtitle, { x: 0.5, y: 3.5, w: 9, fontSize: 18, color: 'CCCCCC' });
    }
  },
  
  content: (slide: any, data: any) => {
    slide.addText(data.title, { x: 0.5, y: 0.5, w: 9, fontSize: 28, bold: true, color: '1a4175' });
    slide.addText(data.content, { x: 0.5, y: 1.5, w: 9, fontSize: 14, color: '333333' });
  },
  
  two_column: (slide: any, data: any) => {
    slide.addText(data.leftTitle || '', { x: 0.5, y: 0.5, w: 4.5, fontSize: 24, bold: true });
    slide.addText(data.leftContent || '', { x: 0.5, y: 1.5, w: 4.5, fontSize: 14 });
    slide.addText(data.rightTitle || '', { x: 5.5, y: 0.5, w: 4.5, fontSize: 24, bold: true });
    slide.addText(data.rightContent || '', { x: 5.5, y: 1.5, w: 4.5, fontSize: 14 });
  },
};

export async function buildPresentation(slides: any[], filename: string) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  
  for (const slideData of slides) {
    const slide = pptx.addSlide();
    const builder = slideBuilders[slideData.type as keyof typeof slideBuilders];
    if (builder) {
      builder(slide, slideData);
    }
  }

  const outputPath = path.join(OUTPUT_DIR, filename);
  await pptx.writeFile({ fileName: outputPath });
  
  return {
    filename,
    path: outputPath,
    url: `/generated/${filename}`,
  };
}
```

#### Task 4.4: Excel Spreadsheet tool

```typescript
// server/services/documents/excel.ts
import ExcelJS from 'exceljs';
import fs from 'fs/promises';
import path from 'path';

const OUTPUT_DIR = path.resolve('public/generated');

export async function buildSpreadsheet(
  title: string,
  headers: string[],
  rows: string[][],
  filename: string
) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Data');
  
  // Title row
  sheet.mergeCells(1, 1, 1, headers.length);
  const titleCell = sheet.getCell('A1');
  titleCell.value = title;
  titleCell.font = { size: 16, bold: true, color: { argb: 'FF1a4175' } };
  
  // Header row
  const headerRow = sheet.addRow(headers);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1a4175' },
  };
  
  // Data rows
  for (const row of rows) {
    sheet.addRow(row);
  }
  
  // Auto-width columns
  sheet.columns.forEach((col, i) => {
    const maxLength = Math.max(
      headers[i]?.length || 0,
      ...rows.map(r => r[i]?.length || 0)
    );
    col.width = Math.min(maxLength + 4, 40);
  });

  const outputPath = path.join(OUTPUT_DIR, filename);
  await workbook.xlsx.writeFile(outputPath);
  
  return {
    filename,
    path: outputPath,
    url: `/generated/${filename}`,
  };
}
```

---

### Phase 5: Document Templates (Day 4)

#### Task 5.1: Brochure template (`templates/brochure.docx`)

Create in Microsoft Word with Carbone tags:

```
[LOGO]                           TOP REALTY

{c.property_name}

{c.details}

---

Generated: {c.generated_date}
Tone: {c.tone}
```

#### Task 5.2: CMA Report template (`templates/cma-report.docx`)

```
COMPARATIVE MARKET ANALYSIS

Subject Property: {c.subject_name}
Subject Price: {c.subject_price}

Comparable Properties:
{c.comparables}

Market Analysis:
{c.market_trends}

Recommended Price Range: {c.recommended_range}

Generated: {c.generated_date}
```

---

### Phase 6: TinyFish Mock CRM Integration (Day 5)

#### Task 6.1: Structured search helper

Since there's no real CRM database, the AI uses TinyFish web search to find real property data, comparable sales, and market trends.

```typescript
// server/services/ai/tools/search.ts
export async function searchWeb(query: string) {
  // For MVP within OpenCode environment, TinyFish is available via MCP tools.
  // In the Nuxt server, we have two approaches:
  
  // APPROACH A: Direct TinyFish API (if API key available)
  if (process.env.TINYFISH_API_KEY) {
    const response = await $fetch('https://api.tinyfish.io/v1/search', {
      headers: { 'Authorization': `Bearer ${process.env.TINYFISH_API_KEY}` },
      params: { q: query + ' real estate Philippines', limit: 5 },
    });
    return response;
  }
  
  // APPROACH B: Fallback structured mock data for known PH locations
  // (see below)
  return getMockData(query);
}

function getMockData(query: string) {
  // MVP fallback: Return structured Philippine real estate data
  // for common queries like:
  // "Makati luxury condos 2026 prices"
  // "BGC property market trends"
  // "comparable sales Ayala Avenue Makati"
  
  // This ensures the demo works even without TinyFish API key
  return {
    source: 'web_search',
    query,
    results: [
      // Pre-seeded Philippine real estate data
    ],
  };
}
```

**For the actual MVP demo**, pre-seed a JSON file with Philippine real estate data:

```json
// server/data/mock-properties.json
[
  {
    "name": "Makati Tower",
    "type": "Luxury Condo",
    "location": "Ayala Avenue, Makati CBD",
    "price": "₱45,000,000",
    "sqm": 180,
    "bedrooms": 3,
    "bathrooms": 2.5,
    "price_per_sqm": "₱250,000",
    "amenities": ["Infinity pool", "Gym", "Concierge", "Parking x2"],
    "description": "Premium 3BR unit in Makati's most prestigious tower..."
  },
  {
    "name": "BGC Residences",
    "type": "Mid-Range Condo",
    "location": "Bonifacio Global City, Taguig",
    "price": "₱18,500,000",
    "sqm": 85,
    "bedrooms": 2,
    "bathrooms": 1,
    "price_per_sqm": "₱217,647",
    "amenities": ["Pool", "Gym", "Playground"],
    "description": "Modern 2BR in the heart of BGC..."
  }
  // ... more properties
]
```

#### Task 6.2: Update search tool to use mock data

```typescript
// server/services/ai/tools/search.ts
import mockProperties from '~/server/data/mock-properties.json';

export async function searchCRM(query: string) {
  // Step 1: Try TinyFish for live data
  let webResults = null;
  try {
    webResults = await searchWeb(query);
  } catch (e) {
    // TinyFish unavailable, proceed with mock
  }
  
  // Step 2: Search local mock database
  const localResults = mockProperties.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.location.toLowerCase().includes(query.toLowerCase()) ||
    p.type.toLowerCase().includes(query.toLowerCase())
  );
  
  return {
    web_results: webResults,
    local_properties: localResults,
    note: webResults ? 'Live + local data' : 'Mock data (TinyFish API not configured — add TINYFISH_API_KEY to .env for live search)',
  };
}
```

---

### Phase 7: Download Endpoint (Day 5)

```typescript
// server/api/documents/[id].get.ts
import { createReadStream } from 'fs';
import path from 'path';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const filePath = path.resolve('public/generated', id!);
  
  // Security: ensure path stays within generated/
  if (!filePath.startsWith(path.resolve('public/generated'))) {
    throw createError({ statusCode: 403 });
  }
  
  try {
    const stat = await fs.stat(filePath);
    const stream = createReadStream(filePath);
    
    setHeaders(event, {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${id}"`,
      'Content-Length': stat.size.toString(),
    });
    
    return stream;
  } catch {
    throw createError({ statusCode: 404, message: 'File not found' });
  }
});
```

---

### Phase 8: Polish & Test (Day 6)

#### Task 8.1: Restore all 15 chat scenarios

Port the 15 keyword-triggered scenarios from `ai-workspace.js` as part of the system prompt or prompt suggestions. The AI now handles them dynamically instead of scripted steps.

#### Task 8.2: Thinking animation

```vue
<!-- app/components/ui/ThinkingDots.vue -->
<template>
  <div class="thinking-dots">
    <span class="dot" />
    <span class="dot" />
    <span class="dot" />
  </div>
</template>

<style scoped>
.dot {
  width: 8px; height: 8px;
  background: #941d28;
  border-radius: 50%;
  animation: pulse 1.4s infinite;
}
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes pulse {
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1.2); }
}
</style>
```

#### Task 8.3: Responsive design

Port existing media queries from `styles.css` to Tailwind responsive utilities.

---

## Testing Scenarios

### Test 1: Property Brochure
```
User: "Generate a luxury brochure for Makati Tower"
AI: searches TinyFish for Makati Tower data
AI: generates brochure_content JSON
Carbone: renders brochure.docx → brochure.pdf
AI: responds with summary + download link
```

### Test 2: CMA Report
```
User: "Run a CMA for a 3BR condo in BGC valued at ₱18M"
AI: searches for comparable BGC condo sales
AI: analyzes price/sq.m., market trends
AI: generates CMA content with price recommendation
Carbone: renders cma-report.docx → PDF
AI: responds with valuation summary + download
```

### Test 3: Investor Presentation
```
User: "Create an investor presentation for Makati Tower"
AI: searches for Makati Tower + market data
AI: generates slide content JSON (title, metrics, comparables, projections)
PptxGenJS: builds 10-slide presentation
AI: responds with slide overview + download
```

### Test 4: Property Comparison Excel
```
User: "Export a comparison of all Makati luxury condos under ₱50M"
AI: searches for Makati luxury condos
AI: structures data as spreadsheet rows
ExcelJS: builds formatted .xlsx
AI: responds with summary table + download
```

### Test 5: Marketing Copy
```
User: "Write 5 Facebook captions for Makati Tower listing"
AI: generates 5 caption variations
AI: responds with inline captions (no file needed)
```

---

## Cost Estimate (MVP)

| Item | Monthly Cost |
|------|-------------|
| OpenCode Go subscription | **$5** (first month) |
| Nuxt hosting (Vercel/Netlify free tier) | **$0** |
| TinyFish API (optional, mock data works without it) | **$0** |
| Carbone (open-source AGPL) | **$0** |
| **Total** | **$5/month** |

---

## .env File

```bash
# Required: OpenCode Go API key (from https://opencode.ai/zen)
OPENCODE_GO_API_KEY=sk-zen-xxxxxxxxxxxx

# Optional: TinyFish API key for live web search
# Without this, the app uses mock Philippine real estate data
TINYFISH_API_KEY=
```

---

## Commands

```bash
# Development
npm run dev          # http://localhost:3000

# Build
npm run build

# Test a document generation
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Generate a brochure for Makati Tower"}]}'
```

---

## Document Templates (Quick Start)

### `templates/brochure.docx`

Create in Microsoft Word:

1. Add Top Realty logo at top
2. Add navy header bar with `{c.property_name}`
3. Add property description: `{c.details}`
4. Add footer: `Generated on {c.generated_date} | TopRealty AI`

Carbone tags: `{c.field_name}` for flat data, `{c.array[i].field}` for loops.

### `templates/cma-report.docx`

1. Title: "Comparative Market Analysis"
2. Subject: `{c.subject_name}` — `{c.subject_price}`
3. Comparables table with Carbone loop
4. Market analysis: `{c.market_trends}`
5. Recommended range: `{c.recommended_range}`
