import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: false,
    allowedHosts: ['chatinvis.garmendia.eus'],
    proxy: {
      '/api': {
        target: 'http://server:3001',
        changeOrigin: true,
      }
    }
  }
})