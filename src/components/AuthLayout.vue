<script setup>
import FixeckLogo from '@/components/FixeckLogo.vue'

// Estructura común de las pantallas de acceso (entrar, crear cuenta, recuperar contraseña).
// Tiene dos zonas: un panel de marca con el gallo animado y, al lado, el contenido de cada pantalla.
// En escritorio se reparten la pantalla a medias; en móvil el panel se queda en una franja arriba.
// Al compartirla, todas las pantallas tienen el mismo diseño y un cambio aquí se aplica a todas.
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
})
</script>

<template>
  <!-- En móvil se deja sitio arriba para el botón de tema, que es fijo y taparía el panel -->
  <main class="grid min-h-screen gap-6 px-4 pt-16 pb-6 lg:grid-cols-2 lg:gap-0 lg:p-5">
    <!-- Panel de marca. La clase "dark" hace que todo lo que contiene use siempre los colores
         del modo oscuro, porque el panel es azul noche también cuando la app está en modo claro -->
    <section
      class="dark flex items-center gap-5 rounded-4xl bg-panel px-6 py-5 text-white lg:flex-col lg:justify-center lg:gap-0 lg:px-10 lg:py-12 lg:text-center"
    >
      <FixeckLogo animated class="h-24 w-auto shrink-0 lg:h-72" />

      <div>
        <p class="font-display text-4xl leading-none font-semibold tracking-tight lg:mt-8 lg:text-7xl">fixeck</p>
        <p class="mt-3 hidden text-xl text-white/70 lg:block">Tu jornada, a su hora.</p>

        <!-- Hueco opcional bajo la marca; el login lo usa para el reloj -->
        <div v-if="$slots.hero" class="mt-3 lg:mt-12">
          <slot name="hero" />
        </div>
      </div>
    </section>

    <!-- Contenido de cada pantalla -->
    <section class="flex justify-center px-1 lg:items-center lg:px-12">
      <div class="w-full max-w-sm">
        <h1 class="font-display text-3xl font-semibold">{{ title }}</h1>
        <p class="mt-2 text-noche/70 dark:text-white/70">{{ subtitle }}</p>

        <!-- El formulario y los botones propios de la pantalla -->
        <div class="mt-8">
          <slot />
        </div>

        <!-- Enlaces para ir a las otras pantallas de acceso -->
        <p class="mt-8 text-center text-sm">
          <slot name="footer" />
        </p>
      </div>
    </section>
  </main>
</template>
