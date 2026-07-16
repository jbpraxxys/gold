export default defineNuxtConfig({
  compatibilityDate: '2026-07-16',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  components: {
    dirs: [
      { path: '~/components/chat', prefix: '' },
      { path: '~/components/ui', prefix: '' },
    ],
  },
  nitro: {
    experimental: {
      openAPI: true,
    },
  },
  tailwindcss: {
    config: {
      theme: {
        extend: {
          colors: {
            navy: {
              DEFAULT: '#1a4175',
              light: '#2a5a9a',
              dark: '#0f2d52',
            },
            maroon: {
              DEFAULT: '#941d28',
              light: '#b82432',
              dark: '#6e1520',
            },
          },
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
          },
        },
      },
    },
  },
});
