import { comparisonHtml } from '../../documents/html.ts';
import { renderPdf } from '../../documents/pdf.ts';

export interface ComparisonInput {
  details?: string;
  properties?: Array<Record<string, unknown>>;
  propertyName?: string;
}

export interface ComparisonOutput {
  success: boolean;
  message: string;
  summary: string;
  downloadUrl: string;
}

/**
 * Generate a property comparison as PDF via HTML→Playwright pipeline.
 */
export async function executeComparison(input: ComparisonInput): Promise<ComparisonOutput> {
  const propertyName = (input.propertyName || 'Property Comparison') as string;
  const details = (input.details || '') as string;

  const html = comparisonHtml({ property_name: propertyName, details });
  const result = await renderPdf(html, sanitize(propertyName) + '-comparison');

  return {
    success: true,
    message: `Property comparison generated as PDF.`,
    summary: 'A side-by-side property comparison has been generated as PDF.',
    downloadUrl: result.url,
  };
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase() || 'comparison';
}
