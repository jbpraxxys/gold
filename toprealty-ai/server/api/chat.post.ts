import { streamText, tool, convertToModelMessages } from 'ai';
import { z } from 'zod/v4';
import { models } from '../services/ai/client';
import { SYSTEM_PROMPT } from '../services/ai/prompts';
import { executeSearchWeb } from '../services/ai/tools/search';

export default defineEventHandler(async (event) => {
  const body = await readBody<{ messages: any[] }>(event);

  if (!body?.messages || !Array.isArray(body.messages)) {
    throw createError({ statusCode: 400, message: 'Request body must include a "messages" array.' });
  }

  const modelMessages = await convertToModelMessages(body.messages);

  const result = streamText({
    model: models.flash,
    system: SYSTEM_PROMPT,
    messages: modelMessages,
    maxSteps: 10, // Server handles multi-step internally
    tools: {
      search_web: tool({
        description:
          'Search the web for current Philippine real estate data including property listings, market trends, neighborhood information, pricing, and recent transactions. Always use this tool before answering any property, market, or location question.',
        inputSchema: z.object({
          query: z.string().describe('Search query. Be specific with location, property type, and what data you need.'),
        }),
        execute: executeSearchWeb,
      }),

      generate_brochure: tool({
        description: 'Generate a professional property brochure in DOCX or PDF format.',
        inputSchema: z.object({
          propertyName: z.string(),
          propertyDetails: z.string(),
          format: z.enum(['docx', 'pdf', 'both']).default('pdf'),
          tone: z.enum(['luxury', 'family', 'investment', 'standard']).default('standard'),
        }),
        execute: async (input) => {
          const { generateBrochure } = await import('../services/ai/tools/brochure');
          return generateBrochure(input);
        },
      }),

      generate_cma: tool({
        description: 'Generate a Comparative Market Analysis (CMA) report.',
        inputSchema: z.object({
          subjectProperty: z.string(),
          subjectPrice: z.string(),
          comparableProperties: z.string(),
          marketTrends: z.string(),
        }),
        execute: async (input) => {
          const { generateCMA } = await import('../services/ai/tools/cma');
          return generateCMA(input);
        },
      }),

      generate_comparison: tool({
        description: 'Generate a side-by-side property comparison report.',
        inputSchema: z.object({
          properties: z.array(z.object({
            name: z.string(), price: z.string(), specs: z.string(), pros: z.string(), cons: z.string(),
          })),
        }),
        execute: async (input) => {
          const { generateComparison } = await import('../services/ai/tools/comparison');
          return generateComparison(input);
        },
      }),

      generate_presentation: tool({
        description: 'Generate an investor PowerPoint presentation.',
        inputSchema: z.object({
          propertyName: z.string(),
          slides: z.array(z.object({
            title: z.string(), content: z.string(),
            type: z.enum(['title', 'content', 'two_column', 'chart', 'image']).default('content'),
          })),
          includeFinancials: z.boolean().default(false),
        }),
        execute: async (input) => {
          const { generatePresentation } = await import('../services/ai/tools/presentation');
          return generatePresentation(input);
        },
      }),

      generate_spreadsheet: tool({
        description: 'Generate an Excel spreadsheet for property data.',
        inputSchema: z.object({
          title: z.string(), headers: z.array(z.string()),
          rows: z.array(z.array(z.string())), sheetName: z.string().default('Sheet1'),
        }),
        execute: async (input) => {
          const { generateSpreadsheet } = await import('../services/ai/tools/spreadsheet');
          return generateSpreadsheet(input);
        },
      }),
    },
  });

  // Use toUIMessageStreamResponse — client handles multi-step continuation natively
  return result.toUIMessageStreamResponse();
});
