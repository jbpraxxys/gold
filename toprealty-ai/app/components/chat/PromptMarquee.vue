<template>
  <div
    class="flex flex-col gap-2.5 mb-4.5"
    style="mask-image: linear-gradient(90deg, transparent, #000 60px, #000 calc(100% - 60px), transparent); -webkit-mask-image: linear-gradient(90deg, transparent, #000 60px, #000 calc(100% - 60px), transparent)"
  >
    <!-- Row 1: scroll left-to-right -->
    <div class="overflow-hidden w-full">
      <div class="flex gap-2.5 w-max marquee-left">
        <button
          v-for="(prompt, i) in row1"
          :key="'r1-' + i"
          type="button"
          class="border border-gray-300 bg-white text-navy text-[13px] px-4 py-2.5 rounded-full cursor-pointer whitespace-nowrap shrink-0 transition-colors duration-150 hover:border-maroon hover:bg-[#fdf4f5]"
          @click="$emit('select', prompt)"
        >
          {{ prompt }}
        </button>
      </div>
    </div>

    <!-- Row 2: scroll right-to-left -->
    <div class="overflow-hidden w-full">
      <div class="flex gap-2.5 w-max marquee-right">
        <button
          v-for="(prompt, i) in row2"
          :key="'r2-' + i"
          type="button"
          class="border border-gray-300 bg-white text-navy text-[13px] px-4 py-2.5 rounded-full cursor-pointer whitespace-nowrap shrink-0 transition-colors duration-150 hover:border-maroon hover:bg-[#fdf4f5]"
          @click="$emit('select', prompt)"
        >
          {{ prompt }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

defineEmits<{
  select: [prompt: string];
}>();

const PROMPTS: string[] = [
  'Create a property brochure for...',
  'Generate 5 Facebook captions for...',
  'Run a Comparative Market Analysis for...',
  'Build an investor presentation for...',
  'Generate a valuation report for...',
  'Create a complete marketing package for...',
  "Why hasn't this property sold?",
  'Compare these two properties',
  'Find luxury properties near Makati CBD',
  "Generate this week's market report",
  'Create an agent performance report for...',
  'Create a luxury Facebook banner for...',
  'Write an investor email campaign for...',
  'Write a luxury property description for...',
  'Which areas have the highest price growth?',
];

// Row 1: even-indexed prompts, duplicated for seamless scroll
const row1 = computed(() => {
  const even = PROMPTS.filter((_, i) => i % 2 === 0);
  return [...even, ...even];
});

// Row 2: odd-indexed prompts, duplicated for seamless scroll
const row2 = computed(() => {
  const odd = PROMPTS.filter((_, i) => i % 2 === 1);
  return [...odd, ...odd];
});
</script>
