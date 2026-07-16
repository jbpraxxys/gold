import { renderDocument } from '../../documents/carbone'

export interface ComparisonInput {
  /** AI-formatted comparison text (markdown-style plain text with line breaks) */
  details: string
  /** Properties for metadata (not used in v3 single-field template) */
  properties?: Array<Record<string, unknown>>
}

export interface ComparisonOutput {
  success: boolean
  message: string
  summary: string
  downloadUrl: string
}

/**
 * Generate a property comparison document as DOCX.
 * Uses a single {d.details} Carbone field — same pattern as brochure.
 * (PDF conversion requires LibreOffice — DOCX is ready instantly.)
 */
export async function executeComparison(input: ComparisonInput): Promise<ComparisonOutput> {
  const result = await renderDocument('comparison.docx', {
    details: input.details,
    property_name: 'Property Comparison',
    generated_date: new Date().toLocaleDateString('en-PH'),
  }, {
    convertTo: 'docx',
  })

  return {
    success: true,
    message: 'Property comparison generated successfully as DOCX.',
    summary: 'A side-by-side property comparison report has been generated. Download the DOCX file for the complete analysis.',
    downloadUrl: result.url,
  }
}
