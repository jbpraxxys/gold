import ExcelJS from 'exceljs'
import fs from 'node:fs'
import path from 'node:path'

const OUTPUT_DIR = path.resolve(process.cwd(), 'public', 'generated')

// ─── Brand colors ────────────────────────────────────────────────────────
const NAVY_ARGB = 'FF1A4175'
const WHITE_ARGB = 'FFFFFFFF'

// ─── Types ───────────────────────────────────────────────────────────────

export interface SpreadsheetResult {
  filename: string
  path: string
  url: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function ensureOutputDir(): void {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }
}

function navyFill(): ExcelJS.Fill {
  return {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: NAVY_ARGB },
  }
}

function whiteFont(bold = false, size = 11): Partial<ExcelJS.Font> {
  return {
    color: { argb: WHITE_ARGB },
    bold,
    size,
    name: 'Calibri',
  }
}

// ─── Public API ──────────────────────────────────────────────────────────

/**
 * Build an Excel spreadsheet and save it to the public/generated directory.
 *
 * @param title - Spreadsheet title (displayed in a merged row at the top)
 * @param headers - Array of column header strings
 * @param rows - Array of data rows (each row is an array of values or key-value object)
 * @param customFilename - Output filename (e.g. 'property-list.xlsx')
 * @returns Object with filename, absolute path, and public URL
 */
export async function buildSpreadsheet(
  title: string,
  headers: string[],
  rows: (string | number | boolean | null)[][],
  customFilename: string,
): Promise<SpreadsheetResult> {
  ensureOutputDir()

  const filename = `${Date.now()}-${customFilename}`
  const outputPath = path.join(OUTPUT_DIR, filename)

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'TopRealty AI'
  workbook.created = new Date()

  const worksheet = workbook.addWorksheet('Report')

  // ── Title row ──────────────────────────────────────────────────────
  const lastColLetter = String.fromCharCode(64 + headers.length) // A, B, C, ...
  worksheet.mergeCells(`A1:${lastColLetter}1`)

  const titleRow = worksheet.getRow(1)
  titleRow.height = 36
  const titleCell = titleRow.getCell(1)
  titleCell.value = title
  titleCell.font = {
    name: 'Calibri',
    size: 16,
    bold: true,
    color: { argb: WHITE_ARGB },
  }
  titleCell.fill = navyFill()
  titleCell.alignment = {
    horizontal: 'center',
    vertical: 'middle',
  }

  // Also fill the merged cells with navy
  for (let c = 2; c <= headers.length; c++) {
    titleRow.getCell(c).fill = navyFill()
  }

  // ── Header row ─────────────────────────────────────────────────────
  const headerRow = worksheet.getRow(2)
  headerRow.height = 28

  headers.forEach((header, i) => {
    const cell = headerRow.getCell(i + 1)
    cell.value = header
    cell.font = whiteFont(true, 11)
    cell.fill = navyFill()
    cell.alignment = {
      horizontal: 'center',
      vertical: 'middle',
    }
  })

  // ── Data rows ──────────────────────────────────────────────────────
  rows.forEach((row, rowIndex) => {
    const excelRow = worksheet.getRow(rowIndex + 3) // +3 because title=1, header=2
    row.forEach((value, colIndex) => {
      const cell = excelRow.getCell(colIndex + 1)
      cell.value = value as string | number | boolean | null
      cell.font = {
        name: 'Calibri',
        size: 11,
        color: { argb: 'FF1A1A2E' },
      }
      cell.alignment = {
        vertical: 'middle',
      }
    })

    // Alternate row shading
    if (rowIndex % 2 === 1) {
      excelRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0F4F8' },
        }
      })
    }
  })

  // ── Auto-fit column widths (capped at 40) ──────────────────────────
  worksheet.columns = headers.map((header) => ({
    header,
    key: header.toLowerCase().replace(/\s+/g, '_'),
  }))

  worksheet.columns.forEach((column) => {
    if (!column) return

    let maxLength = 0
    const col = column as unknown as { eachCell?: (cb: (cell: ExcelJS.Cell) => void) => void }
    const colKey = (column as { key?: string }).key

    if (colKey) {
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 0) {
          const cell = row.getCell(colKey)
          const value = cell.value
          if (value !== null && value !== undefined) {
            const len = String(value).length
            if (len > maxLength) maxLength = len
          }
        }
      })
    }

    column.width = Math.min(Math.max(maxLength + 4, (column as { header?: string }).header?.length ?? 10), 40)
  })

  // ── Save ───────────────────────────────────────────────────────────
  await workbook.xlsx.writeFile(outputPath)

  return {
    filename,
    path: outputPath,
    url: `/generated/${filename}`,
  }
}
