# AI Provider Evaluation: Novita AI vs Grok (xAI) vs Claude/OpenAI

> **Date:** July 16, 2026  
> **Stack:** Laravel (CMS/CRM) → Node.js/Nuxt (AI Chat + Document Generation) → Novita / Grok / Claude  
> **Conclusion:** Novita (DeepSeek V4 Flash) is cheapest. Grok 4.1 Fast is the best balance of quality, price, and ecosystem. Claude is the quality fallback.

---

## 1. Novita AI — What It Is

Novita AI is an **AI model aggregator** — 200+ models (LLMs, image generation, video, TTS, embeddings) accessible through a **single OpenAI-compatible API**. One API key, one base URL, unlimited models.

**Key facts:**

| Attribute | Detail |
|-----------|--------|
| API Type | OpenAI-compatible (`/v1/chat/completions`) |
| Base URL | `https://api.novita.ai/openai` |
| Model Count | 200+ (LLMs, images, video, TTS, embeddings, rerankers) |
| LLM Pricing | From $0.05/M tokens (Nemotron) to $1.60/M (DeepSeek V4 Pro) |
| Image Pricing | From $0.001/image (basic) to $0.036/image (Flux Pro) |
| Embedding Pricing | From $0.01/M tokens (BGE-M3) |
| Caching | Yes — cache read at ~20% of standard input price |
| Batch | 50% discount on batch inference |
| Streaming | Supported |

---

## 2. Novita Models Mapped to This Project

### Tier 1: Primary Workhorse (Text Generation)

| Model | Input/Mt | Output/Mt | Context | Best For |
|-------|----------|-----------|---------|----------|
| **DeepSeek V4 Flash** ⭐ | $0.14 | $0.28 | 1,048,576 | **Primary workhorse** — content generation, structured JSON, tool calling. Same family as what powers OpenCode. Insanely cheap for its quality. |
| **DeepSeek V4 Pro** | $1.60 | $3.20 | 1,048,576 | Complex financial analysis, multi-property ROI comparisons, edge cases the Flash model struggles with |
| **MiniMax M3** | $0.30 | $1.20 | 1,000,000 | Good alternative to DeepSeek. 1M context, competitive pricing. |

**Recommendation:** DeepSeek V4 Flash as the default model. It's the same model family powering OpenCode Go, so you already know its quality. At $0.14/M input, it's practically free for testing. Switch to V4 Pro only for genuinely complex analysis.

### Tier 2: Classification & Routing (Ultra-Cheap)

| Model | Input/Mt | Output/Mt | Context | Best For |
|-------|----------|-----------|---------|----------|
| **Qwen3 Coder 30B A3B** ⭐ | $0.07 | $0.27 | 160,000 | Intent classification, structured JSON extraction, routing decisions |
| **GLM-4.7-Flash** | $0.07 | $0.40 | 200,000 | Alternative router, slightly more output tokens |
| **Nemotron 3 Nano 30B** | $0.05 | $0.20 | 262,144 | Absolute cheapest option for simple tasks |

**Recommendation:** Qwen3 Coder 30B A3B for classification and structured extraction. It's optimized for code/JSON output and costs next to nothing.

### Tier 3: Image Generation

| Model | Cost/Image | Best For |
|-------|-----------|----------|
| **Qwen-Image** ⭐ | $0.02 | Text-to-image generation for flyers, social posts, banners |
| **Seedream 4.0** | $0.03 | Alternative with img2img support |
| **Basic Text-to-Image** | $0.001 | Cheap 512×512 previews/drafts |
| **Flux.1 Kontext Pro** | $0.036 | Image-to-image (modifying existing images) |
| **Remove Background** | $0.017 | Image editing |
| **Inpainting** | $0.0015 | Image editing/cleanup |

**Recommendation:** Qwen-Image at $0.02/image. For a real estate flyer, this is dirt cheap. A full marketing package with 5 images = $0.10.

