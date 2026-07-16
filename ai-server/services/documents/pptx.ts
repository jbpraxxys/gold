import pptxgenjs from 'pptxgenjs'
import fs from 'node:fs'
import path from 'node:path'

// Handle ESM/CJS interop — tsx dynamic imports may wrap the default
const PptxGenJS: typeof pptxgenjs = (pptxgenjs as any).default || pptxgenjs

const OUTPUT_DIR = path.resolve(process.cwd(), 'public', 'generated')

// ─── Helpers ─────────────────────────────────────────────────────────
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Convert bullet text (lines starting with - or •) to PptxGenJS bullet format */
function toBullets(text: string): Array<{ text: string; options: Record<string, unknown> }> {
  return text.split('\n')
    .map(line => line.replace(/^[-•]\s*/, '').trim())
    .filter(Boolean)
    .map(t => ({ text: t, options: { bullet: true, breakLine: true } }));
}

// ─── Brand colors ────────────────────────────────────────────────────
const NAVY = '1A4175'
const MAROON = '941D28'
const WHITE = 'FFFFFF'
const LIGHT_GRAY = 'F5F5F5'
const BODY_TEXT_COLOR = '2D3748'

// ─── Types ───────────────────────────────────────────────────────────
export type SlideType = 'title' | 'content' | 'two_column' | 'section' | 'bullets' | 'end'

export interface SlideContent {
  title: string
  content: string
  type: SlideType
}

export interface TwoColumnSlide extends SlideContent {
  type: 'two_column'
  left?: { title: string; content: string }
  right?: { title: string; content: string }
}

export interface PresentationResult {
  filename: string
  path: string
  url: string
}

// ─── Slide builders ──────────────────────────────────────────────────

/** Title slide: navy background, centered white title + subtitle */
function addTitleSlide(pres: PptxGenJS, title: string, subtitle?: string): void {
  const slide = pres.addSlide()
  slide.bkgd = NAVY

  slide.addText(title, {
    x: 0.5, y: 1.5, w: '90%', h: 1.5,
    fontSize: 36, bold: true, color: WHITE,
    align: 'center', valign: 'middle',
  })

  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.5, y: 3.2, w: '90%', h: 0.8,
      fontSize: 18, color: WHITE,
      align: 'center', valign: 'middle',
    })
  }
}

/** Content slide: navy heading bar + body text */
function addContentSlide(pres: PptxGenJS, heading: string, body: string): void {
  const slide = pres.addSlide()

  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: 0.9,
    fill: { color: NAVY },
  })

  slide.addText(heading, {
    x: 0.6, y: 0, w: '90%', h: 0.9,
    fontSize: 28, bold: true, color: WHITE, valign: 'middle',
  })

  slide.addText(body, {
    x: 0.6, y: 1.2, w: '90%', h: 5,
    fontSize: 14, color: BODY_TEXT_COLOR, valign: 'top',
    lineSpacingMultiple: 1.3,
  })
}

/** Two-column slide: left/right content blocks with navy headers */
function addTwoColumnSlide(
  pres: PptxGenJS,
  leftTitle: string, leftContent: string,
  rightTitle: string, rightContent: string,
): void {
  const slide = pres.addSlide()

  const headerH = 0.7, colW = 4.7, colX1 = 0.3, colX2 = 5.3, bodyY = 1.3

  for (const [x, title, content] of [[colX1, leftTitle, leftContent], [colX2, rightTitle, rightContent]] as const) {
    slide.addShape(pres.ShapeType.rect, {
      x, y: 0.4, w: colW, h: headerH,
      fill: { color: NAVY }, rectRadius: 0.05,
    })
    slide.addText(title, {
      x: x + 0.2, y: 0.4, w: colW - 0.4, h: headerH,
      fontSize: 18, bold: true, color: WHITE, valign: 'middle',
    })
    slide.addText(content, {
      x: x + 0.2, y: bodyY, w: colW - 0.4, h: 5.2,
      fontSize: 12, color: BODY_TEXT_COLOR, valign: 'top',
      lineSpacingMultiple: 1.2,
    })
  }
}

