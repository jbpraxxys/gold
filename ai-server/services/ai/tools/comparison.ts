import { renderDocument } from '../../documents/carbone'

export interface ComparisonInput {
  /** Comparison data: multiple properties with side-by-side features */
  comparisonData: Record<string, unknown>
}

export interface ComparisonOutput {
  success: boolean
  message: string
  summary: string
  downloadUrl: string
}

/**
 * Generate a property comparison document as DOCX.
 * Renders a Carbone DOCX template with multi-property comparison data.
 * (PDF conversion requires LibreOffice — DOCX is ready instantly.)
 */
export async function executeComparison(input: ComparisonInput): Promise<ComparisonOutput> {
  const result = await renderDocument('comparison.docx', input.comparisonData, {
    convertTo: 'docx',
  })

  return {
    success: true,
    message: 'Property comparison generated successfully as DOCX.',
    summary: 'A side-by-side property comparison report has been generated. Download the DOCX file for the complete analysis.',
    downloadUrl: result.url,
  }
}
