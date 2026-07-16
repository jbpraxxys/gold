import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { models } from './services/ai/client.ts';
import { SYSTEM_PROMPT } from './services/ai/prompts.ts';
import { searchWeb } from './utils/tinyfish.ts';

const app = express();
const PORT = process.env.AI_SERVER_PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok' }));

// AI Chat endpoint — streaming with multi-step tool calling
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required' });
    }

    // v4: messages from useChat are directly compatible with streamText
    const result = streamText({
      model: models.flash,
      system: SYSTEM_PROMPT,
      messages,
      maxSteps: 10, // Multi-step: model → tools → continue
      tools: {
        search_web: tool({
          description: 'Search the web for current Philippine real estate data.',
          parameters: z.object({
            query: z.string().describe('Search query. Be specific with location, property type.'),
          }),
          execute: async ({ query }) => searchWeb(query),
        }),

        generate_brochure: tool({
          description: 'Generate a property brochure in DOCX or PDF format.',
          parameters: z.object({
            propertyName: z.string(),
            propertyDetails: z.string(),
            format: z.enum(['docx', 'pdf', 'both']).default('pdf'),
            tone: z.enum(['luxury', 'family', 'investment', 'standard']).default('standard'),
          }),
          execute: async (input) => {
            const { generateBrochure } = await import('./services/ai/tools/brochure.ts');
            return generateBrochure(input);
          },
        }),

        generate_cma: tool({
          description: 'Generate a Comparative Market Analysis report.',
          parameters: z.object({
            subjectProperty: z.string(),
            subjectPrice: z.string(),
            comparableProperties: z.string(),
            marketTrends: z.string(),
          }),
          execute: async (input) => {
            const { generateCMA } = await import('./services/ai/tools/cma.ts');
            return generateCMA(input);
          },
        }),

        generate_comparison: tool({
          description: 'Generate a side-by-side property comparison.',
          parameters: z.object({
            properties: z.array(z.object({
              name: z.string(), price: z.string(), specs: z.string(),
              pros: z.string(), cons: z.string(),
            })),
          }),
          execute: async (input) => {
            const { generateComparison } = await import('./services/ai/tools/comparison.ts');
            return generateComparison(input);
          },
        }),

        generate_presentation: tool({
          description: 'Generate an investor PowerPoint presentation.',
          parameters: z.object({
            propertyName: z.string(),
            slides: z.array(z.object({
              title: z.string(), content: z.string(),
              type: z.enum(['title', 'content', 'two_column', 'chart']).default('content'),
            })),
            includeFinancials: z.boolean().default(false),
          }),
          execute: async (input) => {
            const { generatePresentation } = await import('./services/ai/tools/presentation.ts');
            return generatePresentation(input);
          },
        }),

        generate_spreadsheet: tool({
          description: 'Generate an Excel spreadsheet.',
          parameters: z.object({
            title: z.string(), headers: z.array(z.string()),
            rows: z.array(z.array(z.string())),
            sheetName: z.string().default('Sheet1'),
          }),
          execute: async (input) => {
            const { generateSpreadsheet } = await import('./services/ai/tools/spreadsheet.ts');
            return generateSpreadsheet(input);
          },
        }),
      },
    });

    // Pipe the streaming response to Express
    const response = result.toDataStreamResponse();
    
    // Copy headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    res.status(response.status);
    
    // Pipe the body
    const reader = response.body.getReader();
    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) { res.end(); break; }
        res.write(value);
      }
    };
    pump();

  } catch (err) {
    console.error('[chat] error:', err);
    res.status(500).json({ error: 'AI processing failed' });
  }
});

app.listen(PORT, () => {
  console.log(`🤖 AI Server running on http://localhost:${PORT}`);
  console.log(`   Chat endpoint: POST http://localhost:${PORT}/api/chat`);
});
