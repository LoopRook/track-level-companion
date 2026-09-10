import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg'],
      manifest: {
        short_name: 'TrackLevel',
        name: 'Track Level Companion',
        icons: [
          {
            src: 'favicon.svg',
            type: 'image/svg+xml',
            sizes: 'any',
          },
          {
            src: 'favicon.svg',
            type: 'image/svg+xml',
            sizes: '192x192 512x512',
            purpose: 'any maskable',
          },
        ],
        start_url: './',
        background_color: '#000000',
        theme_color: '#000000',
        display: 'standalone',
        orientation: 'any',
        description: 'Precision live steam & miniature railroad track leveling with laser datum calculations, visual profile graphing, and trackside lift recommendations.',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,json}'],
        navigateFallback: '/track-level-companion/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  base: '/track-level-companion/',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
