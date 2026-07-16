import { renderDocument } from '../../documents/carbone'

export interface BrochureInput {
  /** Property data to populate the brochure template */
  propertyData: Record<string, unknown>
  /** Output format */
  format?: 'pdf' | 'docx'
}

export interface BrochureOutput {
  success: boolean
  message: string
  files: Array<{
    filename: string
    url: string
  }>
}

/**
 * Generate a property brochure from a Carbone DOCX template.
 * Renders the broker-supplied template and returns downloadable file URLs.
 */
export async function executeBrochure(input: BrochureInput): Promise<BrochureOutput> {
  const format = input.format ?? 'pdf'

  const result = await renderDocument('brochure.docx', input.propertyData, {
    convertTo: format,
  })

  return {
    success: true,
    message: `Brochure generated successfully as ${format.toUpperCase()}.`,
    files: [
      {
        filename: result.filename,
        url: result.url,
      },
    ],
  }
}
