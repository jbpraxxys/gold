import { renderDocument } from '../../documents/carbone'

export interface CmaInput {
  /** CMA data: comparables, market trends, valuation, adjustments */
  cmaData: Record<string, unknown>
}

export interface CmaOutput {
  success: boolean
  message: string
  summary: string
  downloadUrl: string
}

/**
 * Generate a Comparative Market Analysis (CMA) report as PDF.
 * Uses a Carbone DOCX template and converts to PDF.
 */
export async function executeCma(input: CmaInput): Promise<CmaOutput> {
  const result = await renderDocument('cma-report.docx', input.cmaData, {
    convertTo: 'pdf',
  })

  return {
    success: true,
    message: 'CMA report generated successfully.',
    summary: 'A comprehensive Comparative Market Analysis (CMA) report has been generated, including comparable property analysis, market trends, valuation adjustments, and a recommended listing price range. Download the full PDF for detailed charts and data.',
    downloadUrl: result.url,
  }
}
