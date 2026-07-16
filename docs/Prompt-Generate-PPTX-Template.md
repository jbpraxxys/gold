# Prompt: Generate a TopRealty AI Presentation Template

Copy this prompt and send it to a higher-tier model (DeepSeek V4 Pro, Claude, GPT-4) to generate a new presentation template.

---

You are building a presentation template for TopRealty AI, a Philippine real estate CRM. The template uses Zod schemas for AI validation, PptxGenJS for PowerPoint export, and plain HTML for web preview.

## Context

Brand colors:
- Navy `#1A4175` — headings, title backgrounds, table headers
- Maroon `#941D28` — price text, accent bullets, highlights
- Slate `#475569` — body text
- Light gray `#F8FAFC` — card backgrounds

Slide dimensions: 13.33" × 7.5" (LAYOUT_WIDE). Positions in inches.

## Requirements

Create a template for **[describe your use case: investor pitch deck, luxury property showcase, rental portfolio, etc.]**. 

The template needs **[N]** slide layouts:

1. **[Layout name]** — what this slide shows
2. **[Layout name]** — what this slide shows
3. ...

## Output Format

For EACH layout, provide:

```typescript
{
  id: 'unique:layout-name',
  name: 'Human Name',
  description: 'What this layout is for and when the AI should use it',
  
  // Zod schema: exact fields the AI must provide
  schema: z.object({
    fieldName: z.string(),
    anotherField: z.string().optional(),
    multilineField: z.string().describe('Hint for the AI about content format'),
  }),
  
  // HTML renderer: produces a slide preview in web browser
  renderHtml: (content) => {
    // Return HTML string. Available helpers: esc() for safe output, htmlSlide() for wrapper
    return htmlSlide(`
      <h1>${esc(content.fieldName)}</h1>
      <p>${esc(content.anotherField)}</p>
    `, 1) // 1 = slide number for footer
  },
  
  // PPTX renderer: produces a PowerPoint slide
  renderPptx: (pres, content) => {
    const slide = pres.addSlide()
    // Use PptxGenJS API. Available helpers: pptxBar(slide, pres, title), addFooter(slide, pres, num)
    // Slide coordinates: x=left(inches), y=top(inches), w=width, h=height
    // Max usable area: x 0.3-9.7, y 0.3-7.2
    pptxBar(slide, pres, content.fieldName)
    addFooter(slide, pres, 2)
    slide.addText(content.anotherField, { x: 0.5, y: 1.2, w: 9, h: 5, fontSize: 14, fontFace: 'Calibri', color: '475569', valign: 'top', lineSpacingMultiple: 1.3 })
  },
}
```

## Register the Template

```typescript
const myTemplate: PresentationTemplate = {
  id: 'unique-template-id',
  name: 'Display Name for UI',
  primaryColor: '1A4175',
  layouts: [layout1, layout2, layout3],
}
registerTemplate(myTemplate)
```

## Rules

1. Every layout needs BOTH `renderHtml` AND `renderPptx` — the template renders to both formats
2. Zod schema fields should be descriptive — the AI reads `.describe()` hints to know what to fill in
3. PPTX positions use inches with origin at top-left of slide
4. Use Calibri font for all text
5. Title slides should have `slide.bkgd = '1A4175'` (navy background)
6. Content slides should use `pptxBar()` for the navy heading bar
7. All non-title slides should call `addFooter(slide, pres, slideNumber)`
8. For tables, accept pipe-delimited text: `"Col1|Col2\nVal1|Val2"`
9. For bullet lists, accept newline-separated text
10. Schema field names should use `snake_case` (not camelCase) to match our convention

## Example: A simple "Image + Text" layout

```typescript
{
  id: 'investor:image-text',
  name: 'Image + Text',
  description: 'Property photo with caption. Use for showcasing a specific property.',
  schema: z.object({
    title: z.string(),
    image_url: z.string().describe('Full URL to the property image'),
    caption: z.string().describe('2-3 sentence description'),
  }),
  renderHtml: (c) => htmlSlide(`
    <div class="heading-bar">${esc(c.title)}</div>
    <img src="${esc(c.image_url)}" style="width:45%;float:left;margin:16px;border-radius:8px" />
    <p style="width:45%;float:right;margin:16px">${esc(c.caption)}</p>
  `, 5),
  renderPptx: (pres, c) => {
    const slide = pres.addSlide()
    pptxBar(slide, pres, c.title)
    addFooter(slide, pres, 5)
    slide.addImage({ path: c.image_url, x: 0.5, y: 1.2, w: 4.5, h: 4 })
    slide.addText(c.caption, { x: 5.3, y: 1.2, w: 4.5, h: 4, fontSize: 14, fontFace: 'Calibri', color: '475569', valign: 'top', lineSpacingMultiple: 1.3 })
  },
}
```

Now generate a complete template file. Output ONLY the TypeScript code — no explanations.
