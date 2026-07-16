<template>
  <footer class="w-full">
    <!-- Accent bar: navy main + striped section -->
    <div class="flex items-center w-full h-2.5">
      <div class="flex-1 h-2.5 bg-[#162436]"></div>
      <div class="flex items-center w-[360px] max-sm:w-[180px] h-2.5">
        <span class="flex-1 h-2.5 bg-[#798fab]"></span>
        <span class="flex-1 h-2.5 bg-maroon"></span>
        <span class="flex-1 h-2.5 bg-[#898989]"></span>
      </div>
    </div>

    <!-- Copyright row -->
    <div class="flex items-center justify-between px-5 py-4 border-t border-gray-200 bg-white">
      <span class="text-[13px] text-gray-400">
        &copy; 2026 Top Realty. All rights reserved.
      </span>

      <!-- TopRealty GPT logo -->
      <img
        src="/assets/logo-toprealty-gpt.png"
        alt="TopRealty GPT — AI Powered Search"
        class="h-[42px] w-auto"
      />
    </div>
  </footer>
</template>

<script setup lang="ts">
// AccentFooter — footer with navy accent bar, striped accent line,
// copyright text, and TopRealty GPT logo.
</script>
