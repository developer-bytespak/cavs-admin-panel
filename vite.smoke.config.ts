import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  build: {
    ssr: 'tools/smoke.tsx',
    outDir: 'node_modules/.smoke',
    emptyOutDir: true,
    minify: false,
  },
})