### Tier 4: Embeddings (for RAG)

| Model | Cost/Mt | Context | Best For |
|-------|---------|---------|----------|
| **BAAI BGE-M3** ⭐ | $0.01 | 8,192 | Embedding CRM property data, agent profiles, market reports |
| **Qwen3 Embedding 8B** | $0.07 | 32,768 | Higher quality, larger context |

**Recommendation:** BAAI BGE-M3 at $0.01/M tokens. Embedding your entire CRM property database will cost literal pennies.

### Tier 5: Reranker (Improves RAG Accuracy)

| Model | Cost/Mt | Best For |
|-------|---------|----------|
| **BAAI BGE-Reranker v2-M3** ⭐ | $0.01 | Re-ranking RAG search results for better accuracy |
| **Qwen3 Reranker 8B** | $0.05 | Higher quality reranking |

---

## 3. Novita Model Cascade (Token Cost Strategy)

```
User query arrives
        │
        ▼
┌──────────────────────────────────┐
│ STEP 1: Intent Classification    │
│ Model: Qwen3 Coder 30B A3B       │
│ Cost:  $0.07/M input             │
│ ~30 tokens → $0.0000021          │
│ Output: { intent, parameters }   │
└──────────────┬───────────────────┘
               │
        ┌──────┴──────┐
        │             │
   Simple task    Complex task
   (descriptions, (CMA, valuation,
    captions)     comparisons)
        │             │
        ▼             ▼
┌──────────────┐ ┌──────────────────┐
│ DeepSeek V4  │ │ DeepSeek V4 Pro  │
│ Flash        │ │                  │
│ $0.14/$0.28  │ │ $1.60/$3.20      │
│ ~500 tokens  │ │ ~800 tokens      │
│ → $0.0002    │ │ → $0.004         │
└──────────────┘ └──────────────────┘
        │             │
        ▼             ▼
   Document engines build files (0 AI tokens)
   Carbone / PptxGenJS / Sharp / ExcelJS
```

**Per-request cost estimate:** $0.0002–$0.004 for text generation. Images add $0.02 each.

---

## 3B. Grok (xAI) — The Contender

xAI's Grok API has emerged as one of the most aggressive pricing plays in 2026. **OpenAI-compatible API**, 2M-token context windows, built-in RAG, web search, and image generation — all under one provider.

### Grok Models Mapped to This Project

#### Tier 1: Primary Workhorse

| Model | Input/Mt | Output/Mt | Context | Best For |
|-------|----------|-----------|---------|----------|
| **Grok 4.1 Fast (non-reasoning)** ⭐ | $0.20 | $0.50 | 2,000,000 | **Primary workhorse** — content generation, structured JSON, summarization, classification. 2M context window is massive. |
| **Grok 4.1 Fast (reasoning)** | $0.20 | $0.50 | 2,000,000 | Multi-step logic, analysis requiring chain-of-thought |
| **Grok 4.3** | $1.25 | $2.50 | 1,000,000 | Mid-tier, good balance of quality and price |
| **Grok 4.5** (latest) | $2.00 | $6.00 | 500,000 | Flagship — best quality, agentic tool calling, minimal hallucinations |

**Recommendation:** Grok 4.1 Fast (non-reasoning) as default. At $0.20/$0.50 with a 2M context window, it's an incredible value. Switch to Grok 4.5 for complex analysis.

#### Tier 2: Image Generation

| Model | Cost | Best For |
|-------|------|----------|
| **grok-imagine-image** ⭐ | $0.02/image | Flyers, social posts, banners |
| **grok-imagine-image-quality** | $0.05 (1K) / $0.07 (2K) | Premium hero images, luxury listings |

At $0.02/image, Grok Imagine is tied with Qwen-Image for the cheapest quality image generation.

#### Tier 3: Built-in Tools (Server-Side)

