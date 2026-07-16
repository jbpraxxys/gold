<script setup lang="ts">
import { useChat } from '@ai-sdk/vue';
import { ref, computed, watch, nextTick } from 'vue';

// v4 useChat: messages, input, handleSubmit, isLoading, error
const { messages, input, handleSubmit, isLoading, error } = useChat({
  api: 'http://localhost:3001/api/chat',
});

const chatScrollRef = ref<HTMLElement | null>(null);

const hasMessages = computed(() => messages.value.length > 0);
const lastMessageIndex = computed(() => messages.value.length - 1);

const errorMessage = computed(() => {
  if (!error.value) return '';
  return error.value instanceof Error ? error.value.message : String(error.value);
});

function scrollToBottom() {
  nextTick(() => {
    if (chatScrollRef.value) {
      chatScrollRef.value.scrollTop = chatScrollRef.value.scrollHeight;
    }
  });
}

function handlePromptSelect(prompt: string) {
  input.value = prompt;
  // Trigger submit using the v4 handleSubmit
  handleSubmit();
}

// Custom submit that works with InputBar's emit
function onInputSubmit() {
  console.log('[submit] input:', input.value, 'loading:', isLoading.value);
  if (!input.value?.trim() || isLoading.value) return;
  handleSubmit();
}

watch(() => messages.value.length, () => scrollToBottom());
</script>

<template>
  <div class="flex flex-col flex-1">
    <div ref="chatScrollRef" class="chat-scroll flex-1 px-4 py-6">
      <div class="max-w-3xl mx-auto space-y-6">
        <template v-if="!hasMessages">
          <HeroSection />
          <PromptMarquee @select="handlePromptSelect" />
        </template>

        <ChatBubble
          v-for="(msg, idx) in messages"
          :key="msg.id"
          :message="msg"
          :is-streaming="isLoading && idx === lastMessageIndex"
        />
      </div>
    </div>

    <div v-if="errorMessage" class="px-4 py-2.5 bg-red-50 border-t border-red-200 text-red-700 text-sm text-center">
      {{ errorMessage }}
    </div>

    <div class="border-t border-gray-200 bg-white">
      <div class="max-w-3xl mx-auto px-4 py-3">
        <InputBar
          v-model="input"
          :loading="isLoading"
          @submit="onInputSubmit"
        />
      </div>
    </div>
  </div>
</template>
