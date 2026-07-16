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
 * Generate a property comparison document as PDF.
 * Renders a Carbone DOCX template with multi-property comparison data.
 */
export async function executeComparison(input: ComparisonInput): Promise<ComparisonOutput> {
  const result = await renderDocument('comparison.docx', input.comparisonData, {
    convertTo: 'pdf',
  })

  return {
    success: true,
    message: 'Property comparison generated successfully.',
    summary: 'A side-by-side property comparison report has been generated, highlighting key differences in price, square footage, bedrooms, bathrooms, amenities, and location features. Download the PDF for the complete analysis.',
    downloadUrl: result.url,
  }
}
