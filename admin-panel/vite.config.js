import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 5174, // or any free port, e.g., 5175
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  plugins: [react()],
}) 