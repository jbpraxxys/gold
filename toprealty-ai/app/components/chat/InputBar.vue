<template>
  <div class="relative">
    <div class="flex items-center gap-3.5 bg-gray-100 border border-gray-200 rounded-3xl py-2.5 pl-6.5 pr-3.5">
      <!-- Text input -->
      <textarea
        ref="textareaRef"
        :value="modelValue"
        rows="1"
        autocomplete="off"
        :placeholder="placeholder"
        class="flex-1 border-none bg-transparent text-sm font-sans text-gray-900 focus:outline-none resize-none overflow-hidden"
        @input="onInput"
        @keydown.enter.exact.prevent="handleEnterSubmit"
        :disabled="loading"
      />

      <!-- Actions -->
      <div class="flex items-center gap-4 self-end pb-0.5">
        <!-- Microphone icon (decorative) -->
        <span class="w-5 h-5 opacity-80 inline-flex items-center justify-center">
          <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g id="mic">
              <path
                d="M6.66667 13.3333V16C6.66667 18.4754 7.65 20.8493 9.40034 22.5997C11.1507 24.35 13.5246 25.3333 16 25.3333C18.4754 25.3333 20.8493 24.35 22.5997 22.5997C24.35 20.8493 25.3333 18.4754 25.3333 16V13.3333M16 25.3333V29.3333M16 2.66667C14.9391 2.66667 13.9217 3.08809 13.1716 3.83824C12.4214 4.58839 12 5.6058 12 6.66667V16C12 17.0609 12.4214 18.0783 13.1716 18.8284C13.9217 19.5786 14.9391 20 16 20C17.0609 20 18.0783 19.5786 18.8284 18.8284C19.5786 18.0783 20 17.0609 20 16V6.66667C20 5.6058 19.5786 4.58839 18.8284 3.83824C18.0783 3.08809 17.0609 2.66667 16 2.66667Z"
                stroke="#941D28"
                stroke-width="2.66667"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </g>
          </svg>
        </span>

        <!-- Send button -->
        <button
          type="button"
          class="bg-maroon hover:bg-maroon-dark border-none w-10 h-10 rounded-full inline-flex items-center justify-center cursor-pointer shrink-0 transition-colors duration-150"
          :class="{ 'opacity-50 cursor-not-allowed': loading || !trimmed }"
          :disabled="loading || !trimmed"
          @click="$emit('submit')"
          aria-label="Send"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M12 19L19 12L12 5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    loading?: boolean;
    placeholder?: string;
  }>(),
  {
    modelValue: '',
    loading: false,
    placeholder: 'Ask me to generate a document, analyze a property...',
  },
);

const emit = defineEmits<{
  submit: [];
  'update:modelValue': [value: string];
}>();

const textareaRef = ref<HTMLTextAreaElement | null>(null);

const trimmed = computed(() => (props.modelValue || '').trim());

function autoResize() {
  const el = textareaRef.value;
  if (!el) return;

  // Reset height to "auto" so scrollHeight reflects the true content height
  el.style.height = 'auto';

  // Clamp between 1 row (min) and ~6 rows (max)
  const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
  const paddingTop = parseFloat(getComputedStyle(el).paddingTop);
  const paddingBottom = parseFloat(getComputedStyle(el).paddingBottom);
  const minHeight = lineHeight + paddingTop + paddingBottom;
  const maxHeight = lineHeight * 6 + paddingTop + paddingBottom;

  const newHeight = Math.min(Math.max(el.scrollHeight, minHeight), maxHeight);
  el.style.height = `${newHeight}px`;
}

function onInput(event: Event) {
  const target = event.target as HTMLTextAreaElement;
  emit('update:modelValue', target.value);
  autoResize();
}

function handleEnterSubmit() {
  if (!trimmed.value) return;
  emit('submit');
}

// Auto-resize when modelValue changes externally (e.g. cleared by parent)
watch(() => props.modelValue, () => {
  nextTick(() => autoResize());
});
</script>
