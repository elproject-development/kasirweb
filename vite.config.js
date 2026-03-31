import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    host: true,
    allowedHosts: "all",
    proxy: {
      '/api': 'http://localhost:3001',
    }
  },
  plugins: [react()],
})