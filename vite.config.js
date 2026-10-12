import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    // Permite importar con "@/..." en lugar de rutas relativas largas
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Configuración de los tests (npm test): jsdom simula un navegador para poder montar componentes
  test: {
    environment: 'jsdom',
  },
})
