import fs from 'node:fs'
import path from 'node:path'
import { createReadStream } from 'node:fs'

const GENERATED_DIR = path.resolve(process.cwd(), 'public', 'generated')

// Content-Type map for file extensions
const MIME_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

export default defineEventHandler(async (event) => {
  const documentId = getRouterParam(event, 'id')

  if (!documentId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Document ID is required',
    })
  }

  // Security: prevent path traversal attacks
  const resolvedPath = path.resolve(GENERATED_DIR, documentId)
  if (!resolvedPath.startsWith(GENERATED_DIR + path.sep) && resolvedPath !== GENERATED_DIR) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'Path traversal detected',
    })
  }

  // Ensure file exists
  if (!fs.existsSync(resolvedPath)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: 'Document not found',
    })
  }

  const stat = fs.statSync(resolvedPath)

  // Determine content type from extension
  const ext = path.extname(resolvedPath).toLowerCase()
  const contentType = MIME_TYPES[ext] ?? 'application/octet-stream'

  // Extract original filename from the generated name: {timestamp}-{baseName}.{ext}
  const docFilename = path.basename(resolvedPath)
  const parts = docFilename.split('-')
  // Remove the timestamp prefix to get the original name
  const originalName = parts.length > 1 ? parts.slice(1).join('-') : docFilename

  setResponseHeaders(event, {
    'Content-Type': contentType,
    'Content-Disposition': `attachment; filename="${originalName}"`,
    'Content-Length': String(stat.size),
    'Cache-Control': 'no-cache',
  })

  // Stream the file
  return sendStream(event, createReadStream(resolvedPath))
})
