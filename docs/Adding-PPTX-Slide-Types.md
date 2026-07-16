# Adding PPTX Slide Templates to TopRealty AI

The PPTX pipeline is: **AI generates JSON slides → PptxGenJS builds .pptx**

Adding a new slide type takes 3 steps:

---

## Step 1: Add the Slide Builder Function

In `ai-server/services/documents/pptx.ts`, add a new function following the existing pattern:

```typescript
/**
 * Table slide: navy heading + a formatted table.
 * Body text should contain rows separated by newlines, columns by | or tabs.
 */
function addTableSlide(
  pres: PptxGenJS,
  heading: string,
  body: string,
): void {
  const slide = pres.addSlide()

  // Heading bar (same as content slide)
  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: 0.9,
    fill: { color: NAVY },
  })
  slide.addText(heading, {
    x: 0.6, y: 0, w: '90%', h: 0.9,
    fontSize: 28, bold: true, color: WHITE, valign: 'middle',
  })

  // Parse body into rows
  const rows = body.split('\n')
    .filter(Boolean)
    .map(line => line.split('|').map(c => c.trim()).filter(Boolean))

  if (rows.length > 0) {
    slide.addTable(rows, {
      x: 0.5, y: 1.2, w: 9,
      border: { type: 'solid', color: NAVY },
      colW: rows[0].map(() => 9 / rows[0].length),
      rowH: Array(rows.length).fill(0.5),
      fontFace: 'Calibri',
      fontSize: 11,
      color: DARK_TEXT,
      fill: { color: WHITE },
      autoPage: true,
    })
  }
}
```

### PptxGenJS Quick Reference

| Feature | Code |
|---|---|
| Text box | `slide.addText(text, { x, y, w, h, fontSize, color, bold })` |
| Shape | `slide.addShape(pres.ShapeType.rect, { x, y, w, h, fill })` |
| Table | `slide.addTable(rows, { x, y, w, border, colW, rowH })` |
| Image | `slide.addImage({ path: 'file.png', x, y, w, h })` |
| Background | `slide.bkgd = '1A4175'` |
| Bullets | `{ text: 'item', options: { bullet: true } }` |

---

## Step 2: Register the Slide Type

### 2a. Add to the `SlideType` union (line ~46)

```typescript
export type SlideType = 'title' | 'content' | 'two_column' | 'section' | 'bullets' | 'end' | 'table'
```

### 2b. Add to the switch statement (line ~245)

```typescript
case 'table': addTableSlide(pres, t, c); break;
```

---

## Step 3: Update server.js Tool Description

In the `generate_presentation` tool's `z.enum()`, add the new type:

```javascript
type: z.enum(['title', 'content', 'two_column', 'section', 'bullets', 'end', 'table']).default('content')
```

That's it. The AI will now be able to use `type: 'table'` when generating presentations.

---

## Design Guidelines

1. **Use brand colors** — `NAVY = '1A4175'`, `MAROON = '941D28'`, `WHITE = 'FFFFFF'`
2. **Position units are in inches** — layout is `LAYOUT_WIDE` (13.33" × 7.5")
3. **Content text is pre-stripped of HTML** — `stripHtml()` runs before builders
4. **The slide master** adds "TopRealty AI" footer and page numbers automatically
5. **Keep it simple** — PptxGenJS handles charts, tables, images, shapes natively. Just build the layout.

---

## Adding Charts

PptxGenJS supports charts directly. Add a chart slide type:

```typescript
function addChartSlide(pres: PptxGenJS, heading: string, chartDataJson: string): void {
  const slide = pres.addSlide()
  // Heading bar...
  const chartData = JSON.parse(chartDataJson)
  slide.addChart(pres.ChartType.bar, chartData, {
    x: 0.5, y: 1.2, w: 9, h: 4.5,
    showTitle: false,
    catAxisLabelColor: NAVY,
    valAxisLabelColor: NAVY,
  })
}
```

Then the AI can include charts by passing structured JSON in the slide `content` field, and you parse it in the builder.