Grok has **server-side tools** that run on xAI's infrastructure — you don't host or manage them:

| Tool | Cost | Relevance to This Project |
|------|------|--------------------------|
| **Collections Search (RAG)** | $2.50/1K calls | 🔥 Could **replace Laravel RAG** — upload property docs, query via API |
| **Web Search** | $5.00/1K calls | Market data, neighborhood research, current events |
| **X Search** | $5.00/1K calls | Social media sentiment, trending real estate topics |
| **Code Execution** | $5.00/1K calls | Financial calculations, ROI projections in sandboxed Python |

> ⚠️ **Important caveat:** Grok's server-side tools incur per-call fees **on top of** token costs. A complex agentic task with 10 tool calls adds ~$0.05 to the request. For RAG-heavy workloads, this can add up.

### Grok Model Cascade

```
User query → Grok 4.1 Fast (non-reasoning) → $0.20/$0.50
                │
        ┌───────┴────────┐
        │                │
   Simple task      Complex task
   (descriptions,   (CMA, valuation,
    captions)        comparisons)
        │                │
        ▼                ▼
  Grok 4.1 Fast      Grok 4.5
  (non-reasoning)    (flagship)
  $0.20/$0.50        $2.00/$6.00
```

### Grok vs Vercel AI SDK Compatibility

⚠️ **Critical caveat from xAI docs (May 2026):**
> "Advanced tool usage patterns are not yet supported in the Vercel AI SDK. Please use the xAI SDK or OpenAI SDK for this."

**What this means:** You can use Grok with Vercel AI SDK for basic chat/streaming and **client-side tool calling** (your own tools like `generate_brochure`). But Grok's **server-side tools** (Collections RAG, Web Search, X Search) only work via the xAI SDK or OpenAI SDK directly.

**For this project this is fine** — we're defining our own tools (brochure, CMA, image gen) in Node.js, not using Grok's server-side tools. The main Grok RAG would be done via Laravel pgvector anyway.

### Grok Prompt Caching

Enabled by default, no configuration needed. Cached input tokens get a significant discount. For our use case (same system prompt + tool definitions per session), this is free savings.

---

## 4. Provider Comparison: Novita vs Grok vs Claude/OpenAI

### Head-to-Head: Workhorse Models

| Provider | Workhorse Model | Input/Mt | Output/Mt | Context | Prompt Cache | Image Gen | Image Cost | RAG Built-in |
|----------|----------------|----------|-----------|---------|-------------|-----------|------------|-------------|
| **Novita** | DeepSeek V4 Flash | $0.14 | $0.28 | 1M | ✅ ~20% input | ✅ Qwen-Image | $0.02 | ❌ (use Laravel) |
| **Grok** | Grok 4.1 Fast | $0.20 | $0.50 | 2M | ✅ auto | ✅ Grok Imagine | $0.02 | ✅ Collections ($2.50/1K) |
| **Anthropic** | Claude Sonnet 4.6 | $3.00 | $15.00 | 200K | ✅ ~10% input | ❌ none | N/A | ❌ |
| **OpenAI** | GPT-5.2 | $1.75 | $14.00 | — | ✅ | ✅ DALL-E 3 | $0.04 | ❌ |

### Head-to-Head: Premium Models

| Provider | Premium Model | Input/Mt | Output/Mt | Context | Best For |
|----------|-------------|----------|-----------|---------|----------|
| **Novita** | DeepSeek V4 Pro | $1.60 | $3.20 | 1M | Complex analysis |
| **Grok** | Grok 4.5 | $2.00 | $6.00 | 500K | Agentic workflows, minimal hallucinations |
| **Anthropic** | Claude Opus 4.7 | $5.00 | $25.00 | — | Deep reasoning, legal/financial |
| **OpenAI** | GPT-5.5 | $5.00 | $30.00 | — | Hard reasoning, coding |

### Monthly Cost: 1,000 Interactions

