<template>
  <header class="sticky top-0 z-50 bg-white border-b border-gray-200">
    <div class="max-w-[1180px] mx-auto px-5 py-3.5 flex items-center justify-between gap-3">
      <!-- Logo -->
      <a href="/" class="inline-flex items-center no-underline">
        <img
          src="/assets/logo-top-realty.png"
          alt="Top Realty"
          class="h-[34px] w-auto block"
          style="max-width: 140px"
        />
      </a>

      <!-- Right: user avatar + name -->
      <div class="flex items-center gap-2">
        <span class="text-sm text-navy font-medium hidden sm:inline">John Doe</span>
        <div class="w-9 h-9 rounded-full bg-navy text-white inline-flex items-center justify-center text-[13px] font-semibold cursor-pointer hover:bg-navy-dark transition-colors">
          JD
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
// AppHeader — sticky top navigation bar.
// Shows Top Realty logo on the left, user avatar + name on the right.
</script>
