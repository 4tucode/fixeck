<script setup>
import { Toaster } from 'vue-sonner'
import 'vue-sonner/style.css'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { useTheme } from '@/composables/useTheme'

const { isDark } = useTheme()
</script>

<template>
  <!-- Contenedor general: aplica fondo, color de texto y tipografía según el tema -->
  <div class="min-h-screen bg-crema font-sans text-noche transition-colors dark:bg-noche dark:text-white">
    <header class="fixed top-4 right-4 z-10">
      <ThemeToggle />
    </header>

    <!-- Aquí se pinta la vista de la ruta actual -->
    <RouterView />

    <!-- Avisos emergentes de toda la app (se lanzan desde utils/notify.js).
         richColors pinta de verde los de éxito y de rojo los de error -->
    <Toaster position="bottom-center" rich-colors :theme="isDark ? 'dark' : 'light'" />
  </div>
</template>
