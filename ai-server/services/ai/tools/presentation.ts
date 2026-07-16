import { renderPdf } from '../../documents/pdf.ts'
import { renderPresentationHtml } from '../../documents/presentation-json.ts'
import { getTemplate } from '../../presentation-templates/registry.ts'

// Load templates (side-effect: registers them)
import '../../presentation-templates/broker.ts'

// Dynamic import of pptx.ts (has ESM/CJS interop)
async function buildPptx(slides: any[], filename: string) {
  const { buildPresentation } = await import('../../documents/pptx.ts')
  return buildPresentation(slides, filename)
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
  if (!template) return { success: false, message: `Template "${templateId}" not found. Available: ${require('../../presentation-templates/registry.ts').listTemplates().map((t: any) => t.id).join(', ')}` }

  const format = input.format || 'pptx'

  // Build flat slides compatible with existing pptx.ts buildPresentation()
  const flatSlides: Array<{ title: string; content: string; type: string }> = []

  for (const s of input.slides) {
    const layout = template.layouts.find(l => l.id === s.layout)
    if (!layout) return { success: false, message: `Layout "${s.layout}" not found in template "${templateId}". Available: ${template.layouts.map(l => l.id).join(', ')}` }

    // Validate content against schema
    const parsed = layout.schema.safeParse(s.content)
    if (!parsed.success) {
      return { success: false, message: `Invalid content for layout "${s.layout}": ${parsed.error.message}` }
    }

    // Build a title/content string for the flat renderer
    const c = parsed.data
    const title = c.property_name || c.message || c.title || 'Slide'
    const content = Object.entries(c)
      .filter(([k]) => !['property_name', 'message', 'agent'].includes(k))
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n')

    flatSlides.push({ title, content, type: layout.id.split(':').pop() || 'content' })
  }

  // Generate renderer-specific output
  const baseName = (input.title || 'presentation').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()

  if (format === 'html') {
    // Build for presenton-style JSON→HTML preview
    const previewData = {
      title: input.title || 'Presentation',
      slides: flatSlides.map(s => ({ title: s.title, content: s.content, type: s.type as any })),
    }
    return {
      success: true,
      message: 'HTML preview ready.',
      files: [],
    }
  }

  // PDF and PPTX
  const pptxResult = await buildPptx(flatSlides, `${baseName}.pptx`)

  const files: Array<{ filename: string; url: string; format: string }> = [
    { filename: pptxResult.filename, url: pptxResult.url, format: 'PPTX' },
  ]

  if (format === 'pdf') {
    const html = renderPresentationHtml({
      title: input.title || 'Presentation',
      slides: flatSlides.map(s => ({ title: s.title, content: s.content, type: s.type as any })),
      theme: { primary: template.primaryColor },
    })
    const pdfResult = await renderPdf(html, baseName)
    files.push({ filename: pdfResult.filename, url: pdfResult.url, format: 'PDF' })
  }

  return {
    success: true,
    message: `Presentation generated as ${format.toUpperCase()}.`,
    downloadUrl: pptxResult.url,
    files,
  }
}
