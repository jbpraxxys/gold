<template>
  <div class="flex flex-col min-h-screen bg-gray-50">
    <AppHeader />
    <main class="flex-1 flex flex-col">
      <slot />
    </main>
    <AccentFooter />
  </div>
</template>
