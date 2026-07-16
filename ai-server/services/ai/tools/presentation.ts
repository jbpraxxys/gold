import { renderPdf } from '../../documents/pdf.ts'
import { renderPresentationHtml } from '../../documents/presentation-json.ts'
import { getTemplate } from '../../../presentation-templates/registry.ts'
import fs from 'node:fs'
import path from 'node:path'

// Load templates (side-effect: registers them)
import '../../../presentation-templates/broker.ts'
import '../../../presentation-templates/luxury.ts'

const OUTPUT_DIR = path.resolve(process.cwd(), 'public', 'generated')

// Dynamic import of pptxgen for the PPTX renderer
async function createPptxGen() {
  const pptxgenjs = await import('pptxgenjs')
  return (pptxgenjs as any).default?.default || (pptxgenjs as any).default || pptxgenjs
}

export interface PresentationInput {
  template?: string
  title?: string,
  slides: Array<{
    layout: string    // e.g., 'broker:title' or 'broker:property-overview'
    content: Record<string, any>
  }>
  format?: 'pptx' | 'pdf' | 'html'
}

export interface PresentationOutput {
  success: boolean
  message: string
  downloadUrl?: string
  files?: Array<{ filename: string; url: string; format: string }>
}

export async function executePresentation(input: PresentationInput): Promise<PresentationOutput> {
  const templateId = input.template || 'toprealty-broker'
  const template = getTemplate(templateId)
  if (!template) return { success: false, message: `Template "${templateId}" not found. Available: ${Array.from((await import('../../../presentation-templates/registry.ts')).listTemplates()).map((t: any) => t.id).join(', ')}` }

  const format = input.format || 'pptx'

  // Validate all slides against their layout schemas first
  const validatedSlides: Array<{ layout: typeof template.layouts[0]; content: Record<string, any> }> = []
  for (const s of input.slides) {
    const layout = template.layouts.find(l => l.id === s.layout)
    if (!layout) return { success: false, message: `Layout "${s.layout}" not found in template "${templateId}". Available: ${template.layouts.map(l => l.id).join(', ')}` }

    const parsed = layout.schema.safeParse(s.content)
    if (!parsed.success) {
      return { success: false, message: `Invalid content for layout "${s.layout}": ${parsed.error.message}` }
    }
    validatedSlides.push({ layout, content: parsed.data })
  }

  const baseName = (input.title || 'presentation').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
  const timestamp = Date.now()
  const files: Array<{ filename: string; url: string; format: string }> = []

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  // ─── PPTX (always generated) ──────────────────────────────────
  const PptxGenJS = await createPptxGen()
  const pres = new PptxGenJS()
  pres.layout = 'LAYOUT_WIDE'

  // Use each layout's own PPTX renderer
  for (const { layout, content } of validatedSlides) {
    layout.renderPptx(pres, content)
  }

  const pptxFilename = `${timestamp}-${baseName}.pptx`
  const pptxPath = path.join(OUTPUT_DIR, pptxFilename)
  await pres.writeFile({ fileName: pptxPath })
  files.push({ filename: pptxFilename, url: `/generated/${pptxFilename}`, format: 'PPTX' })

  // ─── PDF (if requested) ───────────────────────────────────────
  if (format === 'pdf') {
    const html = renderPresentationHtml({
      title: input.title || 'Presentation',
      slides: validatedSlides.map(({ layout, content }) => ({
        title: (content as any).property_name || (content as any).message || 'Slide',
        content: Object.values(content).join('\n'),
        type: layout.id.split(':').pop() as any,
      })),
      theme: { primary: template.primaryColor },
    })
    const pdfResult = await renderPdf(html, baseName)
    files.push({ filename: pdfResult.filename, url: pdfResult.url, format: 'PDF' })
  }

  return {
    success: true,
    message: `Presentation generated as ${format.toUpperCase()} with ${validatedSlides.length} slides.`,
    downloadUrl: `/generated/${pptxFilename}`,
    files,
  }
}
