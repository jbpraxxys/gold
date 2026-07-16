import { comparisonHtml } from '../../documents/html.ts';
import { renderPdf, renderDocx } from '../../documents/pdf.ts';

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
  files?: Array<{ filename: string; url: string }>;
}

export async function executeComparison(input: ComparisonInput): Promise<ComparisonOutput> {
  const propertyName = (input.propertyName || 'Property Comparison') as string;
  const details = (input.details || '') as string;
  const baseName = sanitize(propertyName) + '-comparison';

  const html = comparisonHtml({ property_name: propertyName, details });

  // Generate both PDF and DOCX from the same HTML
  const [pdfResult, docResult] = await Promise.all([
    renderPdf(html, baseName),
    renderDocx(html, baseName),
  ]);

  return {
    success: true,
    message: `Property comparison generated as PDF and DOCX.`,
    summary: 'A side-by-side property comparison has been generated in both formats.',
    downloadUrl: pdfResult.url,
    files: [
      { filename: pdfResult.filename, url: pdfResult.url },
      { filename: docResult.filename, url: docResult.url },
    ],
  };
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase() || 'comparison';
}
