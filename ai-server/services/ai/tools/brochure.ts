import { brochureHtml } from '../../documents/html.ts';
import { renderPdf, renderDocx } from '../../documents/pdf.ts';

export interface BrochureInput {
  propertyData?: Record<string, unknown>;
  /** Direct data for PDF pipeline (preferred) */
  propertyName?: string;
  details?: string;
  tone?: string;
  format?: 'pdf' | 'docx';
}

export interface BrochureOutput {
  success: boolean;
  message: string;
  files: Array<{ filename: string; url: string }>;
}

/**
 * Generate a property brochure as PDF via HTML→Playwright pipeline.
 * Also supports Carbone DOCX as fallback format.
 */
export async function executeBrochure(input: BrochureInput): Promise<BrochureOutput> {
  const format = input.format ?? 'pdf';
  const propertyName = (input.propertyName || (input.propertyData as any)?.property_name || 'Property Brochure') as string;
  const details = (input.details || (input.propertyData as any)?.details || '') as string;
  const tone = (input.tone || (input.propertyData as any)?.tone || 'standard') as string;

  // PDF via HTML → Playwright
  if (format === 'pdf') {
    const html = brochureHtml({ property_name: propertyName, details, tone });
    const result = await renderPdf(html, sanitize(propertyName));
    return {
      success: true,
      message: `Brochure "${propertyName}" generated as PDF.`,
      files: [{ filename: result.filename, url: result.url }],
    };
  }

  // DOCX via HTML → .doc (Word opens with full formatting)
  if (format === 'docx') {
    const html = brochureHtml({ property_name: propertyName, details, tone });
    const result = await renderDocx(html, sanitize(propertyName));
    return {
      success: true,
      message: `Brochure "${propertyName}" generated as DOCX.`,
      files: [{ filename: result.filename, url: result.url }],
    };
  }

  // Both
  const html = brochureHtml({ property_name: propertyName, details, tone });
  const [pdf, doc] = await Promise.all([
    renderPdf(html, sanitize(propertyName)),
    renderDocx(html, sanitize(propertyName)),
  ]);
  return {
    success: true,
    message: `Brochure "${propertyName}" generated as PDF and DOCX.`,
    files: [
      { filename: pdf.filename, url: pdf.url },
      { filename: doc.filename, url: doc.url },
    ],
  };
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase() || 'brochure';
}
