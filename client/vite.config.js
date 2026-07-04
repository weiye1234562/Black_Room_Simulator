import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      },
      '/cards': {
        target: 'http://localhost:3001',
      },
      '/wallpapers': {
        target: 'http://localhost:3001',
      },
    },
  },
})
