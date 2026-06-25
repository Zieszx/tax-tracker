import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Allow JSX inside .js files (useProfile.js contains JSX by design — see task brief).
  esbuild: { loader: 'jsx', include: /src\/.*\.jsx?$/, exclude: [] },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
  },
})
