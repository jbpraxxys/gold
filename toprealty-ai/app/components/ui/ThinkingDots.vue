<template>
  <div class="thinking-dots flex items-center gap-2 py-1">
    <span class="dot" :style="{ animationDelay: '0s' }"></span>
    <span class="dot" :style="{ animationDelay: '0.2s' }"></span>
    <span class="dot" :style="{ animationDelay: '0.4s' }"></span>
  </div>
</template>

<script setup lang="ts">
// ThinkingDots — three animated maroon dots.
// Uses the pulse animation defined in main.css.
</script>

<style scoped>
.thinking-dots .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--maroon, #941d28);
  animation: pulse 1.4s infinite;
}
</style>
