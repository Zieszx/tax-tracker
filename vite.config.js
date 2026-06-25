import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  // Allow JSX inside .js files (useProfile.js contains JSX by design — see task brief).
  esbuild: { loader: 'jsx', include: /src\/.*\.jsx?$/, exclude: [] },
})
