import { buildPresentation } from '../../documents/pptx'

export interface PresentationSlide {
  title: string
  content: string
  type: 'title' | 'content' | 'two_column'
  left?: { title: string; content: string }
  right?: { title: string; content: string }
}

export interface PresentationInput {
  /** Title for the presentation (used as part of the filename) */
  title: string
  /** Slides to include */
  slides: PresentationSlide[]
}

export interface PresentationOutput {
  success: boolean
  message: string
  slideCount: number
  downloadUrl: string
}

/**
 * Generate a PowerPoint presentation from slide definitions.
 * Supports title slides, content slides, and two-column layouts.
 */
export async function executePresentation(
  input: PresentationInput,
): Promise<PresentationOutput> {
  const safeFilename = input.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') + '.pptx'

  const result = await buildPresentation(input.slides, safeFilename)

  return {
    success: true,
    message: `Presentation "${input.title}" generated with ${input.slides.length} slides.`,
    slideCount: input.slides.length,
    downloadUrl: result.url,
  }
}
