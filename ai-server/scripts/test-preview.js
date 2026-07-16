/**
 * Quick test for presentation JSON → HTML preview.
 * Run: node scripts/test-preview.js
 * Opens the preview in your browser.
 */

import { renderPresentationHtml } from '../services/documents/presentation-json.ts';
import fs from 'node:fs';
import { exec } from 'node:child_process';

const testData = {
  title: 'South Triangle Condo Guide',
  slides: [
    {
      type: 'title',
      title: 'South Triangle Condo Guide',
      content: 'Affordable Investment Opportunities in QC | 2025-2026',
    },
    {
      type: 'section',
      title: 'Market Overview',
      content: 'South Triangle, Quezon City',
    },
    {
      type: 'content',
      title: 'Why South Triangle?',
      content: 'Located near Tomas Morato, MRT-3 Quezon Avenue, and major media offices. Average condo prices range from ₱2.2M to ₱15M. Strong rental demand from BPO workers and students.',
    },
    {
      type: 'table',
      title: 'Top Properties Comparison',
      content: 'Property|Price|Size|Developer\nM Place South Triangle|₱2.2M–₱10M|16.5–40 sqm|SMDC\nThe Crestmont|₱6.5M–₱15.7M|33–84.5 sqm|DMCI Homes\nOne South Triangle|₱3.8M–₱110M|24–150+ sqm|SMDC',
    },
    {
      type: 'two_column',
      title: 'Head-to-Head: M Place vs The Crestmont',
      left: { title: 'M Place', content: '₱2.2M starting\nSMDC developer\n4 towers, 28 floors\nPool, gym, garden\nNear ABS-CBN' },
      right: { title: 'The Crestmont', content: '₱6.5M starting\nDMCI Homes\n49 floors, resort-style\nPool, gardens, gym\n12% DP promo' },
    },
    {
      type: 'bullets',
      title: 'Investment Highlights',
      content: '- Entry price as low as ₱2.2M\n- Near MRT-3 Quezon Avenue\n- 5-7% gross rental yield\n- Strong developer presence\n- Growing commercial district',
    },
    {
      type: 'end',
      title: 'Thank You',
    },
  ],
};

const html = renderPresentationHtml(testData);
const outPath = '/tmp/toprealty-preview-test.html';
fs.writeFileSync(outPath, html, 'utf-8');
console.log(`✅ Preview written to ${outPath}`);
console.log('   Opening in browser...');
exec(`open ${outPath}`);
