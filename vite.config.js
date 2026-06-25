import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    // VitePWA is only active during builds — inert under vitest (test runner bypasses vite plugins)
    ...(command === 'build'
      ? [
          VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['apple-touch-icon.png', 'pwa-192.png', 'pwa-512.png'],
            manifest: {
              name: 'Tax Tracker 2026',
              short_name: 'Tax26',
              description: 'Malaysian personal income-tax tracker & calculator',
              theme_color: '#caa53a',
              background_color: '#fbf6ea',
              display: 'standalone',
              start_url: './',
              icons: [
                {
                  src: 'pwa-192.png',
                  sizes: '192x192',
                  type: 'image/png',
                },
                {
                  src: 'pwa-512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'any maskable',
                },
              ],
            },
          }),
        ]
      : []),
  ],
  base: './',
  // Allow JSX inside .js files (useProfile.js contains JSX by design — see task brief).
  esbuild: { loader: 'jsx', include: /src\/.*\.jsx?$/, exclude: [] },
}))
