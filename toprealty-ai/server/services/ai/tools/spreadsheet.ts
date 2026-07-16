import { buildSpreadsheet } from '../../documents/excel'

export interface SpreadsheetInput {
  /** Spreadsheet title displayed in the merged top row */
  title: string
  /** Column headers */
  headers: string[]
  /** Data rows (each row is an array of values) */
  rows: (string | number | boolean | null)[][]
  /** Output filename (e.g. 'property-list.xlsx') */
  filename: string
}

export interface SpreadsheetOutput {
  success: boolean
  message: string
  rowCount: number
  columnCount: number
  downloadUrl: string
}

/**
 * Generate an Excel spreadsheet from structured data.
 * Creates a styled workbook with a merged title row, bold headers, and auto-fit columns.
 */
export async function executeSpreadsheet(
  input: SpreadsheetInput,
): Promise<SpreadsheetOutput> {
  const result = await buildSpreadsheet(
    input.title,
    input.headers,
    input.rows,
    input.filename,
  )

  return {
    success: true,
    message: `Spreadsheet "${input.title}" generated with ${input.rows.length} data rows and ${input.headers.length} columns.`,
    rowCount: input.rows.length,
    columnCount: input.headers.length,
    downloadUrl: result.url,
  }
}
