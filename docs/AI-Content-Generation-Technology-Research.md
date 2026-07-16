# AI Assistant — Content Generation from CRM: Technology Research

> **Date:** July 16, 2026  
> **Status:** Research complete — awaiting design approval  
> **Author:** AI Architecture Research (powered by TinyFish web research)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Project State](#2-current-project-state)
3. [AI Framework Selection](#3-ai-framework-selection)
4. [AI Model Selection: What the AI Can & Cannot Do](#4-ai-model-selection-what-the-ai-can--cannot-do)
5. [Document Generation Technology](#5-document-generation-technology)
6. [Recommended Backend Architecture](#6-recommended-backend-architecture)
7. [Token Optimization Strategy](#7-token-optimization-strategy)
8. [Technology Stack Recommendation](#8-technology-stack-recommendation)
9. [Comparative Cost Analysis](#9-comparative-cost-analysis)
10. [Risk Assessment](#10-risk-assessment)
11. [Next Steps](#11-next-steps)

---

## 1. Executive Summary

Top Realty needs to transform from a **static HTML/CSS prototype** of an AI workspace into a **production-grade, AI-powered content generation system** integrated with a real estate CRM. The system must generate DOCX, PDF, XLSX, PPTX, images, and specialized reports (CMA, valuations, comparisons) from CRM data via natural language chat.

**Primary recommendation:** **Next.js 15 + Vercel AI SDK + Supabase + Carbone.io** — a stack that minimizes token consumption, maximizes developer velocity, and provides production-grade document generation with native streaming AI chat.

**Expected monthly AI costs:** $50–$300 at production scale (with optimization strategies applied).

---

## 2. Current Project State

### What Exists Today

| Component | Status | Details |
|-----------|--------|---------|
| Frontend UI | ✅ Prototype | Static HTML/CSS/JS — single-page chat interface with 15 scripted scenarios |
| AI Chat | ❌ Simulated | `ai-workspace.js` — keyword matching, no real AI backend |
| Document Generation | ❌ Simulated | HTML mockups only, no actual file generation |
| CRM Backend | ❌ None | No database, no API, no authentication |
| Build System | ❌ None | Vanilla JS, no framework, no package manager |

### Current UI Features Worth Preserving

- Chat bubble design system (rich templates: checklists, grids, tables, valuation boxes, property cards, email previews, banner previews)
- 15 documented use cases (brochure, CMA, investor presentation, valuation, marketing package, etc.)
- Autocomplete suggestion system
- Thinking animation pattern
- Responsive design down to 380px
- Brand design tokens (navy `#1a4175`, maroon `#941d28`, Inter font)

**Key insight:** The prototype validates UX patterns. The rebuild should preserve these while adding a real backend.

---

## 3. AI Framework Selection

### The Contenders

| Criteria | **Vercel AI SDK 6** | LangChain JS | OpenAI SDK |
|----------|---------------------|--------------|------------|
| **Version** | 6.0.27 (Jan 2026) | 1.2.7 (Jan 2026) | 6.15.0 (Dec 2025) |
| **Bundle Size** | 67.5 kB gzipped | 101.2 kB gzipped | 34.3 kB gzipped |
| **Edge Runtime** | ✅ Native | ❌ Incompatible | ⚠️ Via `openai-edge` |
| **React/Next.js Hooks** | ✅ `useChat()`, `useCompletion()` | ❌ Manual only | ❌ Manual only |
| **Streaming** | ✅ Built-in (20 lines) | ⚠️ Async iterators (manual React wiring) | ⚠️ SSE events (manual wiring) |
| **Provider Support** | 25+ (OpenAI, Anthropic, Google, etc.) | 50+ | OpenAI-only |
| **Tool Calling** | ✅ First-class, Zod schemas | ✅ Mature, pre-built agents | ❌ Manual loops (150+ LOC) |
| **RAG Support** | ⚠️ Via adapters | ✅ Comprehensive built-in | ❌ Manual |
| **Weekly Downloads** | N/A | 1.3M | 8.8M |
| **GitHub Stars** | 20.8k | 16.7k | 10.5k |
| **Best For** | Next.js apps, streaming chat, document gen | Complex agents, heavy RAG | Simple OpenAI-only integrations |

### Decision: **Vercel AI SDK 6**

**Why Vercel AI SDK wins for this project:**

1. **Streaming-first architecture** — The current UI already has a streaming "thinking" animation. Vercel AI SDK's `useChat()` hook provides this out of the box with zero custom SSE code, reducing the chat UI from ~590 lines of vanilla JS to ~100 lines of React.

2. **Tool calling for document generation** — Each document type (brochure, CMA, valuation, etc.) becomes a typed tool that the AI can call. The AI SDK's `tool()` API with Zod schemas is the cleanest way to expose document generation capabilities:
   ```typescript
   const generateBrochure = tool({
     description: 'Generate a property brochure from CRM data',
     parameters: z.object({
       propertyId: z.string(),
       format: z.enum(['docx', 'pdf']),
       template: z.enum(['luxury', 'standard', 'investment']).optional(),
     }),
     execute: async ({ propertyId, format, template }) => {
       // Fetch property data, merge with template, generate file
     },
   });
   ```

3. **Provider flexibility** — Not locked into OpenAI. Can use Claude for complex analysis, GPT-5 Nano for simple classification, and switch during outages.

4. **Edge deployment** — Deploy on Vercel Edge for global low-latency responses.

5. **Provider caching** — Both OpenAI and Anthropic offer 90% discount on cached prompts — Vercel AI SDK makes this trivial.

**When LangChain would be considered:** Only if the project needed autonomous multi-step agents with complex retrieval pipelines. For document generation (which is fundamentally tool-calling), Vercel AI SDK is the better fit.

---

## 4. AI Model Selection: What the AI Can & Cannot Do

A critical distinction that's often misunderstood: **the AI model generates structured text (JSON), not binary files or images.** The document engine turns that JSON into actual files.

### The Separation of Concerns

```
┌──────────────────────┐     JSON      ┌──────────────────────┐
│   AI MODEL (LLM)     │ ────────────► │  DOCUMENT ENGINE     │
│                      │               │                      │
│ Generates:           │               │ Generates:           │
│ • Property copy      │               │ • .docx file         │
│ • Market analysis    │               │ • .pdf file          │
│ • Valuation data     │               │ • .pptx file         │
│ • Report structure   │               │ • .xlsx file         │
│ • Image descriptions │               │ • .png/.jpg image    │
│   (prompts for gen)  │               │   (via image model)  │
└──────────────────────┘               └──────────────────────┘
```

### Can OpenCode Go API (DeepSeek v4) Suffice for Testing?

**Short answer: Yes, for text-based testing. No, for image generation.**

| Capability | DeepSeek v4 (OpenCode) | Production Need | Gap? |
|------------|------------------------|-----------------|------|
| Property descriptions | ✅ Excellent | Text generation | None |
| Marketing copy | ✅ Excellent | Text generation | None |
| Structured JSON output | ✅ Good | Tool calling input | Minor — tool calling via Vercel AI SDK is smoother |
| Market analysis | ✅ Good | Reasoning | Claude Opus/GPT-5.5 better for financial analysis |
| CMA data extraction | ✅ Yes | Structured extraction | Works but no native JSON mode |
| **Image generation** | ❌ **Cannot** | Flyers, banners, social graphics | **Requires separate image model** |
| **PPTX generation** | ❌ **Cannot directly** | Generate PPTX files | AI writes content → PptxGenJS/Carbone builds file |
| **PDF generation** | ❌ **Cannot directly** | Generate PDF files | AI writes content → Carbone/Puppeteer builds file |
| **DOCX generation** | ❌ **Cannot directly** | Generate DOCX files | AI writes content → Carbone builds file |
| Streaming | ✅ SSE support | Real-time chat UX | Works, but manual implementation needed |
| Tool/function calling | ⚠️ Limited | Document generation tools | Vercel AI SDK solves this elegantly |

### The Production AI Stack

Since no single AI model does everything, the system needs a **composite AI layer**:

#### Tier 1: Text Generation (LLM) — The Brain

This is the core model that understands user intent, extracts parameters, and generates content.

| Model | Use Case | Cost/M input tokens |
|-------|----------|---------------------|
| **Claude Sonnet 4.6** | Primary workhorse: content generation, report sections, property descriptions, tool calling | $3.00 |
| **GPT-5.5** | Complex financial analysis, multi-property comparisons, ROI calculations | $5.00 |
| **Claude Haiku 4.5** | Data extraction, intent classification, quick lookups | $1.00 |
| **GPT-5 Nano** | Routing, classification, simple extraction | $0.05 |
| **DeepSeek v4 (OpenCode)** | Development & testing of text flows, prompt engineering, local prototyping | Free (via OpenCode) |

**Recommendation:** Use DeepSeek/OpenCode during development for text-based testing (it's free and capable). Switch to Claude Sonnet 4.6 for production (better tool calling, native structured outputs, prompt caching at 90% off).

#### Tier 2: Image Generation — The Visual Designer

**This is a completely separate capability** — no text LLM (including DeepSeek, Claude, or GPT) can generate images directly.

| Service | Model | Cost | Best For |
|---------|-------|------|----------|
| **OpenAI DALL-E 3** | DALL-E 3 | $0.040/image (1024×1024) | Property flyers, social media graphics |
| **Stability AI** | Stable Diffusion XL | $0.008–0.036/image | High-volume, self-hosted option |
| **Midjourney** | (proprietary) | $10–60/mo subscription | Premium marketing visuals |
| **Replicate** | Flux, SDXL, etc. | Pay-per-use | Flexible, many models available |
| **Google Imagen** | Imagen 3 | $0.02–0.04/image | Good text rendering in images |

**Recommendation:** Start with **DALL-E 3 via OpenAI API** (simplest integration, already in the OpenAI ecosystem). Budget ~$20–50/month for image generation at moderate usage.

**How it works in practice:**

```typescript
// 1. AI (text LLM) generates the image prompt from property data
const imagePrompt = await ai.generateImagePrompt({
  property: { name: "Makati Luxury Tower", type: "condo", price: "₱45M" },
  format: "facebook-banner",
  style: "luxury-real-estate",
});
// → "Professional real estate photo of a modern glass high-rise condo in Makati skyline
//    at golden hour, luxury lifestyle aesthetic, clean composition, 1200x630"

// 2. Image model generates the actual image
const imageUrl = await openai.images.generate({
  model: "dall-e-3",
  prompt: imagePrompt,
  size: "1792x1024",
  quality: "hd",
});

// 3. Optionally composite with Sharp (add logo, text overlay, branding)
const finalBanner = await sharp(imageBuffer)
  .composite([logoOverlay])
  .jpeg()
  .toBuffer();
```

#### Tier 3: Document Assembly — The Factory

This is not an AI model — it's a library/service that takes AI-generated structured data and builds actual files.

| Output | How the AI Helps | What Actually Builds the File |
|--------|-----------------|-------------------------------|
| **.docx** (brochure) | AI writes property description, key features, neighborhood highlights as JSON | Carbone.io merges JSON into Word template |
| **.pdf** (CMA report) | AI analyzes comparables, writes narrative, calculates metrics as JSON | Carbone.io renders template to PDF |
| **.pptx** (investor pres.) | AI structures slides: titles, bullet points, financial projections as JSON | PptxGenJS or Carbone builds PPTX from JSON |
| **.xlsx** (pricing sheet) | AI extracts and organizes property data, formulas as structured arrays | ExcelJS or Carbone builds XLSX from JSON |
| **.png/.jpg** (flyer, banner) | AI writes the **prompt** for the image model | DALL-E 3 generates image; Sharp composites branding |
| **.png/.jpg** (social post) | AI writes caption + image prompt | DALL-E 3 generates image; Sharp adds text overlay |

### Concrete Example: Generating a Property Flyer

```
USER: "Create a luxury flyer for the Makati Tower listing"

     ┌─────────────────────────────────────────────┐
     │  STEP 1: Text LLM (Claude Sonnet)           │
     │  → Understands intent: "flyer"              │
     │  → Extracts: propertyId="makati-tower"      │
     │  → Generates headline: "Makati Tower —      │
     │    Luxury Living in the Heart of the City"  │
     │  → Generates image prompt for DALL-E        │
     │  → Outputs: structured JSON                 │
     └──────────────┬──────────────────────────────┘
                    │ JSON payload
     ┌──────────────▼──────────────────────────────┐
     │  STEP 2: Image Model (DALL-E 3)             │
     │  → Takes the prompt from Step 1             │
     │  → Generates a 1792×1024 hero image         │
     │  → Returns image URL/buffer                 │
     └──────────────┬──────────────────────────────┘
                    │ image buffer
     ┌──────────────▼──────────────────────────────┐
     │  STEP 3: Image Compositor (Sharp)           │
     │  → Overlays Top Realty logo                 │
     │  → Adds headline text                       │
     │  → Adds property specs (3BR, 2BA, 120sqm)   │
     │  → Adds agent contact info                  │
     │  → Saves final PNG to S3                    │
     └──────────────┬──────────────────────────────┘
                    │
     ┌──────────────▼──────────────────────────────┐
     │  RESULT: Polished flyer returned to user    │
     └─────────────────────────────────────────────┘
```

### Summary: Can OpenCode/DeepSeek Handle Testing?

| Task | Can OpenCode Test It? | Notes |
|------|----------------------|-------|
| Chat flow, intent understanding | ✅ Yes | DeepSeek is a capable text LLM |
| Property description generation | ✅ Yes | Text output is text output |
| Market analysis text | ✅ Yes | Quality may differ from Claude/GPT |
| Structured JSON output | ✅ Yes | Prompt engineering can handle this |
| Tool calling simulation | ⚠️ Sort of | Can simulate with prompts, but real tool calling needs Vercel AI SDK integration |
| **Image generation** | ❌ **No** | No LLM generates images — this is a separate capability. Must integrate a real image model for testing visuals |
| **File generation (.docx, .pdf, .pptx)** | ❌ **No** | LLMs output text, not binary files. These require the document engine (Carbone, PptxGenJS, etc.) to be built first |
| Token cost optimization | ✅ Yes | Can prototype prompt caching strategies and model cascading logic |

**Verdict:** OpenCode Go API with DeepSeek is **perfectly adequate for testing the text-based AI flows** (chat, content generation, data extraction). But you'll need to integrate a real **image generation API** (DALL-E or similar) and a **document engine** (Carbone + PptxGenJS) to test the full pipeline end-to-end. These are not things any text LLM can replace — they are fundamentally different capabilities.

---

## 5. Document Generation Technology

### The Landscape

Three approaches exist for programmatic document generation:

| Approach | Tools | Pros | Cons |
|----------|-------|------|------|
| **Template Engine** | Carbone.io, Docmosis, docxtemplater | WYSIWYG templates (design in Word/Excel), separation of design from code, output to PDF/DOCX/XLSX | Licensing cost for some (Carbone is AGPL), requires template maintenance |
| **Programmatic Library** | python-docx, docx.js, ReportLab, WeasyPrint | Full control, no external service, free | Heavy code for complex layouts, hard to maintain visual quality |
| **Headless Browser / HTML-to-PDF** | Puppeteer + HTML/CSS, WeasyPrint | Familiar web technologies, pixel-perfect designs | Large runtime (Chromium), slower generation |

### Recommended: **Hybrid Approach**

#### Tier 1: Carbone.io for Structured Documents (Primary)

**Carbone.io** is the open-source standard for template-based document generation. It's a **template engine** — design templates in Word/Excel/PowerPoint, feed JSON data, get polished output.

**Why Carbone:**
- **Non-developers can design templates** — Marketing team creates DOCX/PPTX templates in Microsoft Office
- **Outputs everything:** PDF, DOCX, XLSX, PPTX, ODS, HTML, CSV, TXT
- **AGPL open-source** (free for open-source, commercial license for proprietary)
- **Logic in templates:** Conditional sections, loops, filters, formatters
- **JSON data input** — perfect for AI-generated structured data
- **Proven in production:** Used by enterprises worldwide for report generation
- **Node.js SDK** available for seamless Next.js integration

**Use for:** Property brochures, CMA reports, valuation reports, investor presentations, market reports, agent performance reports, property comparison reports.

```
Template (DOCX): "Property {property.name} valued at {property.valuation|currency}"
JSON:          { "property": { "name": "Makati Tower", "valuation": 25000000 } }
Output:        "Property Makati Tower valued at ₱25,000,000.00"
```

#### Tier 2: HTML-to-PDF via WeasyPrint/Puppeteer for Marketing Materials

**Use for:** Flyers, banners, social media graphics, email campaigns — anything with heavy visual design that doesn't fit a template paradigm.

```typescript
// AI generates HTML with CRM data, rendered to PDF/image
const html = await ai.generateMarketingFlyer(propertyData);
const pdf = await renderToPDF(html);
```

#### Tier 3: Sharp/Canvas for Image Generation

**Use for:** Social media posts, Facebook banners, Instagram stories, open house posters.

```typescript
import sharp from 'sharp';
// Compose property image + text overlay + branding
const banner = await sharp(propertyImage)
  .composite([logoOverlay, textOverlay])
  .resize(1200, 630)
  .jpeg()
  .toBuffer();
```

### Document Generation Library Comparison

| Library | DOCX | PDF | XLSX | PPTX | Images | Open Source | Best For |
|---------|------|-----|------|------|--------|-------------|----------|
| **Carbone.io** | ✅ | ✅ | ✅ | ✅ | ❌ | AGPL | Structured reports, templates |
| **docxtemplater** | ✅ | ❌ | ❌ | ❌ | ❌ | MIT | DOCX-only templates |
| **python-docx** | ✅ | ❌ | ❌ | ❌ | ❌ | MIT | Python DOCX generation |
| **ReportLab** | ❌ | ✅ | ❌ | ❌ | ❌ | BSD | Python PDF |
| **WeasyPrint** | ❌ | ✅ | ❌ | ❌ | ❌ | BSD | HTML-to-PDF |
| **Puppeteer** | ❌ | ✅ | ❌ | ❌ | ✅ | Apache 2.0 | Browser-based PDF/screenshots |
| **ExcelJS** | ❌ | ❌ | ✅ | ❌ | ❌ | MIT | Node.js XLSX |
| **PptxGenJS** | ❌ | ❌ | ❌ | ✅ | ❌ | MIT | Node.js PPTX |
| **Sharp** | ❌ | ❌ | ❌ | ❌ | ✅ | Apache 2.0 | Image composition |

**Recommendation:** Start with Carbone.io as the primary engine. Fall back to Puppeteer + HTML for marketing visuals, Sharp for social media images.

---

## 6. Recommended Backend Architecture

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Next.js)                          │
│  ┌─────────────┐  ┌──────────────────┐  ┌───────────────────┐  │
│  │ Chat UI      │  │ Document Preview │  │ Template Manager  │  │
│  │ (useChat)    │  │ (iframe/embed)  │  │ (Admin UI)        │  │
│  └──────┬───────┘  └────────┬─────────┘  └────────┬──────────┘  │
└─────────┼───────────────────┼─────────────────────┼─────────────┘
          │                   │                     │
┌─────────┼───────────────────┼─────────────────────┼─────────────┐
│         ▼                   ▼                     ▼              │
│                    NEXT.JS API ROUTES                             │
│  ┌───────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ /api/chat     │  │ /api/documents   │  │ /api/templates   │  │
│  │ (AI streaming)│  │ (generate/serve) │  │ (CRUD)           │  │
│  └───────┬───────┘  └────────┬─────────┘  └────────┬─────────┘  │
└──────────┼───────────────────┼─────────────────────┼────────────┘
           │                   │                     │
┌──────────┼───────────────────┼─────────────────────┼────────────┐
│          ▼                   ▼                     ▼             │
│                      SERVICE LAYER                                │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ AI Service   │  │ Doc Engine   │  │ CRM Service            │ │
│  │ ─ Vercel AI  │  │ ─ Carbone    │  │ ─ Property queries     │ │
│  │   SDK        │  │ ─ Puppeteer   │  │ ─ Comparable sales     │ │
│  │ ─ Tool defs  │  │ ─ Sharp       │  │ ─ Agent data           │ │
│  │ ─ Caching    │  │ ─ S3 Storage  │  │ ─ Market stats         │ │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬────────────┘ │
└─────────┼─────────────────┼──────────────────────┼──────────────┘
          │                 │                      │
┌─────────┼─────────────────┼──────────────────────┼──────────────┐
│         ▼                 ▼                      ▼               │
│                      DATA LAYER                                   │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │                    SUPABASE (PostgreSQL)                      ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ ││
│  │  │properties│  │  agents  │  │ templates│  │ documents    │ ││
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘ ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ ││
│  │  │  sales   │  │  market  │  │  users   │  │ pgvector     │ ││
│  │  │ (comps)  │  │  _data   │  │  (auth)  │  │ (embeddings) │ ││
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘ ││
│  └──────────────────────────────────────────────────────────────┘│
│  ┌──────────────────────────────────────────────────────────────┐│
│  │                SUPABASE STORAGE (S3-compatible)               ││
│  │  ┌──────────────────┐  ┌──────────────────────────────────┐  ││
│  │  │ Generated Docs    │  │ Property Images & Assets         │  ││
│  │  └──────────────────┘  └──────────────────────────────────┘  ││
│  └──────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

#### 1. Next.js 15 App Router as the Single Backend

- **No separate API server needed** — API routes serve as the backend
- **Streaming responses** via `Route Handlers` for AI chat
- **Server Components** for document previews and template management UI
- **Edge Runtime** for `/api/chat` (low latency), Node.js runtime for document generation (needs filesystem)

#### 2. Supabase as the CRM + AI Backend

Why Supabase over alternatives:

| Feature | Supabase | Firebase | Custom Postgres |
|---------|----------|----------|-----------------|
| **Database** | PostgreSQL (full SQL) | NoSQL (Firestore) | Self-managed |
| **pgvector** | ✅ Built-in | ❌ | ✅ Manual setup |
| **Auth** | ✅ Row-Level Security | ✅ | ❌ Manual |
| **Storage** | ✅ S3-compatible | ✅ | ❌ Manual |
| **Realtime** | ✅ WebSocket | ✅ | ❌ Manual |
| **Edge Functions** | ✅ Deno | ✅ | ❌ |
| **Pricing** | Free tier → $25/mo Pro | Free tier → pay-as-go | Server costs |
| **Open Source** | ✅ | ❌ | N/A |

**Critical advantage:** `pgvector` for storing property embeddings — enables semantic search ("find luxury properties near Makati CBD with high ROI potential") without external vector databases.

#### 3. Service Layer Pattern

Each service is a standalone TypeScript module with a clear interface:

```
src/
├── services/
│   ├── ai/
│   │   ├── chat.ts          # AI chat orchestration
│   │   ├── tools/
│   │   │   ├── brochure.ts   # Generate brochure tool
│   │   │   ├── cma.ts       # CMA report tool
│   │   │   ├── comparison.ts # Property comparison tool
│   │   │   ├── valuation.ts  # Valuation report tool
│   │   │   ├── presentation.ts # Investor presentation tool
│   │   │   ├── marketing.ts  # Marketing content tool
│   │   │   └── search.ts     # Natural language search tool
│   │   └── prompts.ts        # System prompts & templates
│   ├── documents/
│   │   ├── carbone.ts        # Carbone template engine
│   │   ├── pdf.ts            # HTML-to-PDF via Puppeteer
│   │   └── image.ts          # Image generation via Sharp
│   ├── crm/
│   │   ├── properties.ts     # Property queries
│   │   ├── agents.ts         # Agent queries
│   │   ├── sales.ts          # Sales/comparables queries
│   │   └── market.ts         # Market data queries
│   └── storage/
│       └── documents.ts      # S3 document storage
```

#### 4. API Route Design

```
POST   /api/chat              # Streaming AI chat (Edge Runtime)
GET    /api/documents/:id     # Download generated document
POST   /api/documents         # Trigger document generation
GET    /api/templates         # List available templates
POST   /api/templates         # Upload new template
PUT    /api/templates/:id     # Update template
DELETE /api/templates/:id     # Delete template
GET    /api/properties/search # Semantic property search
GET    /api/properties/:id    # Property details
GET    /api/comparables/:id   # Comparable sales for a property
```

---

## 7. Token Optimization Strategy

Token consumption is the primary cost driver for AI-powered systems. Based on research from production deployments and the 10Clouds token optimization guide, here's the multi-layered strategy:

### Layer 1: Prompt Caching (90% Savings on Repeated Context)

Both OpenAI and Anthropic offer prompt caching — reuse the system prompt and tool definitions across chat turns instead of resending them.

| Model | Standard Input | Cached Input | Savings |
|-------|---------------|--------------|---------|
| GPT-5.5 | $5/M tokens | $0.50/M tokens | **90%** |
| Claude Opus 4.7 | $5/M tokens | $0.50/M tokens | **90%** |
| Claude Sonnet 4.6 | $3/M tokens | $0.30/M tokens | **90%** |
| Claude Haiku 4.5 | $1/M tokens | $0.10/M tokens | **90%** |

**Implementation:** Vercel AI SDK supports this natively. The system prompt (CRM context, tool definitions, formatting rules) is cached and reused across all chat turns in a session.

### Layer 2: Model Cascading (60% Savings)

Not every request needs GPT-5.5 or Claude Opus. Route by complexity:

| Task Type | Model | Cost/M Input | Example |
|-----------|-------|-------------|---------|
| Intent classification | GPT-5 Nano | $0.05 | "What kind of document does the user want?" |
| Data extraction | Claude Haiku 4.5 | $1.00 | "Extract property ID and format from this query" |
| Content generation | Claude Sonnet 4.6 | $3.00 | "Write a luxury property description" |
| Complex analysis | GPT-5.5 / Claude Opus 4.7 | $5.00 | "Compare ROI across 5 properties with market trends" |

```typescript
function routeModel(prompt: string, taskType: string): string {
  if (taskType === 'classification') return 'gpt-5-nano';       // $0.05/M
  if (taskType === 'extraction')    return 'claude-haiku-4-5';  // $1/M
  if (taskType === 'generation')    return 'claude-sonnet-4-6'; // $3/M
  if (taskType === 'analysis')      return 'claude-opus-4-7';   // $5/M
  return 'claude-sonnet-4-6'; // default workhorse
}
```

### Layer 3: Structured Outputs (30% Output Token Savings)

Force JSON mode for structured data extraction — eliminates verbose prose wrappers:

```
Without structured output: "The property valuation is ₱25,000,000 based on comparable sales..."
With structured output:    {"valuation":25000000,"currency":"PHP","confidence":0.92}
```

Output savings: typically 30%+ fewer tokens. Vercel AI SDK supports this with Zod schemas and `response_format`.

### Layer 4: Document Templates (Massive Savings)

**The biggest token win:** Don't make the AI generate the entire document content. Instead:

1. **AI extracts structured data** from the conversation (property ID, format, tone, sections)
2. **AI generates only the variable content** (property description text, analysis paragraphs)
3. **Template engine (Carbone)** merges data into pre-designed templates
4. **AI never outputs formatting, layout, or boilerplate**

This approach means the AI outputs ~200–500 tokens of structured data instead of 5,000–20,000 tokens of full document markup.

### Layer 5: Context Window Management

- **Keep chat history trimmed** — last 10 messages only, summarize older context
- **RAG for CRM data** — fetch relevant data on demand instead of loading full CRM into context
- **pgvector embeddings** — semantic search retrieves only the most relevant properties/comps

### Layer 6: Batching (50% Discount)

For non-urgent document generation (batch reports, overnight CMA generation):
- OpenAI offers 50% discount on batch API calls
- 24-hour completion window acceptable for scheduled reports

### Projected Token Costs

**Scenario: 1,000 document generations/month**

| Without Optimization | With Optimization | Savings |
|---------------------|-------------------|---------|
| ~$800–1,200/month | ~$50–300/month | **75–95%** |

Assumptions: Prompt caching active, model cascading, structured outputs, template-based generation, 10-message chat history limit.

---

## 8. Technology Stack Recommendation

### Production Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | Next.js 15 (App Router) + React 19 | Server Components, streaming, built-in API routes |
| **Styling** | Tailwind CSS v4 | Rapid UI, matches existing design system |
| **AI Framework** | Vercel AI SDK 6 | Streaming chat, tool calling, provider flexibility |
| **AI Models** | Claude Sonnet 4.6 (primary) + GPT-5 Nano (routing) + Claude Opus 4.7 (complex analysis) | Cost-optimized model cascade |
| **Database** | Supabase (PostgreSQL + pgvector) | CRM data, vector search, auth, storage |
| **Auth** | Supabase Auth | Built-in RLS, email/password, social login |
| **Document Engine** | Carbone.io (structured docs) + Puppeteer (HTML-to-PDF for marketing) + Sharp (images) | Multi-format output from templates |
| **File Storage** | Supabase Storage (S3) | Generated documents, property images, templates |
| **Deployment** | Vercel (frontend + API routes) + Supabase Cloud | Edge streaming, global CDN, managed Postgres |
| **Monitoring** | Helicone or Langfuse | Token tracking, cost monitoring, LLM observability |
| **Type Safety** | TypeScript + Zod | End-to-end type safety, AI tool parameter validation |

### Development Stack (Recommended)

For rapid prototyping and the developer experience the team expects:

| Tool | Purpose |
|------|---------|
| **TypeScript** (strict) | Primary language |
| **Prisma** | ORM for Supabase Postgres |
| **Zod** | Schema validation (shared between API and AI tools) |
| **Vitest** | Testing framework |
| **Playwright** | E2E testing (chat UI, document generation) |
| **ESLint + Prettier** | Code quality |

### Why NOT Other Stacks

| Alternative | Why Rejected |
|-------------|--------------|
| **Python/FastAPI backend** | Two codebases, no streaming UI integration, token overhead from separate services |
| **LangChain (primary)** | Too heavy for document generation use case; edge-incompatible; Vercel AI SDK handles tool calling cleaner |
| **Firebase** | NoSQL doesn't fit relational CRM data; no native vector search |
| **Custom Express/Node backend** | More infrastructure to manage; Next.js API routes are sufficient |
| **Docmosis** | Proprietary, more expensive, less Node.js-native than Carbone |
| **OpenAI-only** | Vendor lock-in; higher cost; no provider flexibility during outages |

---

## 9. Comparative Cost Analysis

### Monthly Infrastructure Costs (Estimated)

| Service | Free Tier | Pro/Startup | Production (500 users) |
|---------|-----------|-------------|------------------------|
| **Vercel** | $0 (hobby) | $20/mo (Pro) | $100/mo (team) |
| **Supabase** | $0 (2 projects) | $25/mo (Pro) | $100/mo (Team) |
| **Carbone** | $0 (AGPL self-host) | $0 (self-host) | $500–1,500/yr (commercial) |
| **AI API (Claude/OpenAI)** | N/A | $50–150/mo | $200–500/mo |
| **Helicone** | $0 (1K req/day) | $0 | $20/mo (growth) |
| **Total** | **$0 (dev)** | **~$100–200/mo** | **~$500–800/mo** |

AI costs assume token optimization strategies applied. Without optimization, AI costs could be 3–5x higher.

---

## 10. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **AI hallucination in valuations** | Medium | High | Structured outputs + verification against CRM data; human review step before finalizing |
| **Carbone AGPL licensing** | Low | Medium | Self-host Carbone community edition for development; budget for commercial license if needed |
| **Provider outage (OpenAI/Anthropic)** | Low | High | Vercel AI SDK multi-provider support — fall back to alternative model automatically |
| **Token cost overruns** | Medium | Medium | Set hard token limits per request; Helicone monitoring with alerts; model cascading |
| **Template maintenance burden** | Medium | Low | Carbone templates use standard Office formats — marketing team can maintain |
| **Supabase vendor lock-in** | Low | Medium | Supabase is open source; can self-host Postgres if needed |

---

## 11. Next Steps

### Immediate Actions

1. **Set up Next.js 15 project** with TypeScript, Tailwind CSS v4, and Vercel AI SDK
2. **Create Supabase project** with schema for properties, agents, sales, market data
3. **Port existing UI components** to React (chat bubbles, document previews, property cards)
4. **Implement `/api/chat` endpoint** with streaming and basic tool definitions
5. **Set up Carbone** with 2–3 initial templates (brochure, valuation, CMA)

### Recommended Phases

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1: Foundation** | 2 weeks | Next.js + Supabase + basic chat + 2 document types |
| **Phase 2: Document Engine** | 2 weeks | Carbone integration, all template types, S3 storage |
| **Phase 3: AI Intelligence** | 2 weeks | Model cascading, RAG search, prompt caching, token monitoring |
| **Phase 4: Polish** | 1 week | Template library UI, admin panel, analytics, error handling |

---

## Appendix: Key References

- [Vercel AI SDK Documentation](https://ai-sdk.dev/)
- [LangChain vs Vercel AI SDK vs OpenAI SDK — Strapi Guide 2026](https://strapi.io/blog/langchain-vs-vercel-ai-sdk-vs-openai-sdk-comparison-guide)
- [Mastering AI Token Optimization — 10Clouds](https://10clouds.com/blog/a-i/mastering-ai-token-optimization-proven-strategies-to-cut-ai-cost/)
- [Document Automation in 2026 — Dev.to](https://dev.to/kesimo/document-automation-in-2026-a-honest-comparison-of-the-ai-native-platforms-3iaj)
- [Carbone.io — Open Source Report Generator](https://carbone.io/)
- [Supabase + Next.js: The Stack Taking 2025 by Storm](https://javascript.plainenglish.io/supabase-next-js-the-stack-thats-taking-2025-by-storm-6bc187241b07)
- [AI SDK 6 Announcement — Vercel](https://vercel.com/blog/ai-sdk-6)
- [Real Estate CRM in Next.js + Supabase — Reddit](https://www.reddit.com/r/SideProject/comments/1pkkd1i/built_a_realestate_deal_pipeline_crm_in_nextjs/)
- [Vercel AI SDK Agents — 120+ Patterns](https://www.aisdkagents.com/)

---

> **Next:** This research document feeds into the design phase. The brainstorming skill will produce a detailed architecture spec, followed by an implementation plan via the writing-plans skill.
