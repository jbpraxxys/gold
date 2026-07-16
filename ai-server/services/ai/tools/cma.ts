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
 * Generate a Comparative Market Analysis (CMA) report as DOCX.
 * Uses a Carbone DOCX template. (PDF conversion requires LibreOffice.)
 */
export async function executeCma(input: CmaInput): Promise<CmaOutput> {
  const result = await renderDocument('cma-report.docx', input.cmaData, {
    convertTo: 'docx',
  })

  return {
    success: true,
    message: 'CMA report generated successfully as DOCX.',
    summary: 'A comprehensive Comparative Market Analysis (CMA) report has been generated. Download the DOCX for detailed charts and data.',
    downloadUrl: result.url,
  }
}
