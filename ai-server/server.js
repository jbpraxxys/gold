import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { models } from './services/ai/client.ts';
import { SYSTEM_PROMPT } from './services/ai/prompts.ts';
import { searchWeb } from './utils/tinyfish.ts';

// ─── Helpers ────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const app = express();
const PORT = process.env.AI_SERVER_PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve generated files (DOCX, PDF, XLSX, PPTX) — forces download
const MIME_TYPES = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword',
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
              'Full property description as HTML. Use <h2> headings, <table> for specs, <ul>/<li> for features. Write as a professional printed brochure. Example:\n\n' +
              '<h2>Overview</h2>\n<p>Executive summary paragraph...</p>\n\n' +
              '<h2>Location</h2>\n<p>Neighborhood description...</p>\n\n' +
              '<h2>Specifications</h2>\n<table><tr><th>Feature</th><th>Detail</th></tr><tr><td>Price</td><td>₱X,XXX,XXX</td></tr><tr><td>Floor Area</td><td>XX sqm</td></tr><tr><td>Bedrooms</td><td>X</td></tr></table>\n\n' +
              '<h2>Amenities</h2>\n<ul><li>✓ Swimming pool</li><li>✓ Gym</li><li>✓ 24/7 security</li></ul>\n\n' +
              '<h2>Investment Highlights</h2>\n<ul><li><strong>Appreciation:</strong> X% annually</li><li><strong>Rental Yield:</strong> X% gross</li></ul>\n\n' +
              '<p><em>Contact: TopRealty AI | www.toprealty.ai</em></p>'
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
              'Comparable properties as HTML. Use a <table> with columns: Property | Price | Size | Price/sqm | Location | Features. Minimum 4-6 properties. Below table, add <p> analysis.</p>.'
            ),
            marketTrends: z.string().describe(
              'Market analysis as HTML. Use <h2>Price Trends</h2>, <h2>Supply & Demand</h2>, <h2>Neighborhood Developments</h2>, <h2>Recommended Range</h2> sections. Use <strong> for key numbers.'
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
                format: 'pdf',
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
                'Specs as an HTML <table>. Required: <table><tr><th>Feature</th><th>Detail</th></tr><tr><td><strong>Developer</strong></td><td>Name</td></tr>...<tr><td><strong>Location</strong></td><td>Address</td></tr>...<tr><td><strong>Floor Areas</strong></td><td>XX-XX sqm</td></tr>...<tr><td><strong>Main Amenities</strong></td><td>list</td></tr></table>. Use <strong> on labels. NO markdown pipes.'
              ),
              pros: z.string().describe('Advantages as bullet points. Format each as a single line starting with the key point. Will be rendered as <ul> list items.'),
              cons: z.string().describe('Disadvantages as bullet points. Format each as a single line starting with the key point. Will be rendered as <ul> list items.'),
            })),
          }),
          execute: async (input) => {
            try {
              const { executeComparison } = await import('./services/ai/tools/comparison.ts');
              const details = input.properties.map((p, i) => {
                return `\n<h2>${escapeHtml(p.name)}</h2>\n` +
                       `<p><strong>Price:</strong> ${escapeHtml(p.price)}</p>\n` +
                       `<div class="card">\n${p.specs}\n</div>\n` +
                       `<h3>Advantages</h3>\n<ul>\n${p.pros.split('\n').filter(l => l.trim()).map(l => `<li>${escapeHtml(l.replace(/^[✓✅]\s*/, ''))}</li>`).join('\n')}\n</ul>\n` +
                       `<h3>Considerations</h3>\n<ul>\n${p.cons.split('\n').filter(l => l.trim()).map(l => `<li>${escapeHtml(l.replace(/^[✗❌]\s*/, ''))}</li>`).join('\n')}\n</ul>\n`;
              }).join('<hr class="divider">');
              return await executeComparison({ details, propertyName: 'Property Comparison' });
            } catch (err) {
              return { success: false, message: `Comparison generation failed: ${err.message}` };
            }
          },
        }),

        generate_presentation: tool({
          description: 'Generate a professional PowerPoint presentation with TopRealty branding (navy theme, slide numbers, branded master). Supports 6 slide types.',
          parameters: z.object({
            propertyName: z.string(),
            slides: z.array(z.object({
              title: z.string(), content: z.string(),
              type: z.enum(['title', 'content', 'two_column', 'section', 'bullets', 'end']).default('content').describe(
                'title=opening slide, content=heading+body, two_column=comparison, section=divider, bullets=bulleted list, end=closing slide'
              ),
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
