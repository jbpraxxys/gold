/**
 * HTML Templates — Converts structured JSON → styled HTML for PDF rendering
 * 
 * All styles are INLINE (not class-based) for maximum Playwright PDF compatibility.
 * Brand colors: navy #1A4175, maroon #941D28, white #FFFFFF, dark text #1A1A1A
 * Page size: A4 (210mm × 297mm)
 */

// ─── Base Layout ───────────────────────────────────────────────────

function baseHtml(body: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 11pt;
    color: #1A1A1A;
    line-height: 1.6;
  }
  .header-bar {
    background: #1A4175;
    color: #FFFFFF;
    padding: 12px 24px;
    font-size: 10pt;
    font-weight: 600;
    margin-bottom: 0;
  }
  .header-bar span { color: #CCCCCC; font-weight: 400; }
  .content { padding: 20px 24px; }
  .footer {
    text-align: center;
    font-size: 8pt;
    color: #888888;
    padding: 16px 24px;
    border-top: 1px solid #E5E5E5;
    margin-top: 24px;
  }
  .footer span { color: #1A4175; font-weight: 600; }
  h1 { font-size: 20pt; color: #1A4175; font-weight: 700; margin-bottom: 6px; }
  h2 { font-size: 14pt; color: #1A4175; font-weight: 700; margin-top: 16px; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 2px solid #1A4175; }
  h3 { font-size: 12pt; color: #1A4175; font-weight: 600; margin-top: 12px; margin-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; }
  th { background: #1A4175; color: #FFFFFF; padding: 8px 10px; font-size: 9pt; font-weight: 600; text-align: left; }
  td { padding: 8px 10px; border-bottom: 1px solid #E5E5E5; font-size: 9.5pt; }
  tr:nth-child(even) td { background: #F9FAFB; }
  .price { color: #941D28; font-weight: 700; }
  .tag { display: inline-block; background: #1A4175; color: #FFF; padding: 2px 8px; border-radius: 3px; font-size: 8pt; font-weight: 600; margin-right: 4px; }
  .divider { border: none; border-top: 1px solid #E5E5E5; margin: 16px 0; }
  .card { background: #F9FAFB; border-left: 4px solid #1A4175; padding: 12px 16px; margin: 10px 0; }
  .highlight { background: #FFF3E0; border-left: 4px solid #941D28; padding: 10px 14px; margin: 10px 0; }
  ul { padding-left: 20px; margin: 6px 0; }
  li { margin-bottom: 4px; }
  .page-break { page-break-before: always; }
</style>
</head>
<body>
<div class="header-bar">
  <strong>TOPREALTY</strong> <span>| Philippine Real Estate</span>
</div>
<div class="content">
${body}
</div>
<div class="footer">
  Generated on ${new Date().toLocaleDateString('en-PH')} &nbsp;|&nbsp; <span>TopRealty AI</span> &nbsp;|&nbsp; www.toprealty.ai
</div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─── Property Brochure ─────────────────────────────────────────────

export function brochureHtml(data: {
  property_name: string;
  details: string;
  tone: string;
}): string {
  const toneLabel = { luxury: 'Luxury', family: 'Family', investment: 'Investment', standard: 'Standard' }[data.tone] || data.tone;

  const body = `
<h1>${escapeHtml(data.property_name)}</h1>
<p style="color: #666; font-size: 10pt; margin-bottom: 16px;">
  Property Brochure &nbsp;|&nbsp; Tone: <strong style="color: #941D28;">${toneLabel}</strong>
</p>

<h2>Property Details</h2>
<div style="white-space: pre-line; line-height: 1.8;">
${escapeHtml(data.details)}
</div>

<hr class="divider">

<div class="highlight">
  <strong>📞 For inquiries, contact your TopRealty agent or visit <span style="color: #1A4175;">www.toprealty.ai</span></strong>
</div>
`;

  return baseHtml(body, data.property_name);
}

// ─── CMA Report ─────────────────────────────────────────────────────

export function cmaHtml(data: {
  subject_name: string;
  subject_price: string;
  comparables: string;
  market_trends: string;
}): string {
  const body = `
<h1>CMA Report</h1>

<h2>Subject Property</h2>
<div class="card">
  <strong>${escapeHtml(data.subject_name)}</strong><br>
  <span class="price">${escapeHtml(data.subject_price)}</span>
</div>

<h2>Comparable Properties</h2>
<div style="white-space: pre-line; line-height: 1.7;">
${escapeHtml(data.comparables)}
</div>

<h2>Market Trends &amp; Analysis</h2>
<div style="white-space: pre-line; line-height: 1.7;">
${escapeHtml(data.market_trends)}
</div>

<hr class="divider">

<p style="font-size: 9pt; color: #888; font-style: italic;">
  This CMA is prepared for informational purposes. All data sourced from public listings and market reports. Consult a licensed appraiser for formal valuation.
</p>
`;

  return baseHtml(body, 'CMA Report');
}

// ─── Property Comparison ───────────────────────────────────────────

export function comparisonHtml(data: {
  property_name: string;
  details: string;
}): string {
  // Details are pre-formatted with ━━━ separators between properties.
  // Render as pre-line to preserve line breaks.
  const body = `
<h1>${escapeHtml(data.property_name || 'Property Comparison')}</h1>

<div style="white-space: pre-line; line-height: 1.8;">
${escapeHtml(data.details)}
</div>

<hr class="divider">

<p style="font-size: 9pt; color: #888; font-style: italic;">
  Prices and availability subject to change. Verify with a licensed agent.
</p>
`;

  return baseHtml(body, data.property_name || 'Property Comparison');
}