| Scenario | Novita | Grok | Claude (Sonnet) | OpenAI (GPT-5.2) |
|----------|--------|------|-----------------|------------------|
| Intent classification (30t × 1000) | $0.002 | $0.006 | $0.09 | $0.05 |
| Content generation (600t avg × 1000) | $0.25 | $0.42 | $7.20 | $8.40 |
| Complex analysis (1000t × 50) | $0.22 | $0.40 | $0.90 | $1.00 |
| Embeddings (100K chunks, one-time) | $1.00 | N/A* | $13.00 | $13.00 |
| RAG queries (50t embed × 1000) | $0.50 | N/A* | $1.00 | $1.00 |
| Images (100 images) | $2.00 | $2.00 | N/A | $4.00 |
| **Monthly Total** | **~$4.00** | **~$4.83** + RAG | **~$22.19** | **~$27.45** |

\* Grok RAG is via Collections Search at $2.50/1K calls = $2.50/month. No embedding costs since xAI handles it server-side.

### Decision Matrix

| Factor | Winner | Why |
|--------|--------|-----|
| **Cheapest text generation** | Novita | DeepSeek V4 Flash at $0.14/$0.28 — unbeatable |
| **Best price/quality ratio** | Grok | Grok 4.1 Fast at $0.20/$0.50 with 2M context, great quality |
| **Largest context window** | Grok | 2M tokens — fit entire property databases in context |
| **Best image generation** | Tie (Novita + Grok) | Both $0.02/image. DALL-E 3 better quality but $0.04 |
| **Built-in RAG** | Grok | Collections Search at $2.50/1K — no separate vector DB needed |
| **Best tool calling** | Claude | Mature, reliable, Vercel AI SDK native |
| **Best reliability (uptime)** | Claude / OpenAI | Enterprise track record. Novita reports 46% success rate. |
| **Vercel AI SDK support** | Claude / Novita | Both fully supported. Grok has caveats for advanced tools. |
| **Provider lock-in risk** | Novita (lowest) | Open-source models, aggregator — worst case: host DeepSeek yourself |

### Recommended Strategy: Multi-Provider

The best approach is **not to pick one**. Use a provider-agnostic setup:

```
                    ┌─────────────────────┐
                    │   AI ROUTER LAYER   │
                    │   (Vercel AI SDK)   │
                    └─────────┬───────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
   │   NOVITA     │   │    GROK      │   │   CLAUDE     │
   │ (primary)    │   │ (secondary)  │   │ (fallback)   │
   │              │   │              │   │              │
   │ Text: DSV4   │   │ Text: Grok   │   │ Text: Sonnet │
   │ Flash $0.14  │   │ 4.1F $0.20   │   │ 4.6 $3.00    │
   │ Images: Qwen │   │ Images: Grok │   │              │
   │ $0.02        │   │ Imagine $.02 │   │              │
   │ Embed: BGE   │   │ RAG: Built-in│   │              │
   │ $0.01        │   │ $2.50/1K     │   │              │
   └──────────────┘   └──────────────┘   └──────────────┘
        ▲                   ▲                   ▲
        │                   │                   │
        └───────────────────┴───────────────────┘
              Fallback chain: Novita → Grok → Claude
```

**Default route: Novita** (cheapest). **Fallback: Grok** (better quality, bigger context). **Last resort: Claude** (reliability guarantee).

---

## 5. Architecture: Laravel CMS + Node.js AI Backend

### Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     LARAVEL (CMS / CRM)                          │
│                                                                  │
│  • Property management (CRUD)                                    │
│  • Agent management                                              │
│  • Sales / comparable tracking                                   │
│  • Market data                                                   │
│  • User authentication & roles                                   │
│  • Admin panel (Filament / Nova)                                 │
│  • Template management (upload .docx, .pptx, .xlsx)             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  RAG LAYER (Laravel AI SDK + pgvector)                     │ │
│  │  • Ingests property data, reports, market data             │ │
│  │  • Chunks & embeds using Novita BGE-M3 ($0.01/Mt)          │ │
│  │  • Semantic search via whereVectorSimilarTo()              │ │
│  │  • Exposes /api/rag/search?q=luxury+condos+makati          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  EXPOSES REST API:                                               │
│  GET  /api/properties/:id     → Property details                 │
│  GET  /api/properties/search  → Semantic search (RAG)            │
│  GET  /api/comparables/:id    → Comparable sales                 │
│  GET  /api/agents/:id         → Agent profile                    │
│  GET  /api/market/trends      → Market data                      │
│  POST /api/rag/search         → Vector similarity search         │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST API calls
┌────────────────────────────▼────────────────────────────────────┐
│                 NODE.JS / NUXT (AI Backend)                      │
│                                                                  │
│  • Nuxt 4 server routes (/server/api/)                          │
│  • Vercel AI SDK (@ai-sdk/vue) for streaming chat               │
│  • Novita AI client (OpenAI-compatible API)                     │
│  • Document engines: Carbone, PptxGenJS, Sharp, ExcelJS         │
│  • File storage: S3 / local                                     │
│                                                                  │
│  POST /api/chat            → AI streaming + tool calling         │
│  POST /api/documents       → Generate document (all formats)     │
│  POST /api/images          → Generate marketing images           │
│  GET  /api/documents/:id   → Download generated file            │
└──────────────────────────────────────────────────────────────────┘
```

### Why This Split?

| Responsibility | Laravel | Node.js |
|---------------|---------|---------|
| CRM data management | ✅ Full CRUD, admin panel, Filament | ❌ |
| User auth & roles | ✅ Laravel Auth, Sanctum tokens | ❌ |
| RAG ingestion & search | ✅ Laravel AI SDK + pgvector — one `whereVectorSimilarTo()` call | ❌ |
| AI chat streaming | ❌ PHP streaming is brittle | ✅ Vercel AI SDK + `useChat()` |
| Tool calling | ❌ No mature PHP AI tooling | ✅ `tool()` API with Zod schemas |
| Document generation | ⚠️ Possible but clunky | ✅ Carbone, PptxGenJS, Sharp — all native Node.js |
| Image generation | ❌ No Node.js image compositing | ✅ Sharp + DALL-E/Novita images |
| Frontend chat UI | ⚠️ Livewire possible but limited | ✅ Vue 3 + `@ai-sdk/vue` — streaming, tool results as components |

**The split is natural:** Laravel owns the data. Node.js owns the AI interaction and output generation.

### Authentication Flow

```
User logs in via Laravel (Sanctum token)
        │
        ▼
Token passed to Nuxt frontend (cookie or header)
        │
        ▼
Nuxt server routes verify token with Laravel's /api/user
        │
        ▼
Node.js calls Laravel API with user's token
        │
        ▼
Laravel enforces row-level access (agents see their properties only)
```

### RAG Flow

```
┌──────────────────────────────────────────────────────────────┐
│  INITIAL SETUP (one-time)                                    │
│                                                              │
│  1. Admin triggers: php artisan rag:ingest                   │
│  2. Laravel reads: properties, agent bios, market reports,   │
│     neighborhood descriptions, sold property data            │
│  3. Laravel chunks text (512-token chunks, semantic splits)  │
│  4. Laravel sends chunks to Novita BGE-M3 ($0.01/Mt)        │
│  5. pgvector stores: [chunk_text, embedding[], metadata]     │
│  6. Re-run on schedule or when CRM data changes              │
└──────────────────────────────────────────────────────────────┘
                              │
