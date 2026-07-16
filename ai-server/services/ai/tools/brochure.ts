import { brochureHtml } from '../../documents/html.ts';
import { renderPdf } from '../../documents/pdf.ts';

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

  // PDF via HTML → Playwright (primary)
  if (format === 'pdf') {
    const html = brochureHtml({ property_name: propertyName, details, tone });
    const result = await renderPdf(html, sanitize(propertyName));
    return {
      success: true,
      message: `Brochure "${propertyName}" generated as PDF.`,
      files: [{ filename: result.filename, url: result.url }],
    };
  }

  // DOCX via Carbone (fallback)
  const { renderDocument } = await import('../../documents/carbone.ts');
  const carboneResult = await renderDocument('brochure.docx', {
    property_name: propertyName,
    details,
    tone,
    generated_date: new Date().toLocaleDateString('en-PH'),
  }, { convertTo: 'docx' });

  return {
    success: true,
    message: `Brochure "${propertyName}" generated as DOCX.`,
    files: [{ filename: carboneResult.filename, url: carboneResult.url }],
  };
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase() || 'brochure';
}
