/**
 * PDF Renderer — HTML → PDF via Playwright (Chromium)
 * 
 * Replaces Carbone/LibreOffice pipeline with modern HTML→PDF.
 * Approach: structured JSON → HTML template → Playwright → PDF buffer
 */

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUTPUT_DIR = path.resolve(process.cwd(), 'public', 'generated');

export interface PdfResult {
  filename: string;
  path: string;
  url: string;
}

function ensureOutputDir(): void {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

/**
 * Renders an HTML string to PDF using headless Chromium.
 * Returns the file info for download.
 */
export async function renderPdf(html: string, baseFilename: string): Promise<PdfResult> {
  ensureOutputDir();

  const timestamp = Date.now();
  const filename = `${timestamp}-${baseFilename}.pdf`;
  const outputPath = path.join(OUTPUT_DIR, filename);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.pdf({
      path: outputPath,
      format: 'A4',
      margin: { top: '15mm', bottom: '15mm', left: '12mm', right: '12mm' },
      printBackground: true,
    });

    return {
      filename,
      path: outputPath,
      url: `/generated/${filename}`,
    };
  } finally {
    await browser.close();
  }
}