/** Section divider: navy background, large centered title */
function addSectionSlide(pres: PptxGenJS, title: string, subtitle?: string): void {
  const slide = pres.addSlide()
  slide.bkgd = NAVY

  slide.addShape(pres.ShapeType.rect, {
    x: 1, y: 2.2, w: 8, h: 0.05,
    fill: { color: WHITE },
  })

  slide.addText(title, {
    x: 0.5, y: 1.4, w: '90%', h: 1,
    fontSize: 32, bold: true, color: WHITE,
    align: 'center', valign: 'bottom',
  })

  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.5, y: 2.5, w: '90%', h: 0.6,
      fontSize: 16, color: WHITE,
      align: 'center', valign: 'top',
    })
  }
}

/** Bullet list slide: navy heading + bulleted items */
function addBulletsSlide(pres: PptxGenJS, heading: string, body: string): void {
  const slide = pres.addSlide()

  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: 0.9,
    fill: { color: NAVY },
  })

  slide.addText(heading, {
    x: 0.6, y: 0, w: '90%', h: 0.9,
    fontSize: 28, bold: true, color: WHITE, valign: 'middle',
  })

  slide.addText(toBullets(body), {
    x: 1, y: 1.3, w: 8, h: 5,
    fontSize: 16, color: BODY_TEXT_COLOR, valign: 'top',
    lineSpacingMultiple: 1.5, paraSpaceAfter: 8,
  })
}

/** End slide: navy background, thank you message with brand */
function addEndSlide(pres: PptxGenJS, title: string): void {
  const slide = pres.addSlide()
  slide.bkgd = NAVY

  slide.addText(title || 'Thank You', {
    x: 0.5, y: 2, w: '90%', h: 1,
    fontSize: 40, bold: true, color: WHITE,
    align: 'center', valign: 'middle',
  })

  slide.addText('TopRealty AI  •  www.toprealty.ai', {
    x: 0.5, y: 3.5, w: '90%', h: 0.5,
    fontSize: 14, color: 'B0BEC5',
    align: 'center', valign: 'middle',
  })
}

// ─── Public API ──────────────────────────────────────────────────────

function ensureOutputDir(): void {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }
}

interface BuildSlide {
  title: string
  content: string
  type: SlideType
  left?: { title: string; content: string }
  right?: { title: string; content: string }
}

/**
 * Build a PowerPoint presentation.
 *
 * Slide types:
 * - 'title'      — Navy background, centered title + optional subtitle
 * - 'content'    — Navy heading bar + body text
 * - 'two_column' — Left/right comparison blocks
 * - 'section'    — Divider slide with large centered title
 * - 'bullets'    — Heading + bulleted list
 * - 'end'        — Thank you / closing slide
 */
export async function buildPresentation(
  slides: BuildSlide[],
  customFilename: string,
): Promise<PresentationResult> {
  ensureOutputDir()

  const filename = `${Date.now()}-${customFilename}`
  const outputPath = path.join(OUTPUT_DIR, filename)

  const pres = new PptxGenJS()
  pres.layout = 'LAYOUT_WIDE'

  // Branded slide number on every slide
  pres.defineSlideMaster({
    title: 'TOPREALTY',
    background: { color: WHITE },
    objects: [
      { text: { text: 'TopRealty AI', options: { fontSize: 9, color: '999999', x: 8.5, y: 5.2, w: 1.5 } } },
    ],
    slideNumber: { x: 0.3, y: 5.2, color: '999999', fontSize: 9 },
  })

  for (const slide of slides) {
    const t = stripHtml(slide.title || '')
    const c = stripHtml(slide.content || '')

    switch (slide.type) {
      case 'title':   addTitleSlide(pres, t, c || undefined); break
      case 'content': addContentSlide(pres, t, c); break
      case 'section': addSectionSlide(pres, t, c || undefined); break
      case 'bullets': addBulletsSlide(pres, t, c); break
      case 'end':     addEndSlide(pres, t); break
      case 'two_column': {
        const left = slide.left ?? { title: '', content: '' }
        const right = slide.right ?? { title: '', content: '' }
        addTwoColumnSlide(pres,
          stripHtml(left.title || slide.title),
          stripHtml(left.content),
          stripHtml(right.title || ''),
          stripHtml(right.content),
        )
        break
      }
    }
  }

  await pres.writeFile({ fileName: outputPath })

  return {
    filename,
    path: outputPath,
    url: `/generated/${filename}`,
  }
}