┌──────────────────────────────────────────────────────────────┐
│  AT QUERY TIME (every chat message)                          │
│                                                              │
│  1. User: "Show me luxury condos in Makati with high ROI"    │
│  2. Node.js → Laravel: POST /api/rag/search                 │
│     { query: "luxury condos Makati high ROI" }              │
│  3. Laravel: embeds query via Novita BGE-M3                  │
│  4. Laravel: whereVectorSimilarTo('embedding', query, 0.4)  │
│     → returns top 10 relevant property chunks               │
│  5. Laravel returns: [{ property_id, chunk_text, metadata }] │
│  6. Node.js injects chunks into AI system prompt             │
│  7. AI answers with CRM-grounded data                        │
└──────────────────────────────────────────────────────────────┘
```

---

## 6. Node.js AI Backend — Detailed Setup

### Dependencies

```json
{
  "dependencies": {
    "ai": "^6.0.27",
    "@ai-sdk/openai": "latest",
    "@ai-sdk/vue": "latest",
    "carbone": "^4.0",
    "pptxgenjs": "^4.0",
    "sharp": "^0.34",
    "exceljs": "^4.4",
    "puppeteer": "^24.0",
    "zod": "^3.24",
    "nuxt": "^4.0"
  }
}
```

### Novita Client (Drop-in OpenAI Replacement)

```typescript
// server/services/ai/client.ts
import { createOpenAI } from '@ai-sdk/openai';

// Novita is OpenAI-compatible — just change baseURL
export const novita = createOpenAI({
  baseURL: 'https://api.novita.ai/openai/v1',
  apiKey: process.env.NOVITA_API_KEY!,
});

// Model aliases for model cascading
export const models = {
  workhorse: novita('deepseek-ai/DeepSeek-V4-Flash'),    // $0.14/$0.28/Mt
  pro: novita('deepseek-ai/DeepSeek-V4-Pro'),             // $1.60/$3.20/Mt
  router: novita('qwen/qwen3-coder-30b-a3b-instruct'),    // $0.07/$0.27/Mt
  cheap: novita('zai-org/GLM-4.7-Flash'),                 // $0.07/$0.40/Mt
};
```

### Chat Route with Tool Calling

```typescript
// server/api/chat.post.ts
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { novita, models } from '~/server/services/ai/client';
import { generateBrochure } from '~/server/services/ai/tools/brochure';
import { generatePresentation } from '~/server/services/ai/tools/presentation';
import { generateCMA } from '~/server/services/ai/tools/cma';
import { generateImage } from '~/server/services/ai/tools/image';
import { searchCRM } from '~/server/services/ai/tools/search';

