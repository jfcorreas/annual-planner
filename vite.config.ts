import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Installable PWA (Option 2): manifest + precached service worker.
    // The service worker only exists in `npm run build`, never in dev/test.
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Planificador anual',
        short_name: 'Planificador',
        description:
          'Crea, personaliza y rellena planificadores anuales. Tus datos se guardan solo en tu navegador.',
        lang: 'es-ES',
        // start_url and scope are omitted on purpose: the plugin defaults them
        // to Vite's `base`, so the PWA works both at `/` and under a sub-path
        // (GitHub Pages serves it at `/annual-planner/`).
        display: 'standalone',
        background_color: '#f4f6f9',
        theme_color: '#f4f6f9',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // Everything the app needs to open with no connection at all.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        // SPA: any navigation falls back to the cached shell.
        navigateFallback: 'index.html',
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.{ts,tsx}'],
    // Deterministic date tests regardless of the machine timezone.
    env: { TZ: 'Europe/Madrid' },
  },
})
