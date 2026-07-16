# Adding PDF Templates to TopRealty AI

The PDF pipeline is: **Structured data → HTML template → Playwright → PDF**

To add a new document type (e.g., property valuation report), follow these 3 steps:

---

## Step 1: Create the HTML Template

Add a new function in `ai-server/services/documents/html.ts`:

```typescript
/**
 * Property Valuation Report template.
 * Receives structured data, returns a complete HTML page.
 */
export function valuationHtml(data: {
  property_name: string;
  estimated_value: string;
  methodology: string;
  factors: string;             // HTML string from AI
}): string {
  const body = `
<h1>${escapeHtml(data.property_name)}</h1>
<p><strong>Estimated Value:</strong> <span class="price">${escapeHtml(data.estimated_value)}</span></p>

<h2>Valuation Methodology</h2>
<p>${escapeHtml(data.methodology)}</p>

<h2>Key Valuation Factors</h2>
<div class="markdown-content">
${renderHtml(data.factors)}
</div>

<hr class="divider">
<p style="font-size:9pt;color:#888"><em>This valuation is an estimate based on available market data.</em></p>
`;

  return baseHtml(body, data.property_name);
}
```

### Available CSS Classes
| Class | Effect |
|---|---|
| `.price` | Red maroon text (#941D28), bold |
| `.card` | Gray box with navy left border (for specs) |
| `.highlight` | Orange box with maroon left border (for callouts) |
| `.divider` | Horizontal rule |
| `.markdown-content` | Wrapper that applies p/strong/ul/ol/li styling |
| `.page-break` | Forces page break before this element |

### Available Helper Functions
| Function | Purpose |
|---|---|
| `baseHtml(body, title)` | Wraps content in the standard TopRealty header/footer |
| `renderHtml(html)` | Passes AI-generated HTML through (wraps bare text in `<p>`) |
| `escapeHtml(str)` | Escapes `&`, `<`, `>` for safe insertion |

---

## Step 2: Create the Tool Definition

In `ai-server/services/ai/tools/` create a new file, e.g., `valuation.ts`:

```typescript
import { valuationHtml } from '../../documents/html.ts';
import { renderPdf } from '../../documents/pdf.ts';

export interface ValuationInput {
  propertyName: string;
  estimatedValue: string;
  methodology: string;
  factors: string;  // AI fills this with HTML
}

export interface ValuationOutput {
  success: boolean;
  message: string;
  downloadUrl: string;
}

export async function executeValuation(input: ValuationInput) {
  const html = valuationHtml({
    property_name: input.propertyName,
    estimated_value: input.estimatedValue,
    methodology: input.methodology,
    factors: input.factors,
  });

  const result = await renderPdf(html, 
    input.propertyName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() + '-valuation'
  );

  return {
    success: true,
    message: `Valuation report for "${input.propertyName}" generated.`,
    downloadUrl: result.url,
  };
}
```

---

## Step 3: Register the Tool in server.js

In `ai-server/server.js`, add to the `tools:` object inside `streamText()`:

```javascript
generate_valuation: tool({
  description: 'Generate a professional property valuation report as PDF.',
  parameters: z.object({
    propertyName: z.string(),
    estimatedValue: z.string().describe('Estimated value (e.g., ₱15,000,000 – ₱18,000,000)'),
    methodology: z.string().describe('Valuation approach (e.g., Comparable Sales Method, Income Capitalization)'),
    factors: z.string().describe(
      'Factors in HTML. Use <h2> for sections, <table> for comparable sales, ' +
      '<ul> for key points, <strong> for figures. Write as a professional report.'
    ),
  }),
  execute: async (input) => {
    try {
      const { executeValuation } = await import('./services/ai/tools/valuation.ts');
      return await executeValuation(input);
    } catch (err) {
      return { success: false, message: `Valuation failed: ${err.message}` };
    }
  },
}),
```

That's it. The AI will now be able to call `generate_valuation` and produce a styled PDF.

---

## Design Tips

1. **Use the same patterns** as existing templates. All PDFs share the header/footer via `baseHtml()`.
2. **Inline styles only** — Playwright PDF renders CSS classes reliably, but `@import` external fonts work fine.
3. **Tables get navy styling automatically** — `<table>`, `<th>`, `<td>` are styled in `baseHtml()`.
4. **Keep it simple** — each template is one function exporting HTML. No build step, no template engine.
5. **AI content via `renderHtml()`** — the AI outputs HTML directly (tables, headings, lists), you just wrap it.
