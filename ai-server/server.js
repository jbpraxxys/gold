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
            try {
              const { executeBrochure } = await import('./services/ai/tools/brochure.ts');
              const fmt = input.format === 'both' ? 'pdf' : input.format;
              return await executeBrochure({
                propertyData: {
                  property_name: input.propertyName,
                  details: input.propertyDetails,
                  tone: input.tone,
                  generated_date: new Date().toLocaleDateString('en-PH'),
                },
                format: fmt,
              });
            } catch (err) {
              return { success: false, message: `Brochure generation failed: ${err.message}` };
            }
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
            try {
              const { executeCma } = await import('./services/ai/tools/cma.ts');
              return await executeCma({
                cmaData: {
                  subject_name: input.subjectProperty,
                  subject_price: input.subjectPrice,
                  comparables: input.comparableProperties,
                  market_trends: input.marketTrends,
                  generated_date: new Date().toLocaleDateString('en-PH'),
                },
              });
            } catch (err) {
              return { success: false, message: `CMA generation failed: ${err.message}` };
            }
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
            try {
              const { executeComparison } = await import('./services/ai/tools/comparison.ts');
              return await executeComparison({
                comparisonData: {
                  properties: input.properties,
                  generated_date: new Date().toLocaleDateString('en-PH'),
                },
              });
            } catch (err) {
              return { success: false, message: `Comparison generation failed: ${err.message}` };
            }
          },
        }),

        generate_presentation: tool({
          description: 'Generate an investor PowerPoint presentation.',
          parameters: z.object({
            propertyName: z.string(),
            slides: z.array(z.object({
              title: z.string(), content: z.string(),
              type: z.enum(['title', 'content', 'two_column']).default('content'),
            })),
            includeFinancials: z.boolean().default(false),
          }),
          execute: async (input) => {
            try {
              const { executePresentation } = await import('./services/ai/tools/presentation.ts');
              return await executePresentation({
                title: input.propertyName,
                slides: input.slides,
              });
            } catch (err) {
              return { success: false, message: `Presentation generation failed: ${err.message}` };
            }
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
            try {
              const { executeSpreadsheet } = await import('./services/ai/tools/spreadsheet.ts');
              return await executeSpreadsheet({
                title: input.title,
                headers: input.headers,
                rows: input.rows,
                filename: `${input.title.toLowerCase().replace(/\s+/g, '-')}.xlsx`,
              });
            } catch (err) {
              return { success: false, message: `Spreadsheet generation failed: ${err.message}` };
            }
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
