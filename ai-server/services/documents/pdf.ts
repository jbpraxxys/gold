/**
 * PDF & DOCX Renderer — HTML → PDF/DOCX via Playwright & direct HTML
 * 
 * PDF: Playwright Chromium renders HTML to PDF
 * DOCX: Saves HTML as .doc — Word opens it natively with full formatting
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

/**
 * Renders an HTML string to a Word-compatible DOC file.
 * Saves HTML with .doc extension — Microsoft Word opens it natively
 * with full formatting (tables, bold, headings, lists).
 * No dependencies required.
 */
export async function renderDocx(html: string, baseFilename: string): Promise<PdfResult> {
  ensureOutputDir();

  const timestamp = Date.now();
  const filename = `${timestamp}-${baseFilename}.doc`;
  const outputPath = path.join(OUTPUT_DIR, filename);

  // Word-compatible wrapper with mso namespace
  const docHtml = html.replace('</head>',
    '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->'
  );

  fs.writeFileSync(outputPath, docHtml, 'utf-8');

  return {
    filename,
    path: outputPath,
    url: `/generated/${filename}`,
  };
}