export default defineEventHandler(async (event) => {
  const { messages } = await readBody(event);

  const result = streamText({
    model: models.workhorse,  // DeepSeek V4 Flash
    system: `You are TopRealty AI, a real estate assistant. 
             You have access to CRM data and can generate documents.
             Always use the search_crm tool before answering property questions.
             When generating documents, ask the user for confirmation first.`,
    messages,
    tools: {
      search_crm: tool({
        description: 'Search the CRM for properties, agents, or market data',
        parameters: z.object({
          query: z.string().describe('Natural language search query'),
          type: z.enum(['property', 'agent', 'market', 'comparable']).optional(),
        }),
        execute: async ({ query, type }) => {
          // Call Laravel RAG API
          const response = await $fetch('http://laravel/api/rag/search', {
            method: 'POST',
            body: { query, type },
          });
          return response;
        },
      }),

      generate_brochure: tool({
        description: 'Generate a property brochure (DOCX or PDF)',
        parameters: z.object({
          propertyId: z.string(),
          format: z.enum(['docx', 'pdf', 'both']),
          tone: z.enum(['luxury', 'family', 'investment', 'standard']).optional(),
        }),
        execute: generateBrochure,
      }),

      generate_presentation: tool({
        description: 'Generate an investor PowerPoint presentation',
        parameters: z.object({
          propertyId: z.string(),
          includeFinancials: z.boolean().optional(),
        }),
        execute: generatePresentation,
      }),

      generate_cma: tool({
        description: 'Generate a Comparative Market Analysis report',
        parameters: z.object({
          propertyId: z.string(),
          radius: z.number().default(2), // km
        }),
        execute: generateCMA,
      }),

      generate_image: tool({
        description: 'Generate a marketing image (flyer, banner, social post)',
        parameters: z.object({
          propertyId: z.string(),
          format: z.enum(['facebook-banner', 'instagram-post', 'flyer', 'open-house']),
        }),
        execute: generateImage,
      }),
    },
    maxSteps: 10, // Allow multi-step (search → generate)
  });

  return result.toDataStreamResponse();
});
```

---

## 7. Cost Projection: All Providers

### Scenario: 1,000 AI interactions/month (with template pattern)

| Item | Novita | Grok | Claude/OpenAI |
|------|--------|------|---------------|
| Intent classification (1,000 × 30t) | $0.002 (Qwen3) | $0.006 (Grok 4.1F) | $0.09 (Sonnet) |
| Content generation (1,000 × 600t) | $0.25 (DS V4 Flash) | $0.42 (Grok 4.1F) | $7.20 (Sonnet) |
| Complex analysis (50 × 1,000t) | $0.22 (DS V4 Pro) | $0.40 (Grok 4.5) | $0.90 (Opus) |
| Embeddings (100K chunks, one-time) | $1.00 (BGE-M3) | N/A (built-in RAG) | $13.00 (OpenAI) |
| RAG queries (1,000 × 50t embed) | $0.50 (BGE-M3) | $2.50 (Collections) | $1.00 (OpenAI) |
| Images (100 images) | $2.00 (Qwen) | $2.00 (Grok Imagine) | $4.00 (DALL-E 3) |
| **Monthly Total** | **~$4.00** | **~$5.33** | **~$22.19** |

### Prompt Caching Savings

All three providers support prompt caching. System prompts (~800 tokens) are cached:

| Provider | Without Cache | With Cache | Savings |
|----------|--------------|------------|---------|
| Novita (DS V4 Flash) | $0.11 | $0.022 | 80% |
| Grok (4.1 Fast) | $0.16 | $0.032 | 80% |
| Claude (Sonnet) | $2.40 | $0.24 | 90% |

**Bottom line:** Both Novita and Grok will cost roughly **$4–10/month** at 1,000 interactions/month. Claude/OpenAI costs 4-5× more.

---

## 8. Risks & Caveats

### Novita

⚠️ **LLM Stats reports 46% success rate** across all Novita models over 7 days. This may not reflect flagship models (DeepSeek). Mitigations: retry logic, fallback to Grok or Claude.

### Grok

⚠️ **Vercel AI SDK caveat** (May 2026): "Advanced tool usage patterns are not yet supported in the Vercel AI SDK." This means Grok's server-side tools (Collections RAG, Web Search, X Search) require the xAI SDK or OpenAI SDK. Client-side tools (your own `generate_brochure` etc.) work fine.

⚠️ **Tool invocation costs** stack on top of token costs. A complex agentic task with 10 tool calls adds ~$0.05.

⚠️ **No `stop`, `presencePenalty`, `frequencyPenalty`** on reasoning models (Grok 4.20+). Strip these from your prompt configs.

⚠️ **Rate limits** on Grok Imagine Pro (30 rpm) are stricter than standard (300 rpm).

### DeepSeek V4 (Novita) Quality

- Excellent for structured output and content generation
- May struggle with nuanced financial reasoning — fall back to Grok 4.5 or Claude for those

### Image Quality

- Qwen-Image ($0.02) and Grok Imagine ($0.02) are good but DALL-E 3 has better photorealism for luxury listings
- For premium listings, keep DALL-E 3 as a "premium tier" ($0.04/image)

---

## 9. Recommended Multi-Provider Setup

```
┌─────────────────────────────────────────────────────────────┐
│                 PRIMARY: NOVITA (cheapest)                   │
│                                                             │
│  Workhorse:   DeepSeek V4 Flash    $0.14/$0.28/Mt  1M ctx  │
│  Complex:     DeepSeek V4 Pro      $1.60/$3.20/Mt  1M ctx  │
│  Router:      Qwen3 Coder 30B      $0.07/$0.27/Mt          │
│  Images:      Qwen-Image           $0.02/image             │
│  Embeddings:  BGE-M3               $0.01/Mt                │
│  Reranker:    BGE-Reranker v2      $0.01/Mt                │
├─────────────────────────────────────────────────────────────┤
│               FALLBACK 1: GROK (better quality)             │
│                                                             │
│  Workhorse:   Grok 4.1 Fast        $0.20/$0.50/Mt  2M ctx  │
│  Premium:     Grok 4.5             $2.00/$6.00/Mt  500K ctx│
│  Images:      Grok Imagine         $0.02/image             │
│  Built-in RAG:Collections Search   $2.50/1K calls          │
├─────────────────────────────────────────────────────────────┤
│           FALLBACK 2: CLAUDE (reliability guarantee)        │
│                                                             │
│  Workhorse:   Claude Sonnet 4.6    $3.00/$15.00/Mt         │
│  Premium:     Claude Opus 4.7      $5.00/$25.00/Mt         │
└─────────────────────────────────────────────────────────────┘
```

**Routing logic:**
1. Try Novita first (cheapest)
2. On failure or for quality-sensitive tasks, fall back to Grok
3. On both failing, fall back to Claude (most expensive, most reliable)
4. Images: Qwen-Image default → Grok Imagine fallback → DALL-E 3 premium tier
5. RAG: Laravel pgvector + BGE-M3 (primary) → Grok Collections Search (secondary, for web-connected queries)

---

## 10. Final Summary

| Question | Answer |
|----------|--------|
| **Primary AI provider?** | **Novita** (DeepSeek V4 Flash) — cheapest at $0.14/Mt. Same family as OpenCode Go. |
| **Secondary provider?** | **Grok** (xAI) — Grok 4.1 Fast at $0.20/Mt, 2M context, built-in RAG and web search. |
| **Reliability fallback?** | **Claude Sonnet 4.6** — 3× more expensive but enterprise-grade reliability. |
| **Which model for text?** | DeepSeek V4 Flash (primary) or Grok 4.1 Fast (backup) |
| **Which model for images?** | Qwen-Image or Grok Imagine — both $0.02/image |
| **Which model for embeddings?** | BGE-M3 via Novita — $0.01/Mt, ridiculously cheap |
| **Laravel does what?** | CRM data, admin panel, user auth, RAG ingestion, vector search API |
| **Node.js does what?** | AI chat streaming, tool calling, document generation, image compositing |
| **Monthly AI cost?** | **~$5/month** at 1,000 interactions (with multi-provider fallback) |

---

## 11. Updated Per-Output-Type Stack (Multi-Provider Edition)

| Output | AI (Text) | AI (Image) | Engine | Template |
|--------|-----------|------------|--------|----------|
| **PPTX** | DeepSeek V4 Flash → JSON | N/A | PptxGenJS | Slide components (TS) |
| **DOCX** | DeepSeek V4 Flash → JSON | N/A | Carbone.io | .docx (Word) |
| **PDF** | DeepSeek V4 Flash → JSON | N/A | Carbone (DOCX→PDF) or Puppeteer | .docx or .html |
| **XLSX** | Qwen3 Coder → structured data | N/A | ExcelJS / Carbone | .xlsx (Excel) |
| **Image/Flyer** | DeepSeek V4 Flash → prompt | Qwen-Image ($0.02) or DALL-E 3 ($0.04) | Sharp (composite) | JSON layout |
| **RAG Embeddings** | N/A | N/A | Laravel AI SDK + pgvector + BGE-M3 | Chunked CRM data |
