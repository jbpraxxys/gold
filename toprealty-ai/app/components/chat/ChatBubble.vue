<template>
  <!-- User message: right-aligned -->
  <div v-if="message.role === 'user'" class="flex justify-end gap-2.5">
    <div class="bubble-user max-w-[76%] px-4 py-3 text-sm leading-relaxed">
      <div v-html="renderedContent"></div>
    </div>
  </div>

  <!-- AI message: left-aligned -->
  <div v-else class="flex gap-2.5 items-start">
    <!-- AI avatar -->
    <div class="w-7 h-7 rounded-full bg-navy text-white text-[11px] font-bold inline-flex items-center justify-center shrink-0">
      AI
    </div>

    <div class="bubble-ai max-w-[76%] px-5 py-4 text-sm leading-relaxed">
      <!-- Streaming content: show live as it arrives + loader inline -->
      <div class="bubble-ai-content" :class="{ 'flex items-end gap-1': isStreaming }">
        <span v-html="renderedContent"></span>
        <ThinkingDots v-if="isStreaming" />
      </div>

      <!-- Tool invocation results: document cards -->
      <div v-if="documentResults.length" class="mt-2.5 flex flex-col gap-2.5">
        <DocumentCard
          v-for="(file, idx) in documentResults"
          :key="idx"
          :filename="file.filename"
          :format="file.format"
          :size="file.size"
          :url="file.url"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { marked } from 'marked';
import ThinkingDots from '../ui/ThinkingDots.vue';
import DocumentCard from './DocumentCard.vue';

// Configure marked for safe rendering
marked.setOptions({
  breaks: true,    // Convert \n to <br>
  gfm: true,       // GitHub Flavored Markdown (tables, strikethrough, etc.)
});

function markdownToHtml(text: string): string {
  if (!text) return '';
  const raw = marked.parse(text);
  // marked.parse can return string | Promise<string>, but we're synchronous here
  return typeof raw === 'string' ? raw : '';
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content?: string;
  parts?: Array<{ type: string; text?: string }>;
  toolInvocations?: Array<ToolInvocation>;
}

interface ToolInvocation {
  toolName?: string;
  state?: string;
  result?: {
    success?: boolean;
    files?: Array<{
      filename: string;
      format: string;
      size?: string;
      url?: string;
    }>;
    downloadUrl?: string;
    message?: string;
  };
}

interface DocResult {
  filename: string;
  format: string;
  size?: string;
  url?: string;
}

const props = defineProps<{
  message: ChatMessage;
  isStreaming?: boolean;
}>();

const renderedContent = computed(() => {
  let raw = '';

  // Use content if available
  if (props.message.content) raw = props.message.content;

  // Try to extract text from parts (AI SDK v7 format)
  if (!raw && props.message.parts) {
    raw = props.message.parts
      .filter((p) => p.type === 'text' && p.text)
      .map((p) => p.text!)
      .join('\n');
  }

  // Fallback: tool calls happened but no text was produced (maxSteps exhausted)
  const hasToolCalls = props.message.toolInvocations && props.message.toolInvocations.length > 0;
  if (!raw && hasToolCalls && !props.isStreaming) {
    raw = '*I searched for the requested data but ran out of steps before I could compile a response. Please try asking again or be more specific.*';
  }

  // Debug: log if we have parts but no text extracted
  if (props.message.parts && !raw && props.message.role === 'assistant') {
    console.warn('[ChatBubble] Parts found but no text extracted:', 
      props.message.parts.map(p => ({ type: p.type, hasText: !!p.text, state: (p as any).state })));
  }

  // Convert markdown to HTML
  return markdownToHtml(raw);
});

const documentResults = computed<DocResult[]>(() => {
  if (!props.message.toolInvocations) return [];

  const files: DocResult[] = [];

  for (const invocation of props.message.toolInvocations) {
    const result = invocation.result;
    if (!result || !result.success) continue;

    // Pattern A: files array (Carbone tools)
    if (result.files && Array.isArray(result.files)) {
      for (const file of result.files) {
        files.push({
          filename: file.filename || 'document',
          format: file.format || 'PDF',
          size: file.size,
          url: file.url || `/generated/${file.filename}`,
        });
      }
    }

    // Pattern B: single downloadUrl (spreadsheet, presentation)
    if (result.downloadUrl && !result.files) {
      const toolName = invocation.toolName || '';
      const fmtMap: Record<string, string> = {
        generate_spreadsheet: 'XLSX',
        generate_presentation: 'PPTX',
        generate_brochure: 'DOCX',
        generate_cma: 'DOCX',
        generate_comparison: 'DOCX',
      };
      const fmt = fmtMap[toolName] || 'FILE';
      const urlPath = result.downloadUrl;
      const fname = urlPath.split('/').pop() || 'document';
      
      files.push({
        filename: fname,
        format: fmt,
        size: result.message || '',
        url: urlPath,
      });
    }
  }

  return files;
});
</script>
