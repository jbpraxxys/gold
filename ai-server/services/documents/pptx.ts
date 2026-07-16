import pptxgenjs from 'pptxgenjs'
import fs from 'node:fs'
import path from 'node:path'

// Handle ESM/CJS interop — tsx dynamic imports may wrap the default
const PptxGenJS: typeof pptxgenjs = (pptxgenjs as any).default || pptxgenjs

const OUTPUT_DIR = path.resolve(process.cwd(), 'public', 'generated')

// ─── Helpers ─────────────────────────────────────────────────────────
/** Strip HTML tags and convert to plain text with line breaks */
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

// ─── Brand colors ────────────────────────────────────────────────────────
const NAVY = '1A4175'
const WHITE = 'FFFFFF'
const DARK_TEXT = '1A1A2E'
const BODY_TEXT_COLOR = '2D3748'

// ─── Types ───────────────────────────────────────────────────────────────

export type SlideType = 'title' | 'content' | 'two_column'

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

// ─── Slide builders ──────────────────────────────────────────────────────

function addTitleSlide(
  pres: PptxGenJS,
  title: string,
  subtitle?: string,
): void {
  const slide = pres.addSlide()
  slide.bkgd = NAVY

  slide.addText(title, {
    x: 0.5,
    y: 1.5,
    w: '90%',
    h: 1.5,
    fontSize: 36,
    bold: true,
    color: WHITE,
    align: 'center',
    valign: 'middle',
  })

  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.5,
      y: 3.2,
      w: '90%',
      h: 0.8,
      fontSize: 18,
      color: WHITE,
      align: 'center',
      valign: 'middle',
    })
  }
}

function addContentSlide(
  pres: PptxGenJS,
  heading: string,
  body: string,
): void {
  const slide = pres.addSlide()

  // Heading bar
  slide.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.9,
    fill: { color: NAVY },
  })

  slide.addText(heading, {
    x: 0.6,
    y: 0,
    w: '90%',
    h: 0.9,
    fontSize: 28,
    bold: true,
    color: WHITE,
    valign: 'middle',
  })

  slide.addText(body, {
    x: 0.6,
    y: 1.2,
    w: '90%',
    h: 5,
    fontSize: 14,
    color: BODY_TEXT_COLOR,
    valign: 'top',
    lineSpacingMultiple: 1.3,
  })
}

function addTwoColumnSlide(
  pres: PptxGenJS,
  leftTitle: string,
  leftContent: string,
  rightTitle: string,
  rightContent: string,
): void {
  const slide = pres.addSlide()

  // Left column
  slide.addShape(pres.ShapeType.rect, {
    x: 0.3,
    y: 0.4,
    w: 4.7,
    h: 0.7,
    fill: { color: NAVY },
    rectRadius: 0.05,
  })

  slide.addText(leftTitle, {
    x: 0.5,
    y: 0.4,
    w: 4.3,
    h: 0.7,
    fontSize: 18,
    bold: true,
    color: WHITE,
    valign: 'middle',
  })

  slide.addText(leftContent, {
    x: 0.5,
    y: 1.3,
    w: 4.3,
    h: 5.2,
    fontSize: 12,
    color: BODY_TEXT_COLOR,
    valign: 'top',
    lineSpacingMultiple: 1.2,
  })

  // Right column
  slide.addShape(pres.ShapeType.rect, {
    x: 5.3,
    y: 0.4,
    w: 4.7,
    h: 0.7,
    fill: { color: NAVY },
    rectRadius: 0.05,
  })

  slide.addText(rightTitle, {
    x: 5.5,
    y: 0.4,
    w: 4.3,
    h: 0.7,
    fontSize: 18,
    bold: true,
    color: WHITE,
    valign: 'middle',
  })

  slide.addText(rightContent, {
    x: 5.5,
    y: 1.3,
    w: 4.3,
    h: 5.2,
    fontSize: 12,
    color: BODY_TEXT_COLOR,
    valign: 'top',
    lineSpacingMultiple: 1.2,
  })
}

// ─── Public API ──────────────────────────────────────────────────────────

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
 * Build a PowerPoint presentation from an array of slide definitions.
 *
 * Each slide has:
 * - `type: 'title'` – Navy background, white 36pt bold title, optional subtitle via `content`
 * - `type: 'content'` – Navy 28pt heading bar, dark 14pt body text
 * - `type: 'two_column'` – Split layout with left/right title and content blocks
 *
 * @param slides - Array of slide definitions
 * @param customFilename - Output filename (e.g. 'property-presentation.pptx')
 * @returns Object with filename, absolute path, and public URL
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

  for (const slide of slides) {
    const t = stripHtml(slide.title || '');
    const c = stripHtml(slide.content || '');

    switch (slide.type) {
      case 'title': {
        addTitleSlide(pres, t, c || undefined);
        break;
      }
      case 'content': {
        addContentSlide(pres, t, c);
        break;
      }
      case 'two_column': {
        const left = slide.left ?? { title: '', content: '' };
        const right = slide.right ?? { title: '', content: '' };
        addTwoColumnSlide(
          pres,
          stripHtml(left.title || slide.title),
          stripHtml(left.content),
          stripHtml(right.title || ''),
          stripHtml(right.content),
        );
        break;
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
