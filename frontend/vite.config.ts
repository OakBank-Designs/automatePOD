import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // no root: setting — let Vite use the default (the directory containing index.html)

  publicDir: 'public',        // static assets at frontend/public/
  server: {
    host: true,               // bind to 0.0.0.0
    port: 5173,
  },
  build: {
    outDir: 'dist',           // will emit frontend/dist
    emptyOutDir: true,
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
})