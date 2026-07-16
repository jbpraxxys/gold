# Creating Presentation Templates for TopRealty AI

Add new templates in `ai-server/presentation-templates/`. Each template is one file.

---

## Quick Start: Copy & Modify

```bash
cp ai-server/presentation-templates/broker.ts ai-server/presentation-templates/my-template.ts
```

Then edit `my-template.ts`:

1. Change the template `id` and `name`
2. Modify/add slide layouts
3. Import in `server.js`: `import './presentation-templates/my-template.ts'`
4. Restart server — it's available

---

## Anatomy of a Layout

Each slide layout has 4 parts:

```typescript
const myLayout = {
  // 1. IDENTITY — unique ID, used by AI to reference this layout
  id: 'my-template:layout-name',
  name: 'Human-Readable Name',
  description: 'What this layout is for. The AI reads this to decide when to use it.',
  
  // 2. SCHEMA — Zod validation. This is the AI's "form" to fill in
  schema: z.object({
    title: z.string(),
    body: z.string(),
    budget: z.string().optional(),
  }),
  
  // 3. HTML RENDERER — for web preview
  renderHtml: (content: Record<string, any>) => {
    return `<section class="slide">
      <h1>${content.title}</h1>
      <p>${content.body}</p>
    </section>`
  },
  
  // 4. PPTX RENDERER — for PowerPoint export
  renderPptx: (pres: PptxGenJS, content: Record<string, any>) => {
    const slide = pres.addSlide()
    slide.addText(content.title, { x: 0.5, y: 0.5, w: 9, h: 1, fontSize: 28, bold: true, color: '1A4175' })
    slide.addText(content.body, { x: 0.5, y: 1.5, w: 9, h: 4, fontSize: 14 })
  },
}
```

---

## Design Tokens

Use these brand colors consistently:

| Token | Hex | Use |
|---|---|---|
| Navy | `1A4175` | Headings, title backgrounds, table headers |
| Maroon | `941D28` | Price text, accent bullets, highlights |
| White | `FFFFFF` | Text on dark backgrounds |
| Slate | `475569` | Body text |
| Light BG | `F8FAFC` | Card backgrounds |

---

## PptxGenJS Quick Reference

```typescript
// Text box
slide.addText('Hello', { x: 0.5, y: 0.5, w: 9, h: 1, fontSize: 14, color: '333333', bold: true, align: 'center', fontFace: 'Calibri' })

// Shape (rectangle)
slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.8, fill: { color: '1A4175' }, rectRadius: 0.05 })

// Background
slide.bkgd = '1A4175'

// Table
slide.addTable([['H1','H2'],['r1','r2']], { x: 0.5, y: 1, w: 9, border: { type:'solid', color:'D1D5DB' }, fontSize: 10 })

// Bullets  
slide.addText([{ text: 'Item', options: { bullet: true } }], { x: 1, y: 2, w: 8, h: 3 })

// Shadow on shape
slide.addShape(pres.ShapeType.rect, { ...fill, shadow: { type:'outer', blur: 4, offset: 2, color:'D1D5DB', opacity: 0.3 } })
```

**Slide dimensions** (LAYOUT_WIDE): 13.33" × 7.5" — positions are in inches.

---

## Helper Functions (available in your template)

```typescript
function pptxBar(slide, pres, title)  // Navy heading bar at top
function addFooter(slide, pres, num)  // Branded footer + slide number
function esc(str)                     // HTML-escape for preview
function htmlSlide(content, num)      // Wrapper for preview slides
```

---

## Registering

```typescript
import { registerTemplate } from './registry.ts'

const myTemplate = { id: 'my-id', name: 'My Template', primaryColor: '1A4175', layouts: [...] }
registerTemplate(myTemplate)
```

Then in `server.js`:
```javascript
import './presentation-templates/my-template.ts'
```

Done. The AI discovers it via the Zod schema and tool description.
