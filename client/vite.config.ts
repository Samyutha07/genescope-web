import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/upload': 'http://localhost:3001',
      '/sequences': 'http://localhost:3001',
      '/blast': 'http://localhost:3001',
      '/stats': 'http://localhost:3001',
    },
  },
})