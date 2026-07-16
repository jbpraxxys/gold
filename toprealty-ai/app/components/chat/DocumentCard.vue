<template>
  <a
    :href="url"
    class="doc-card flex items-center justify-between gap-4 px-4 py-3.5 no-underline text-current bg-white border border-gray-200 rounded-xl transition-all duration-200 hover:border-navy hover:shadow-[0_4px_12px_rgba(26,65,117,0.1)]"
    :download="filename"
  >
    <!-- Left: Icon + filename -->
    <div class="flex items-center gap-3 min-w-0">
      <!-- Document icon -->
      <div class="w-9 h-9 rounded-lg bg-navy text-white inline-flex items-center justify-center shrink-0 text-[13px] font-bold">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      </div>

      <div class="flex flex-col min-w-0">
        <span class="text-sm font-semibold text-navy truncate">{{ filename }}</span>
        <span v-if="size" class="text-xs text-gray-400 mt-0.5">{{ size }}</span>
        <span v-else class="text-xs text-gray-400 mt-0.5">Generated just now</span>
      </div>
    </div>

    <!-- Right: Format badge + download -->
    <div class="flex items-center gap-2.5 shrink-0">
      <span class="badge-format inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-maroon text-white">
        <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
        {{ format }}
      </span>

      <button
        type="button"
        class="btn-download border border-gray-300 bg-white text-navy text-[12px] font-medium px-3 py-1.5 rounded-md cursor-pointer hover:bg-gray-50 hover:border-navy transition-colors duration-150"
        @click.prevent="handleDownload"
      >
        Download
      </button>
    </div>
  </a>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  filename: string;
  format: string;
  size?: string;
  url?: string;
}>();

const url = computed(() => props.url || `/generated/${props.filename}`);

function handleDownload() {
  if (props.url) {
    window.open(props.url, '_blank');
    return;
  }

  // Trigger download from generated directory
  const link = document.createElement('a');
  link.href = `/generated/${props.filename}`;
  link.download = props.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
</script>
