import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { models } from './services/ai/client.ts';
import { SYSTEM_PROMPT } from './services/ai/prompts.ts';
import { searchWeb } from './utils/tinyfish.ts';

const app = express();
const PORT = process.env.AI_SERVER_PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve generated files (DOCX, PDF, XLSX, PPTX) — forces download
const MIME_TYPES = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};
app.use('/generated', express.static(path.resolve('public', 'generated'), {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (MIME_TYPES[ext]) res.set('Content-Type', MIME_TYPES[ext]);
    // Sanitize filename for HTTP header (strip non-ASCII, ₱→PHP)
    const raw = path.basename(filePath);
    const safe = raw.replace(/₱/g, 'PHP-').replace(/[^\x20-\x7E]/g, '').replace(/\s+/g, '-') || 'document';
    res.set('Content-Disposition', `attachment; filename="${safe}"`);
  },
}));

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
          description: 'Generate a professional property brochure as PDF. The content will be rendered with proper typography, tables, and styling — so write the propertyDetails in rich markdown format suitable for a printed document.',
          parameters: z.object({
            propertyName: z.string(),
            propertyDetails: z.string().describe(
              'Full property description in markdown format. Use ## headings for sections, **bold** for key specs, tables for structured data, --- for dividers. Write as a professional printed brochure — include an opening introduction, location highlights, specs table, amenities section, investment highlights, and call-to-action. Example format:\n\n' +
              '## Overview\n[1-2 paragraph introduction about the property]\n\n' +
              '## Location & Accessibility\n[Neighborhood description, landmarks, transport]\n\n' +
              '## Unit Specifications\n\n' +
              '| Feature | Detail |\n|---------|--------|\n| Price | ₱X,XXX,XXX |\n| Floor Area | XX sqm |\n...\n\n' +
              '## Amenities\n- ✓ Item one\n- ✓ Item two\n\n' +
              '## Investment Highlights\n- Strong appreciation potential\n- High rental yield\n\n' +
              '## Contact\nTopRealty AI | www.toprealty.ai'
            ),
            format: z.enum(['docx', 'pdf', 'both']).default('pdf'),
            tone: z.enum(['luxury', 'family', 'investment', 'standard']).default('standard'),
          }),
          execute: async (input) => {
            try {
              const { executeBrochure } = await import('./services/ai/tools/brochure.ts');
              const fmt = input.format === 'both' ? 'pdf' : input.format;
              return await executeBrochure({
                propertyName: input.propertyName,
                details: input.propertyDetails,
                tone: input.tone,
                format: fmt,
              });
            } catch (err) {
              return { success: false, message: `Brochure generation failed: ${err.message}` };
            }
          },
        }),

        generate_cma: tool({
          description: 'Generate a professional Comparative Market Analysis (CMA) report as PDF. Use rich markdown formatting — the report will be rendered with proper typography, styled tables, and section headings.',
          parameters: z.object({
            subjectProperty: z.string(),
            subjectPrice: z.string(),
            comparableProperties: z.string().describe(
              'Comparable property analysis in markdown. Use a table with columns: Property Name | Price | Size (sqm) | Price/sqm | Location | Key Features. Include at least 4-6 comparable properties. Below the table, add a 1-paragraph comparative analysis summarizing pricing trends and how the subject property compares.'
            ),
            marketTrends: z.string().describe(
              'Market analysis in markdown. Use ## headings for sections. Include: price trends (past 12 months), supply & demand analysis, neighborhood developments, and a recommended price range. Use **bold** for key figures and --- for section breaks.'
            ),
          }),
          execute: async (input) => {
            try {
              const { executeCma } = await import('./services/ai/tools/cma.ts');
              return await executeCma({
                subjectName: input.subjectProperty,
                subjectPrice: input.subjectPrice,
                comparables: input.comparableProperties,
                marketTrends: input.marketTrends,
              });
            } catch (err) {
              return { success: false, message: `CMA generation failed: ${err.message}` };
            }
          },
        }),

        generate_comparison: tool({
          description: 'Generate a professional side-by-side property comparison PDF. Provide clear, well-structured data for each property. Each property should include complete specs and balanced pros/cons.',
          parameters: z.object({
            properties: z.array(z.object({
              name: z.string().describe('Property name with developer (e.g., "Uptown Parksuites by Megaworld")'),
              price: z.string().describe('Price range or specific price (e.g., "₱4M – ₱85M" or "Starting at ₱7.5M")'),
              specs: z.string().describe(
                'Key specifications in markdown table format. Include: Location, Developer, Unit Types, Floor Areas, Year Completed, Amenities. Use | table | format | for structured data. Example:\n' +
                '| Feature | Detail |\n|---|---|\n| Developer | Megaworld |\n| Location | Uptown Bonifacio |\n| Unit Sizes | 33-453 sqm |\n| Year | 2017-2020 |'
              ),
              pros: z.string().describe('Advantages as a markdown list. Use ✓ for each point. Include location benefits, developer reputation, investment potential, amenities. Format: "✓ [point]" each on new line.'),
              cons: z.string().describe('Disadvantages as a markdown list. Use ✗ for each point. Be honest and balanced. Format: "✗ [point]" each on new line.'),
            })),
          }),
          execute: async (input) => {
            try {
              const { executeComparison } = await import('./services/ai/tools/comparison.ts');
              const details = input.properties.map((p, i) => {
                return `\n━━━ PROPERTY ${i + 1}: ${p.name} ━━━\n` +
                       `💰 Price: ${p.price}\n` +
                       `📐 ${p.specs}\n\n` +
                       `✅ Pros: ${p.pros}\n` +
                       `❌ Cons: ${p.cons}\n`;
              }).join('');
              return await executeComparison({ details, propertyName: 'Property Comparison' });
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
