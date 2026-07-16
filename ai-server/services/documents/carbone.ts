import carbone from 'carbone'
import fs from 'node:fs'
import path from 'node:path'

export interface RenderOptions {
  /** Output format: 'docx' | 'pdf' (default 'pdf') */
  convertTo?: 'docx' | 'pdf'
}

export interface RenderResult {
  filename: string
  path: string
  url: string
}

const OUTPUT_DIR = path.resolve(process.cwd(), 'public', 'generated')
const TEMPLATES_DIR = path.resolve(process.cwd(), 'templates')

function ensureOutputDir(): void {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }
}

/**
 * Render a Carbone template with the provided data.
 *
 * @param templateName - Template filename relative to `/templates/` (e.g. 'brochure.docx')
 * @param data - JSON data to merge into the template
 * @param options - Rendering options
 * @returns Object with filename, absolute path, and public URL
 */
export function renderDocument(
  templateName: string,
  data: Record<string, unknown>,
  options: RenderOptions = {},
): Promise<RenderResult> {
  return new Promise((resolve, reject) => {
    const templatePath = path.join(TEMPLATES_DIR, templateName)
    const convertTo = options.convertTo ?? 'pdf'
    const baseName = path.basename(templateName, path.extname(templateName))
    const timestamp = Date.now()
    const ext = convertTo === 'docx' ? 'docx' : 'pdf'
    const filename = `${timestamp}-${baseName}.${ext}`
    const outputPath = path.join(OUTPUT_DIR, filename)

    ensureOutputDir()

    const carboneOptions: Record<string, unknown> = { convertTo }

    carbone.render(templatePath, data, carboneOptions, (err, result) => {
      if (err) {
        reject(new Error(`Carbone render failed: ${err}`))
        return
      }

      // result is a Buffer when no renderPrefix is set
      if (!result) {
        reject(new Error('Carbone returned empty result'))
        return
      }

      try {
        fs.writeFileSync(outputPath, result as Buffer)
        resolve({
          filename,
          path: outputPath,
          url: `/generated/${filename}`,
        })
      } catch (writeErr) {
        reject(new Error(`Failed to write output file: ${writeErr}`))
      }
    })
  })
}
