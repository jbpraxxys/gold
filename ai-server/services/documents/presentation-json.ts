/**
 * Presentation JSON → HTML Preview Renderer
 * 
 * Takes the same structured JSON the AI sends to generate_presentation
 * and renders it as a beautiful HTML preview. Same data → two renderers.
 * 
 * Architecture: AI → JSON → ├── HTML (preview) 
 *                              └── PptxGenJS (export)
 */

interface PresentationJson {
  title: string
  slides: Array<{
    title: string
    content: string
    type: 'title' | 'content' | 'two_column' | 'section' | 'bullets' | 'end' | 'table'
    left?: { title: string; content: string }
    right?: { title: string; content: string }
  }>
  theme?: {
    primary?: string
    secondary?: string
  }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function renderSlide(slide: PresentationJson['slides'][0], index: number): string {
  const t = escapeHtml(slide.title || '')
  const c = slide.content || ''
  const slideNum = index + 1

  switch (slide.type) {
    case 'title':
      return `<section class="slide title-slide">
        <div class="slide-num">${slideNum}</div>
        <h1>${t}</h1>
        ${c ? `<p class="subtitle">${escapeHtml(c)}</p>` : ''}
      </section>`

    case 'section':
      return `<section class="slide section-slide">
        <div class="slide-num">${slideNum}</div>
        <div class="section-line"></div>
        <h2>${t}</h2>
        ${c ? `<p class="subtitle">${escapeHtml(c)}</p>` : ''}
      </section>`

    case 'bullets':
      return `<section class="slide bullets-slide">
        <div class="heading-bar">${t}</div>
        <div class="slide-num">${slideNum}</div>
        <ul>${c.split('\n').filter(Boolean).map(l => `<li>${escapeHtml(l.replace(/^[-•]\s*/, ''))}</li>`).join('')}</ul>
      </section>`

    case 'end':
      return `<section class="slide end-slide">
        <h2>${t || 'Thank You'}</h2>
        <p class="brand">TopRealty AI &nbsp;•&nbsp; www.toprealty.ai</p>
      </section>`

    case 'two_column': {
      const left = slide.left || { title: '', content: '' }
      const right = slide.right || { title: '', content: '' }
      return `<section class="slide two-col-slide">
        <div class="heading-bar">${t}</div>
        <div class="slide-num">${slideNum}</div>
        <div class="columns">
          <div class="col"><h3>${escapeHtml(left.title)}</h3><p>${escapeHtml(left.content || c)}</p></div>
          <div class="col"><h3>${escapeHtml(right.title)}</h3><p>${escapeHtml(right.content)}</p></div>
        </div>
      </section>`
    }

    case 'table': {
      const rows = c.split('\n').filter(Boolean).map(row => row.split('|').map(col => col.trim()))
      if (rows.length === 0) break
      return `<section class="slide table-slide">
        <div class="heading-bar">${t}</div>
        <div class="slide-num">${slideNum}</div>
        <table>${rows.map((row, ri) =>
          `<tr>${row.map(cell => ri === 0 ? `<th>${escapeHtml(cell)}</th>` : `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`
        ).join('')}</table>
      </section>`
    }

    default: // content
      return `<section class="slide content-slide">
        <div class="heading-bar">${t}</div>
        <div class="slide-num">${slideNum}</div>
        <div class="body-text">${escapeHtml(c).replace(/\n/g, '<br>')}</div>
      </section>`
  }
}

export function renderPresentationHtml(data: PresentationJson): string {
  const primary = data.theme?.primary || '1A4175'
  const slidesHtml = data.slides.map((s, i) => renderSlide(s, i)).join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(data.title)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, sans-serif; background: #F0F0F0; }
  .slide { 
    width: 960px; height: 540px; margin: 20px auto; 
    background: #FFFFFF; border-radius: 6px; 
    box-shadow: 0 2px 12px rgba(0,0,0,.1); 
    position: relative; overflow: hidden;
    page-break-after: always;
    font-family: 'Inter', -apple-system, sans-serif;
  }
  .slide-num { position: absolute; bottom: 10px; right: 16px; font-size: 10px; color: #999; }
  .heading-bar { background: #${primary}; color: #FFF; padding: 12px 24px; font-size: 20px; font-weight: 700; }
  .title-slide { background: #${primary}; display: flex; flex-direction: column; justify-content: center; align-items: center; }
  .title-slide .title-badge { background: rgba(255,255,255,0.15); color: #FFF; padding: 6px 16px; border-radius: 3px; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 20px; }
  .title-slide h1 { color: #FFF; font-size: 34px; text-align: center; max-width: 80%; line-height: 1.2; }
  .title-slide .price-tag { color: #FFF; font-size: 20px; margin-top: 12px; font-weight: 600; }
  .title-slide .sub { color: #B0BEC5; font-size: 14px; margin-top: 8px; }
  .title-slide .agent { color: #90A4AE; font-size: 12px; margin-top: 32px; }
  .end-slide { background: #${primary}; display: flex; flex-direction: column; justify-content: center; align-items: center; }
  .end-slide h1 { color: #FFF; font-size: 40px; }
  .end-slide .brand { color: #B0BEC5; font-size: 14px; margin-top: 16px; }
  .end-slide .agent { color: #FFF; font-size: 12px; margin-top: 24px; }
  .section-slide { background: #${primary}; display: flex; flex-direction: column; justify-content: center; align-items: center; }
  .section-slide h2 { color: #FFF; font-size: 32px; text-align: center; max-width: 70%; }
  .overview-layout { display: flex; padding: 14px 20px; gap: 16px; height: 440px; }
  .overview-table { flex: 1.2; }
  .overview-highlights { flex: 0.8; }
  .overview-highlights h3 { color: #${primary}; font-size: 14px; margin-bottom: 8px; }
  .overview-highlights ul { padding-left: 18px; line-height: 1.8; color: #2D3748; }
  .columns { display: flex; padding: 10px 20px; gap: 20px; height: 420px; }
  .col { flex: 1; padding: 10px; }
  .col h3 { color: #${primary}; font-size: 16px; margin-bottom: 8px; border-bottom: 2px solid #${primary}; padding-bottom: 4px; }
  .metric-cards { display: flex; gap: 14px; padding: 14px 20px; }
  .metric { flex: 1; background: #F8FAFC; border-radius: 8px; padding: 16px; text-align: center; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
  .metric-label { display: block; font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
  .metric-value { display: block; font-size: 16px; color: #${MAROON || '941D28'}; font-weight: 700; }
  .bullets-slide { padding: 0; }
  .bullets-slide ul { padding: 20px 50px; font-size: 18px; line-height: 2; color: #2D3748; }
  .content-slide .body-text { padding: 20px 30px; font-size: 16px; line-height: 1.7; color: #2D3748; }
  .two-col-slide .columns { display: flex; padding: 10px 20px; gap: 20px; height: 420px; }
  .two-col-slide .col { flex: 1; padding: 10px; }
  .two-col-slide h3 { color: #${primary}; font-size: 16px; margin-bottom: 8px; border-bottom: 2px solid #${primary}; padding-bottom: 4px; }
  .two-col-slide p { font-size: 13px; color: #2D3748; line-height: 1.5; }
  .table-slide table { width: 90%; margin: 20px auto; border-collapse: collapse; font-size: 13px; }
  .table-slide th { background: #${primary}; color: #FFF; padding: 8px 12px; text-align: left; }
  .table-slide td { padding: 6px 12px; border-bottom: 1px solid #E5E5E5; }
  @media print { body { background: #FFF; } .slide { box-shadow: none; margin: 0; border-radius: 0; } }
</style>
</head>
<body>
${slidesHtml}
</body>
</html>`
}
