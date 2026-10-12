<script setup>
import FixeckLogo from '@/components/FixeckLogo.vue'

// Estructura común de las pantallas de acceso (entrar, crear cuenta, recuperar contraseña):
// logo, título, texto de ayuda y, debajo, el contenido propio de cada pantalla.
// Al compartirla, todas tienen el mismo diseño y un cambio aquí se aplica a todas.
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
})
</script>

<template>
  <main class="flex min-h-screen items-center justify-center px-5 py-20">
    <div class="w-full max-w-sm">
      <!-- Marca -->
      <div class="flex flex-col items-center">
        <FixeckLogo class="h-24 w-auto" />
        <p class="mt-1 font-display text-4xl leading-none font-semibold tracking-tight">fixeck</p>
      </div>

      <h1 class="mt-10 font-display text-3xl font-semibold">{{ title }}</h1>
      <p class="mt-2 text-noche/70 dark:text-white/70">{{ subtitle }}</p>

      <!-- Contenido de cada pantalla: su formulario y sus botones -->
      <div class="mt-8">
        <slot />
      </div>

      <!-- Enlaces para ir a las otras pantallas de acceso -->
      <p class="mt-8 text-center text-sm">
        <slot name="footer" />
      </p>
    </div>
  </main>
</template>
