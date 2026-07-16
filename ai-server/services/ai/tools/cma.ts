import { cmaHtml } from '../../documents/html.ts';
import { renderPdf } from '../../documents/pdf.ts';

export interface CmaInput {
  cmaData?: Record<string, unknown>;
  subjectName?: string;
  subjectPrice?: string;
  comparables?: string;
  marketTrends?: string;
}

export interface CmaOutput {
  success: boolean;
  message: string;
  summary: string;
  downloadUrl: string;
}

/**
 * Generate a CMA report as PDF via HTML→Playwright pipeline.
 */
export async function executeCma(input: CmaInput): Promise<CmaOutput> {
  const subjectName = (input.subjectName || (input.cmaData as any)?.subject_name || 'CMA Report') as string;
  const subjectPrice = (input.subjectPrice || (input.cmaData as any)?.subject_price || '') as string;
  const comparables = (input.comparables || (input.cmaData as any)?.comparables || '') as string;
  const marketTrends = (input.marketTrends || (input.cmaData as any)?.market_trends || '') as string;

  const html = cmaHtml({
    subject_name: subjectName,
    subject_price: subjectPrice,
    comparables,
    market_trends: marketTrends,
  });

  const result = await renderPdf(html, sanitize(subjectName) + '-cma');

  return {
    success: true,
    message: `CMA report "${subjectName}" generated as PDF.`,
    summary: 'A comprehensive Comparative Market Analysis report has been generated as PDF.',
    downloadUrl: result.url,
  };
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase() || 'cma-report';
}
