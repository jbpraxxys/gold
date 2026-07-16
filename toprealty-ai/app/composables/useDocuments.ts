import { ref } from 'vue'

export interface GeneratedDocument {
  name: string
  format: 'docx' | 'xlsx' | 'pptx' | 'pdf'
  url: string
  generatedAt: string
}

const documents = ref<GeneratedDocument[]>([])

export function useDocuments() {
  function addDocument(doc: GeneratedDocument) {
    documents.value.push(doc)
  }

  function clearDocuments() {
    documents.value = []
  }

  return {
    documents,
    addDocument,
    clearDocuments,
  }
}
